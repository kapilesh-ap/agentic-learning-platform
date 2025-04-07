import React, { useState, useEffect, Suspense, lazy } from "react";
import axios from "axios";
import { 
  Upload, 
  FileText, 
  Server, 
  Command, 
  Check, 
  Trash2, 
  FileIcon, 
  Clock, 
  AlertCircle,
  Database,
  UploadCloud,
  RefreshCw,
  Calendar,
  ChevronRight,
  Play,
  Loader,
  File,
  Eye,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X
} from "lucide-react";
import "./App.css";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <AlertCircle size={40} className="error-icon" />
          <h2>Something went wrong</h2>
          <p>We're sorry, an error occurred in this section.</p>
          <button className="action-button" onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Skeleton Component for Loading States
const Skeleton = ({ type }) => {
  if (type === "upload") {
    return (
      <div className="skeleton-container">
        <div className="skeleton-title"></div>
        <div className="skeleton-upload-area"></div>
        <div className="skeleton-buttons">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    );
  }
  
  if (type === "history") {
    return (
      <div className="skeleton-container">
        <div className="skeleton-title"></div>
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="skeleton-history-item"></div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="skeleton-container">
      <div className="skeleton-title"></div>
      <div className="skeleton-content"></div>
    </div>
  );
};

// File Preview Component
const FilePreview = ({ content, filename, onClose }) => {
  return (
    <div className="file-preview-overlay">
      <div className="file-preview-container">
        <div className="file-preview-header">
          <h3>Preview: {filename}</h3>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="file-preview-content">
          <pre>{content}</pre>
        </div>
      </div>
    </div>
  );
};

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [namespace, setNamespace] = useState("");
  const [filename, setFilename] = useState("");
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Pagination for history
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    const initApp = async () => {
      setIsAppLoading(true);
      try {
        await Promise.all([loadPrompts(), loadUploads()]);
      } catch (err) {
        setError("Failed to initialize application. Please refresh.");
      } finally {
        setIsAppLoading(false);
      }
    };
    
    initApp();
  }, []);

  const loadPrompts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/prompts`);
      setPrompts(res.data);
      return res.data;
    } catch (err) {
      setError("Failed to load prompts.");
      throw err;
    }
  };

  const loadUploads = async () => {
    try {
      const res = await axios.get(`${API_BASE}/list-uploads`);
      setUploads(res.data.uploads || []);
      return res.data.uploads;
    } catch (err) {
      setError("Failed to load upload history.");
      throw err;
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setMessage("");
    setResult("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API_BASE}/upload-transcript`, formData);
      setQuery(res.data.transcript_text);
      setNamespace(res.data.namespace);
      setFilename(res.data.filename);
      setMessage("File uploaded successfully.");
    } catch (err) {
      setError("Upload failed: " + err.message);
    }
    setLoading(false);
  };

  const handleFullProcess = async () => {
    if (!query || !namespace || !filename) return;
    setLoading(true);
    setError("");
    setMessage("");
    setResult("");
    try {
      await axios.post(`${API_BASE}/process-transcript`, {
        transcript: query,
        namespace,
        filename,
      });
      console.log( 
        namespace,
        filename)

      setMessage("Transcript processed into vector database.");
      loadUploads();
    } catch (err) {
      setError("RAG processing failed: " + err.message);
    }
    setLoading(false);
  };

  const handlePromptProcess = async () => {
    if (!prompt || !namespace) return;
    setLoading(true);
    setError("");
    setMessage("");
    setResult("");
    try {
      const res = await axios.post(`${API_BASE}/process-with-prompt`, {
        transcript_text: query,
        prompt_name: prompt,
        namespace,
      });
      setResult(res.data.response || JSON.stringify(res.data, null, 2));
    } catch (err) {
      setError("Prompt processing failed: " + err.message);
    }
    setLoading(false);
  };

  const handleDeleteNamespace = async (ns) => {
    if (!window.confirm(`Are you sure you want to delete "${ns}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/delete-namespace/${ns}`);
      loadUploads();
      if (namespace === ns) {
        setNamespace("");
        setFilename("");
        setQuery("");
        setResult("");
        setPrompt("");
      }
      setMessage("Deleted successfully.");
    } catch (err) {
      setError("Deletion failed: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // File preview functionality
  const handleFilePreview = () => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
      setPreviewVisible(true);
    };
    reader.readAsText(file);
  };

  // File drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Pagination handlers
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUploads = uploads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(uploads.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const tabContent = {
    upload: (
      <ErrorBoundary>
        <div className="content-card">
          <h2 className="content-title">
            <UploadCloud size={22} className="icon-title" />
            Upload Transcript
          </h2>
          <div 
            className={`file-upload-container ${dragActive ? "drag-active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label className="file-upload-label">
              <div className="file-upload-area">
                <UploadCloud size={40} className="upload-icon" />
                <span className="upload-text">{file ? file.name : "Drop your file here or click to browse"}</span>
                <span className="upload-hint">Supports .txt or .docx files</span>
              </div>
              <input 
                type="file" 
                className="file-input" 
                onChange={(e) => setFile(e.target.files[0])}
                accept=".txt,.docx"
              />
            </label>
          </div>

          <div className="action-buttons">
            {file && (
              <button 
                className="preview-button" 
                onClick={handleFilePreview}
                disabled={!file}
              >
                <Eye size={16} /> Preview
              </button>
            )}
            <button 
              className={`action-button ${!file || loading ? "disabled" : ""}`} 
              onClick={handleUpload} 
              disabled={!file || loading}
            >
              {loading ? <><Loader size={16} className="spinner" /> Uploading...</> : <><Upload size={16} /> Upload</>}
            </button>
            <button 
              className={`action-button ${!query || loading ? "disabled" : ""}`} 
              onClick={handleFullProcess} 
              disabled={!query || loading}
            >
              {loading ? <><Loader size={16} className="spinner" /> Processing...</> : <><Database size={16} /> Process to RAG</>}
            </button>
          </div>

          {namespace && filename && (
            <div className="selection-info">
              <div className="selected-file">
                <FileText size={16} />
                <span>Selected: {filename}</span>
              </div>
              <div className="selected-namespace">
                <Database size={16} />
                <span>Namespace: {namespace.slice(0, 8)}...</span>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    ),
    process: (
      <ErrorBoundary>
        <div className="content-card">
          <h2 className="content-title">
            <Command size={22} className="icon-title" />
            Run Prompts
          </h2>
          
          {namespace ? (
            <>
              <div className="prompt-selection">
                <label className="prompt-label">Select Prompt Template</label>
                <div className="custom-select">
                  <select 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)}
                    className="prompt-select"
                  >
                    <option value="">-- Select Prompt --</option>
                    {prompts.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronRight size={18} className="select-icon" />
                </div>
              </div>

              <button
                className={`run-prompt-button ${!prompt || !namespace || loading ? "disabled" : ""}`}
                onClick={handlePromptProcess}
                disabled={!prompt || !namespace || loading}
              >
                {loading ? <><Loader size={16} className="spinner" /> Running...</> : <><Play size={16} /> Run Prompt</>}
              </button>
            </>
          ) : (
            <div className="no-file-message">
              <AlertCircle size={40} />
              <p>Please upload and process a transcript first</p>
            </div>
          )}
        </div>
      </ErrorBoundary>
    ),
    history: (
      <ErrorBoundary>
        <div className="content-card">
          <h2 className="content-title">
            <Calendar size={22} className="icon-title" />
            Upload History
          </h2>
          {uploads.length > 0 ? (
            <>
              <div className="history-container">
                {currentUploads.map((item) => (
                  <div key={item.namespace} className="history-item">
                    <div 
                      className="history-item-main"
                      onClick={() => {
                        setNamespace(item.namespace);
                        setFilename(item.filename);
                        setQuery(""); 
                        setResult("");
                        setMessage(`Selected "${item.filename}"`);
                      }}
                    >
                      <div className="history-item-icon">
                        <File size={18} />
                      </div>
                      <div className="history-item-details">
                        <div className="history-item-name">{item.filename}</div>
                        <div className="history-item-meta">
                          <span className="history-item-id">
                            <Database size={14} /> {item.namespace.slice(0, 8)}...
                          </span>
                          <span className="history-item-date">
                            <Clock size={14} /> {formatDate(item.uploaded_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteNamespace(item.namespace)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-button"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    className="pagination-button"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-history-message">
              <AlertCircle size={40} />
              <p>No uploads found</p>
            </div>
          )}
        </div>
      </ErrorBoundary>
    )
  };

  // Show file preview modal if active
  if (previewVisible) {
    return (
      <FilePreview 
        content={fileContent} 
        filename={file?.name || ""}
        onClose={() => setPreviewVisible(false)}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <Server size={24} />
          <h1>RAG Processor</h1>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={20} />
            <span>Upload</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'process' ? 'active' : ''}`}
            onClick={() => setActiveTab('process')}
          >
            <Command size={20} />
            <span>Process</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Calendar size={20} />
            <span>History</span>
          </button>
        </nav>
      </div>

      <div className="main-content">
        <div className="content-header">
          <h1 className="page-title">RAG Transcript Processor</h1>
          <button className="refresh-button" onClick={loadUploads} title="Refresh Data">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Global App Loading State */}
        {isAppLoading ? (
          <Skeleton type={activeTab} />
        ) : (
          <>
            {/* Message and Errors */}
            {message && (
              <div className="message-box success">
                <Check size={18} />
                <span>{message}</span>
              </div>
            )}
            
            {error && (
              <div className="message-box error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Main Content Area */}
            {tabContent[activeTab]}

            {/* Prompt Output */}
            {result && (
              <div className="output-container">
                <div className="output-header">
                  <h3>Prompt Output</h3>
                </div>
                <pre className="output-content">{result}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;