from fastapi import FastAPI, UploadFile, File 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from groq import Groq
import os
import json
from dotenv import load_dotenv
from docx import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document as LCDocument
from pinecone import Pinecone, ServerlessSpec
import uuid
from datetime import datetime
import hashlib

# Load API keys and env variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")

client = Groq(api_key=GROQ_API_KEY)

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranscriptInput(BaseModel):
    transcript: str
    namespace: str
    filename: str

# === Prompt Registry ===
prompt_registry = {}


def get_file_hash(content: bytes) -> str:
    """Generate a SHA256 hash for given file content."""
    return hashlib.sha256(content).hexdigest()

def load_prompt_registry():
    global prompt_registry
    try:
        with open("prompts/prompt_registry.json", "r") as f:
            prompt_registry = json.load(f)
            print("✅ Prompt registry loaded:", list(prompt_registry.keys()))
    except Exception as e:
        print("❌ Failed to load prompt registry:", e)
        prompt_registry = {}

@app.on_event("startup")
def startup_event():
    load_prompt_registry()

# === RAG Components ===
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
pc = Pinecone(api_key=PINECONE_API_KEY)

if PINECONE_INDEX not in pc.list_indexes().names():
    pc.create_index(
        name=PINECONE_INDEX,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
index = pc.Index(PINECONE_INDEX)   
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

# === Request Models ===


class QueryRequest(BaseModel):
    query: str
    namespace: str

class TranscriptProcessRequest(BaseModel):
    transcript_text: str
    prompt_name: str
    namespace: str

# === Helpers ===
def generate_completion(prompt_name: str, variables: dict) -> str:
    prompt_data = prompt_registry.get(prompt_name)
    if not prompt_data:
        return f"Prompt '{prompt_name}' not found."

    
 # 1. Serialize the output format
    output_format = json.dumps(prompt_data.get("output_format", {}), indent=2)

    # 2. Escape braces in output_format so it doesn't conflict with .format()
    escaped_output_format = output_format.replace("{", "{{").replace("}", "}}")

    # 3. Combine template and output format
    prompt_template = (
        f"{prompt_data['prompt_template']}\n\n"
        f"Output Format Instructions:\n{escaped_output_format}"
    )

    # 4. Format prompt with variables
    try:
        filled_prompt = prompt_template.format(**variables)
    except KeyError as ke:
        raise ValueError(f"Missing variable for prompt: {ke}")
   
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": filled_prompt}
        ]
    )
    
    return completion.choices[0].message.content

# === API Routes ===

def get_cached_metadata(namespace: str):
    try:
        response = index.fetch(ids=[f"{namespace}_meta"], namespace=namespace)
        metadata = response.get("vectors", {}).get(f"{namespace}_meta", {}).get("metadata", {})
        return metadata or {}
    except Exception as e:
        return {}



@app.post("/process-transcript")
async def process_transcript(input: TranscriptInput):
    anchor_id = f"{input.namespace}_meta"
    now = datetime.utcnow().isoformat() + "Z"
    print("working")

    try:
        # Check if namespace already exists
        stats = index.describe_index_stats()
        namespace_data = stats.get('namespaces', {}).get(input.namespace, {})

        if namespace_data.get('vector_count', 0) > 0:
            print(f"🟡 Skipping upsert — namespace '{input.namespace}' already exists.")
        else:
            # Step 1: Clean and embed transcript
            print("working 1")
            cleaned_text = generate_completion("preprocessing_prompt", {"transcript": input.transcript})
        
            chunks = text_splitter.split_text(cleaned_text)
            print(chunks)
            vectors = []
            try:
                for i, chunk in enumerate(chunks):
                    embedding = embeddings.embed_query(chunk)
                    vectors.append({
                        "id": str(uuid.uuid4()),
                        "values": embedding,
                        "metadata": {
                            "text": chunk,
                            "chunk": i,
                            "filename": input.filename,
                            "timestamp": now
                        }
                    })
            except Exception as e:
                print(f"⚠️ Failed to fetch: {e}")
            index.upsert(vectors=vectors, namespace=input.namespace)
            print(f"✅ {len(vectors)} chunks embedded and stored in Pinecone.")

    except Exception as e:
        return {"error": f"Namespace check or embedding failed: {str(e)}"}

    # Step 2: Try to fetch cached metadata vector
    try:
        fetch_result = index.fetch(ids=[anchor_id], namespace=input.namespace)
        anchor_vector = fetch_result.vectors.get(anchor_id)
        existing_meta = anchor_vector.metadata if anchor_vector and anchor_vector.metadata else {}

    except Exception as e:
        print(f"⚠️ Failed to fetch anchor metadata: {e}")
        existing_meta = {}

    # Step 3: Query for RAG context
    results = index.query(
        namespace=input.namespace,
        vector=embeddings.embed_query(input.transcript),
        top_k=3,
        include_metadata=True
    )
    context = "\n\n".join([
            match["metadata"].get("text", "") 
            for match in results["matches"] 
            if "metadata" in match and "text" in match["metadata"]
        ])

    # Step 4: Generate completions or use cached
    summary = existing_meta.get("summary") or generate_completion("summary_prompt", {"transcript": context})
    tasks = existing_meta.get("tasks") or generate_completion("task_extraction_prompt", {"transcript": context})
    structured_json = existing_meta.get("structured_output") or generate_completion("json_structuring_prompt", {"transcript": tasks})

    # Step 5: Re-cache only if some were missing
    if not existing_meta.get("summary") or not existing_meta.get("tasks") or not existing_meta.get("structured_output"):
        try:
            index.upsert(vectors=[{
                "id": anchor_id,
                "values": [0.01] * 384,  # Non-zero to satisfy Pinecone
                "metadata": {
                    "summary": summary,
                    "tasks": tasks,
                    "structured_output": structured_json,
                    "filename": input.filename,
                    "timestamp": now
                }
            }], namespace=input.namespace)
            print("✅ Metadata anchor upserted to cache results.")
        except Exception as e:
            print(f"⚠️ Failed to cache anchor metadata: {e}")

    # Final response
    return {
    "message": f"Transcript stored in namespace '{input.namespace}'",
    "namespace": input.namespace,
    "filename": input.filename,
    "uploaded_at": now
}

@app.get("/list-uploads")
def list_uploaded_files():
    try:
        stats = index.describe_index_stats()
        uploads = []

        for namespace, data in stats.get("namespaces", {}).items():
            meta_id = f"{namespace}_meta"
            fetch_result = index.fetch(ids=[meta_id], namespace=namespace)

            if hasattr(fetch_result, "vectors") and meta_id in fetch_result.vectors:
                meta_vector = fetch_result.vectors[meta_id]
                meta_data = meta_vector.metadata or {}
                
                uploads.append({
                    "namespace": namespace,
                    "filename": meta_data.get("filename", "N/A"),
                    "uploaded_at": meta_data.get("timestamp", "N/A")
                })
            else:
                print(f"⚠️ No metadata found for '{meta_id}' in namespace '{namespace}'")

        return {"uploads": uploads}
    
    except Exception as e:
        return {"error": str(e)}


@app.delete("/delete-namespace/{namespace}")
def delete_namespace(namespace: str):
    try:
        index.delete(delete_all=True, namespace=namespace)
        return {"message": f"✅ Deleted namespace '{namespace}' and all associated data."}
    except Exception as e:
        return {"error": str(e)}


@app.post("/query")
async def query_index(req: QueryRequest):
    try:
        results = index.query(
            namespace=req.namespace,
            vector=embeddings.embed_query(req.query),
            top_k=3,
            include_metadata=True
        )
        chunks = "\n\n".join([match["metadata"]["text"] for match in results["matches"]])
        answer = generate_completion("query_prompt", {"transcript": chunks, "question": req.query})
        return {"response": answer, "matches": chunks}
    except Exception as e:
        return {"error": str(e)}

def read_docx(file_path: str) -> str:
    try:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    except Exception as e:
        return f"Error reading DOCX: {str(e)}"


def generate_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


@app.post("/upload-transcript")
async def upload_transcript(file: UploadFile = File(...)):
    content = await file.read()

    if not file.filename.endswith((".txt", ".docx")):
        return {"error": "Unsupported file type. Only .txt or .docx allowed."}

    file_hash = generate_file_hash(content)
    namespace = file_hash  # Use this to track transcript uniqueness

    if file.filename.endswith(".txt"):
        text = content.decode("utf-8")
    elif file.filename.endswith(".docx"):
        with open("temp.docx", "wb") as f:
            f.write(content)
        text = read_docx("temp.docx")
        os.remove("temp.docx")

    return {
        "transcript_text": text,
        "namespace": namespace,
        "filename": file.filename
    }

@app.post("/process-with-prompt")
async def process_with_prompt(req: TranscriptProcessRequest):
    try:
        # Step 1: Attempt to fetch the metadata anchor
        anchor_id = f"{req.namespace}_meta"
        try:
            fetch_result = index.fetch(ids=[anchor_id], namespace=req.namespace)
            vector = fetch_result.vectors.get(anchor_id)
            anchor_data = vector.metadata if vector and vector.metadata else {}
        except Exception as e:
            print(f"⚠️ Failed to fetch metadata anchor: {e}")
            anchor_data = {}

        # Step 2: Return cached response if exists
        if req.prompt_name in anchor_data:
            print(f"📦 Cached result found for prompt: {req.prompt_name}")
            return {
                "response": anchor_data[req.prompt_name],
                "used_context": "[CACHED]"
            }

        # Step 3: Perform RAG context search
        results = index.query(
            namespace=req.namespace,
            vector=embeddings.embed_query(req.transcript_text),
            top_k=3,
            include_metadata=True
        )
        matches = results.get("matches", [])
        if not matches:
            return {"error": "No context found in Pinecone. Please process the transcript first."}

        context =  "\n\n".join([
                    match["metadata"].get("text", "") 
                    for match in results["matches"] 
                    if "metadata" in match and "text" in match["metadata"]
                ])

        # Step 4: Fill prompt template
        prompt_data = prompt_registry.get(req.prompt_name)
        if not prompt_data:
            return {"error": f"Prompt '{req.prompt_name}' not found in registry."}

        variables = {}
        for var in prompt_data.get("input_variables", []):
            if var == "transcript":
                variables[var] = context
            elif var == "question":
                variables[var] = req.transcript_text
            elif var == "language":
                variables[var] = "English"

        response = generate_completion(req.prompt_name, variables)

        # Step 5: Update metadata and upsert anchor with non-zero dummy vector
        anchor_data[req.prompt_name] = response
        dummy_vector = [0.001] + [0.0] * 383
        try:
            index.upsert(vectors=[{
                "id": anchor_id,
                "values": dummy_vector,
                "metadata": anchor_data
            }], namespace=req.namespace)
            print(f"📝 Cached new response for prompt: {req.prompt_name}")
        except Exception as e:
            print(f"⚠️ Failed to cache response: {e}")

        return {
            "response": response,
            "used_context": context
        }

    except Exception as e:
        return {"error": str(e)}



@app.get("/prompts")
def list_prompts():
    return list(prompt_registry.keys())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
