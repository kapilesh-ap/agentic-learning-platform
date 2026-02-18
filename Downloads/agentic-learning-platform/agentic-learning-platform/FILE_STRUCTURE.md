# Project File Structure - Groq Version

## 📁 Complete File List

### Configuration Files
```
├── package.json              # Dependencies (using groq-sdk)
├── tsconfig.json            # TypeScript configuration
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
├── .env.example             # Environment variables template (GROQ_API_KEY)
├── .gitignore              # Git ignore rules
└── setup.sh                # Automated setup script
```

### Documentation
```
├── README.md               # Complete project documentation (Groq version)
├── QUICKSTART.md           # 5-minute quick start guide
├── EXAMPLES.md             # 7 example workflows
└── FILE_STRUCTURE.md       # This file
```

### Database Files
```
prisma/
├── schema.prisma           # Database schema (Customers, Products, Transactions, Alerts)
└── seed.ts                 # Sample data seeder (30+ transactions with anomalies)
```

### Agent Logic (Mastra AI + Groq)
```
src/agents/
└── index.ts                # All 5 agents using Groq API:
                            # - Data Agent
                            # - Talk to Data Agent
                            # - Anomaly Detection Agent
                            # - Alert Agent
                            # - Orchestration Agent
```

### API Routes
```
src/app/api/
├── agents/
│   └── route.ts           # POST endpoint to execute agents
└── db/
    └── test/
        └── route.ts       # GET endpoint to test DB connection
```

### Frontend Components
```
src/components/
├── AgentWorkspace.tsx      # Main canvas with drag-and-drop (ReactFlow)
├── AgentNode.tsx           # Visual node component for agents
├── AgentPalette.tsx        # Draggable agent list sidebar
├── AgentChat.tsx           # Chat interface to talk with agents
├── PromptEditor.tsx        # System prompt editor
└── DataConnectionStatus.tsx # Database connection indicator
```

### App Pages
```
src/app/
├── layout.tsx             # Root layout
├── page.tsx               # Home page
└── globals.css            # Global styles + Tailwind
```

### Library Files
```
src/lib/
└── agent-configs.ts       # Agent metadata (names, colors, descriptions)
```

## 🔑 Key Changes from Anthropic to Groq

### 1. package.json
```diff
- "@anthropic-ai/sdk": "^0.32.1"
+ "groq-sdk": "^0.7.0"
```

### 2. .env.example
```diff
- ANTHROPIC_API_KEY="your_api_key_here"
+ GROQ_API_KEY="your_groq_api_key_here"
```

### 3. src/agents/index.ts
```diff
- import Anthropic from '@anthropic-ai/sdk'
- const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
+ import Groq from 'groq-sdk'
+ const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

Agent model configuration:
- provider: 'ANTHROPIC'
- name: 'claude-sonnet-4-20250514'
+ provider: 'GROQ'
+ name: 'llama-3.3-70b-versatile'
```

## 🚀 Models Used

**Groq Model**: `llama-3.3-70b-versatile`
- Fast inference (via Groq's LPU architecture)
- 70B parameter Llama 3.3 model
- Good for reasoning and tool calling
- Cost-effective compared to other large models

## 📊 Database Schema

### Customers Table
- id, name, email, phone, address, city, country
- createdAt, updatedAt

### Products Table
- id, name, description, category, price, stock, sku
- createdAt, updatedAt

### Transactions Table
- id, customerId, total, status, paymentMethod
- createdAt, updatedAt
- Relations: customer, items[]

### TransactionItems Table
- id, transactionId, productId, quantity, price
- Relations: transaction, product

### Alerts Table
- id, type, severity, title, message, metadata
- resolved, createdAt, resolvedAt

## 🎯 Agent Architecture

Each agent has:
1. **Name** - Descriptive identifier
2. **Instructions** - System prompt defining behavior
3. **Model Config** - Groq provider + Llama 3.3 70B
4. **Tools** - Functions the agent can call:
   - queryDatabase()
   - detectAnomalies()
   - sendAlert()

## 🔧 Tool Calling Flow

```
User Query
    ↓
Agent receives message
    ↓
Agent decides which tool to use
    ↓
Tool executes (database query, anomaly scan, etc.)
    ↓
Tool returns results
    ↓
Agent processes and responds
    ↓
User sees formatted response
```

## 💡 Usage Patterns

### Simple Queries
```typescript
User: "Show me all customers"
Agent: queryDatabase("customers") → Returns JSON → Formats for user
```

### Complex Workflows
```typescript
User: "Find anomalies and create alerts"
Orchestration Agent:
  1. Calls detectAnomalies()
  2. Analyzes results
  3. For each critical anomaly:
     - Calls sendAlert()
  4. Returns summary
```

## 🎨 UI Components Hierarchy

```
AgentWorkspace (Main Container)
├── DataConnectionStatus (Sidebar - Left)
│   └── Shows DB connection + stats
├── AgentPalette (Sidebar - Left)
│   └── Draggable agent cards
├── ReactFlow Canvas (Center)
│   ├── AgentNode (Multiple instances)
│   ├── Edges (Connections)
│   ├── Controls (Zoom, pan)
│   └── MiniMap
└── Right Sidebar (Conditional)
    ├── PromptEditor (When agent selected)
    │   ├── System prompt textarea
    │   ├── Edit/Save/Reset buttons
    │   └── Tips
    └── AgentChat (When agent selected)
        ├── Message history
        ├── Example prompts
        └── Input field + Send button
```

## 🔄 Data Flow

1. **User drags agent** → Creates node in canvas
2. **User connects agents** → Creates edge relationship
3. **User clicks agent** → Opens PromptEditor + AgentChat
4. **User edits prompt** → Updates node.data.customPrompt
5. **User sends message** → POST /api/agents
6. **API executes agent** → Calls Mastra with Groq
7. **Agent uses tools** → Queries DB, detects anomalies, etc.
8. **Response returned** → Displayed in chat

## 📦 Dependencies

### Core
- next@14.2.18 - React framework
- react@18.3.1 - UI library
- react-dom@18.3.1 - DOM bindings

### AI/Agents
- @mastra/core@0.1.0 - Agent orchestration
- groq-sdk@0.7.0 - Groq API client

### Database
- @prisma/client@5.22.0 - Database ORM
- prisma@5.22.0 - Schema management

### UI
- reactflow@11.11.4 - Drag-and-drop canvas
- lucide-react@0.454.0 - Icons
- tailwindcss@3.4.14 - Styling

### State Management
- zustand@4.5.5 - State management (via ReactFlow)

### Utilities
- zod@3.23.8 - Schema validation
- typescript@5 - Type safety
- tsx@4.19.1 - TypeScript execution

## 🎓 Learning Path

### Beginner
1. Run the setup script
2. Try the Data Agent with simple queries
3. Edit prompts and see behavior change
4. Connect two agents visually

### Intermediate
1. Create custom agent workflows
2. Modify agent system prompts
3. Build multi-step pipelines
4. Test anomaly detection

### Advanced
1. Add custom tools to agents
2. Create new agent types
3. Integrate external APIs
4. Build automation workflows

## 🐛 Common Issues & Solutions

### "Cannot find module 'groq-sdk'"
```bash
npm install
```

### "Database connection failed"
```bash
# Check PostgreSQL is running
pg_isready

# Verify .env
cat .env | grep DATABASE_URL

# Reset database
npm run db:push -- --force-reset
npm run db:seed
```

### "Groq API error"
```bash
# Check API key
cat .env | grep GROQ_API_KEY

# Test API key manually
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

### "Agent not using tools"
- Verify tools are defined in agent config
- Check tool function signatures match parameters
- Ensure database connection is active

## 📈 Performance Notes

### Groq Advantages
- **Speed**: ~280 tokens/second inference
- **Cost**: Lower than GPT-4/Claude for most tasks
- **Free Tier**: Generous free usage
- **Tool Calling**: Native function calling support

### Database Optimization
- Sample data limited to 30 transactions
- Indexes on frequently queried fields
- Connection pooling via Prisma

### Frontend Performance
- ReactFlow optimized for 100+ nodes
- Component memoization (React.memo)
- Lazy loading for chat history

## 🔒 Security Considerations

1. **API Keys**: Never commit .env to git
2. **Database**: Use connection pooling
3. **Input Validation**: Zod schemas on API routes
4. **SQL Injection**: Prisma ORM prevents this
5. **Rate Limiting**: Consider adding for production

## 🚀 Deployment Checklist

- [ ] Set environment variables on hosting platform
- [ ] Configure PostgreSQL database (Vercel Postgres, Supabase, etc.)
- [ ] Run database migrations
- [ ] Seed production database (optional)
- [ ] Test Groq API connection
- [ ] Configure CORS if needed
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Add rate limiting
- [ ] Configure caching (Redis, etc.)

## 📝 Notes

- This is an **educational platform** - not production-ready
- Focus on learning agent orchestration concepts
- Groq provides fast, cost-effective inference
- Mastra AI simplifies agent management
- All agents use the same Llama 3.3 70B model for consistency
