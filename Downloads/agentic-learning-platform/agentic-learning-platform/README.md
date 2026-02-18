# Agentic AI Learning Platform

An interactive learning platform to understand how AI agents work together using **Mastra AI** for agent orchestration. Drag, drop, and connect agents to see them collaborate on real business data.

![Platform Overview](https://img.shields.io/badge/Next.js-14-black) ![Mastra AI](https://img.shields.io/badge/Mastra-AI-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🎯 What This Platform Does

This is an educational tool that demonstrates how agentic AI systems work by:

1. **Visualizing Agent Workflows** - Drag-and-drop interface to build agent networks
2. **Real Data Integration** - Pre-configured PostgreSQL database with business data
3. **Customizable Agents** - Edit system prompts to modify agent behavior
4. **Interactive Testing** - Chat with individual agents to see how they work
5. **Agent Orchestration** - See how multiple agents collaborate using Mastra AI

## 🤖 Available Agents

### 1. Data Agent
- **Purpose**: Connects to database and retrieves structured data
- **Use Case**: Query customers, products, transactions, alerts
- **Tools**: Direct database access

### 2. Talk to Data Agent
- **Purpose**: Natural language interface for data exploration
- **Use Case**: "Who are my top customers?" "What's trending?"
- **Tools**: Database queries + analysis

### 3. Anomaly Detection Agent
- **Purpose**: Identifies unusual patterns in business data
- **Use Case**: Find suspicious transactions, detect fraud
- **Tools**: Statistical analysis, pattern detection

### 4. Alert Agent
- **Purpose**: Creates and manages system notifications
- **Use Case**: Send alerts for critical issues
- **Tools**: Alert creation, notification system

### 5. Orchestration Agent
- **Purpose**: Coordinates multiple agents for complex workflows
- **Use Case**: "Analyze sales and alert on anomalies"
- **Tools**: All agent capabilities combined

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ database
- **Groq API Key** ([Get one here](https://console.groq.com/))

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to the project
cd agentic-learning-platform

# Install dependencies
npm install
```

### 2. Set Up Database

```bash
# Create a PostgreSQL database
createdb agentic_learning

# Or using psql
psql -U postgres -c "CREATE DATABASE agentic_learning;"
```

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Update `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/agentic_learning?schema=public"
GROQ_API_KEY="your_groq_api_key_here"
```

### 4. Initialize Database

```bash
# Push the schema to your database
npm run db:push

# Seed with sample data
npm run db:seed
```

This will create:
- 5 customers
- 8 products
- 30+ transactions (including anomalies)
- Sample alerts

### 5. Run the Application

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 How to Use

### Building Your First Workflow

1. **Check Data Connection**: Verify the green "Connected" indicator in the top-left
2. **Drag an Agent**: Drag the "Data Agent" from the palette onto the canvas
3. **Add More Agents**: Add "Talk to Data Agent" and "Anomaly Agent"
4. **Connect Agents**: Drag from the bottom handle of one agent to the top of another
5. **Configure**: Click an agent to edit its prompt or chat with it

### Example Workflows

#### Simple Data Query
```
Data Agent → Talk to Data Agent
```
Ask: "Show me customers with failed transactions"

#### Anomaly Detection + Alerts
```
Data Agent → Anomaly Agent → Alert Agent
```
The system will detect anomalies and automatically create alerts

#### Full Analysis Pipeline
```
Orchestration Agent
  ├─→ Data Agent
  ├─→ Anomaly Agent  
  └─→ Alert Agent
```
Ask: "Analyze all transactions and alert me of any issues"

## 🛠️ Customizing Agents

### Editing Prompts

1. Click on any agent in the canvas
2. Click "Edit" in the Prompt Editor panel
3. Modify the system prompt
4. Click "Save"

**Example customization** - Make the Data Agent more verbose:

```
You are a Data Agent with a friendly, conversational tone.

Your role is to:
- Query the database with enthusiasm
- Explain your findings in detail
- Provide context and insights
- Suggest related queries

Always start responses with "Here's what I found..."
```

### Creating Custom Queries

The agents understand natural language. Try:

**For Data Agent:**
- "Show me all customers from New York"
- "List products under $50"
- "Get transactions from the last week"

**For Anomaly Agent:**
- "Find any customers with more than 3 failed transactions"
- "Detect unusually high-value purchases"
- "Check for refund patterns"

**For Talk to Data Agent:**
- "What's our average transaction value?"
- "Who are the VIP customers?"
- "Which products aren't selling?"

## 📊 Sample Data Overview

The seeded database includes:

| Table | Count | Notes |
|-------|-------|-------|
| Customers | 5 | Various locations |
| Products | 8 | Electronics & accessories |
| Transactions | 30+ | Mix of normal and anomalous |
| Alerts | 2 | Pre-generated examples |

**Intentional Anomalies:**
- 1 transaction over $15,000 (unusually high)
- 5 failed transactions from same customer
- 3 refunded transactions

These anomalies help demonstrate the Anomaly Detection Agent's capabilities.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          Next.js Frontend               │
│  (React Flow + Tailwind + TypeScript)   │
└────────────┬────────────────────────────┘
             │
             ├─→ Agent Workspace (UI)
             ├─→ Drag & Drop Canvas
             └─→ Chat Interface
             │
┌────────────┴────────────────────────────┐
│         Mastra AI Orchestration         │
│    (Agent Management + Tool Calling)    │
└────────────┬────────────────────────────┘
             │
             ├─→ Data Agent
             ├─→ Talk to Data Agent
             ├─→ Anomaly Agent
             ├─→ Alert Agent
             └─→ Orchestration Agent
             │
┌────────────┴────────────────────────────┐
│      Groq API (Llama 3.3 70B)           │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│       PostgreSQL + Prisma ORM           │
│  (Business Data: Customers, Products,   │
│   Transactions, Alerts)                 │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
agentic-learning-platform/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data seeder
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agents/    # Agent execution endpoint
│   │   │   └── db/        # Database test endpoint
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── AgentWorkspace.tsx    # Main canvas
│   │   ├── AgentNode.tsx         # Flow node component
│   │   ├── AgentPalette.tsx      # Draggable agents
│   │   ├── AgentChat.tsx         # Chat interface
│   │   ├── PromptEditor.tsx      # Prompt customization
│   │   └── DataConnectionStatus.tsx
│   ├── agents/
│   │   └── index.ts       # Mastra agent definitions
│   └── lib/
│       └── agent-configs.ts   # Agent metadata
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U your_username -d agentic_learning

# Reset database
npm run db:push -- --force-reset
npm run db:seed
```

### Groq API Errors

- Verify your API key is correct in `.env`
- Check you have credits: https://console.groq.com/
- Ensure you're using a valid model: `llama-3.3-70b-versatile`

### Agent Not Responding

1. Check browser console for errors
2. Verify database connection (green indicator)
3. Ensure `.env` variables are loaded
4. Restart the dev server

## 🎓 Learning Concepts

This platform teaches:

1. **Agent Architecture** - How to structure AI agents with specific roles
2. **Tool Calling** - How agents use tools to interact with data
3. **Prompt Engineering** - How system prompts affect agent behavior
4. **Agent Orchestration** - How multiple agents collaborate
5. **Context Management** - How agents maintain state and memory

## 🚀 Advanced Usage

### Adding Custom Agents

Edit `src/agents/index.ts`:

```typescript
export const customAgent = new Agent({
  name: 'Custom Agent',
  instructions: `Your custom instructions here...`,
  model: {
    provider: 'ANTHROPIC',
    name: 'claude-sonnet-4-20250514',
  },
  tools: {
    customTool: {
      description: 'What this tool does',
      parameters: { /* ... */ },
      execute: async (params) => {
        // Your tool logic
      },
    },
  },
})
```

Then add to the palette in `src/lib/agent-configs.ts`.

### Connecting External APIs

Agents can call any API:

```typescript
tools: {
  fetchWeather: {
    description: 'Get weather data',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' }
      }
    },
    execute: async ({ city }) => {
      const response = await fetch(`https://api.weather.com/${city}`)
      return await response.json()
    }
  }
}
```

## 📝 License

MIT

## 🤝 Contributing

This is an educational project. Feel free to:
- Add new agent types
- Improve the UI/UX
- Add more sample data
- Create tutorials and examples

## 📧 Support

- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Groq Docs: https://console.groq.com/docs
- Mastra AI Docs: https://docs.mastra.ai/

---

**Happy Learning! 🎉**

Built with ❤️ using Next.js, Mastra AI, Groq, and Llama 3.3
