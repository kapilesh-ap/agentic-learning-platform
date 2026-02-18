# Quick Reference Card

## 🚀 Essential Commands

```bash
# Install dependencies
npm install

# Setup database
npm run db:push
npm run db:seed

# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 All Project Files

```
agentic-learning-platform/
│
├── 📄 Configuration
│   ├── package.json          # Dependencies (groq-sdk, mastra, next)
│   ├── tsconfig.json         # TypeScript config
│   ├── next.config.js        # Next.js config
│   ├── tailwind.config.js    # Tailwind CSS
│   ├── .env.example          # Environment template
│   └── setup.sh              # Auto-setup script
│
├── 📚 Documentation
│   ├── README.md             # Main documentation
│   ├── INSTALLATION.md       # Setup guide
│   ├── QUICKSTART.md         # 5-minute start
│   ├── EXAMPLES.md           # Example workflows
│   └── FILE_STRUCTURE.md     # This reference
│
├── 🗄️ Database
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── seed.ts           # Sample data
│
├── 🤖 Agents (Groq + Mastra)
│   └── src/agents/
│       └── index.ts          # 5 agents with Llama 3.3 70B
│
├── 🌐 API Routes
│   └── src/app/api/
│       ├── agents/route.ts   # Execute agents
│       └── db/test/route.ts  # Test DB connection
│
├── 🎨 Components
│   └── src/components/
│       ├── AgentWorkspace.tsx      # Main canvas
│       ├── AgentNode.tsx           # Visual nodes
│       ├── AgentPalette.tsx        # Drag source
│       ├── AgentChat.tsx           # Chat interface
│       ├── PromptEditor.tsx        # Edit prompts
│       └── DataConnectionStatus.tsx # DB status
│
├── 📄 Pages
│   └── src/app/
│       ├── layout.tsx        # Root layout
│       ├── page.tsx          # Home page
│       └── globals.css       # Styles
│
└── 📦 Library
    └── src/lib/
        └── agent-configs.ts  # Agent metadata
```

## 🔑 Environment Variables

```env
# PostgreSQL connection
DATABASE_URL="postgresql://user:pass@localhost:5432/agentic_learning?schema=public"

# Groq API key (get from console.groq.com)
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxx"
```

## 🤖 Available Agents

| Agent | Purpose | Tools |
|-------|---------|-------|
| **Data Agent** | Query database | queryDatabase() |
| **Talk to Data** | Conversational analysis | queryDatabase() |
| **Anomaly Agent** | Detect patterns | detectAnomalies(), queryDatabase() |
| **Alert Agent** | Send notifications | sendAlert(), queryDatabase() |
| **Orchestration** | Coordinate agents | All tools |

## 📊 Database Tables

| Table | Fields | Purpose |
|-------|--------|---------|
| Customer | id, name, email, phone, address, city, country | Customer data |
| Product | id, name, category, price, stock, sku | Product catalog |
| Transaction | id, customerId, total, status, paymentMethod | Purchases |
| TransactionItem | id, transactionId, productId, quantity, price | Order details |
| Alert | id, type, severity, title, message, metadata | Notifications |

## 🎯 Common Queries

### Data Agent
```
"Show me all customers"
"List available products"
"Get recent transactions"
```

### Talk to Data Agent
```
"Who are my top customers?"
"What products are low in stock?"
"Summarize recent sales"
```

### Anomaly Agent
```
"Scan for anomalies"
"Find unusual transactions"
"Check for suspicious patterns"
```

### Alert Agent
```
"Create a test alert"
"Show recent alerts"
"Send notification for high value transaction"
```

### Orchestration Agent
```
"Analyze sales and create alerts for anomalies"
"Find top customers and check for issues"
"Generate a complete business report"
```

## 🔧 Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Cannot find module | `rm -rf node_modules && npm install` |
| Database error | Check PostgreSQL is running, verify DATABASE_URL |
| Agent not responding | Check GROQ_API_KEY, restart server |
| Port in use | `kill -9 $(lsof -ti:3000)` or use different port |
| Prisma errors | `npm run db:push` |
| No data | `npm run db:seed` |

## 📱 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Zoom in | `Cmd/Ctrl + Plus` |
| Zoom out | `Cmd/Ctrl + Minus` |
| Fit view | `Cmd/Ctrl + 0` |
| Delete node | Select + `Delete/Backspace` |
| Multi-select | `Shift + Click` |

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Agentic AI Learning Platform                               │
├──────────┬──────────────────────────────┬──────────────────┤
│          │                              │                  │
│  Data    │                              │   Prompt         │
│  Status  │      Canvas (ReactFlow)      │   Editor         │
│          │                              │                  │
│  Agent   │    [Drag agents here]        │   Agent          │
│  Palette │                              │   Chat           │
│          │                              │                  │
└──────────┴──────────────────────────────┴──────────────────┘
```

## 🔄 Workflow Patterns

### Pattern 1: Linear Pipeline
```
Data Agent → Talk to Data Agent → Response
```

### Pattern 2: Anomaly Detection
```
Anomaly Agent → Alert Agent → Notifications
```

### Pattern 3: Full Analysis
```
Orchestration Agent
  ├─→ Data Agent
  ├─→ Anomaly Agent
  └─→ Alert Agent
```

## 🎓 Learning Path

1. **Beginner**: Drag agents, try simple queries
2. **Intermediate**: Edit prompts, connect agents
3. **Advanced**: Build workflows, add custom tools

## 🌐 Useful URLs

- **App**: http://localhost:3000
- **Groq Console**: https://console.groq.com/
- **Groq Docs**: https://console.groq.com/docs
- **Mastra Docs**: https://docs.mastra.ai/
- **Prisma Docs**: https://www.prisma.io/docs

## 💡 Pro Tips

- **Restart server** after changing .env
- **Clear chat** before testing new prompts
- **Use Orchestration Agent** for complex tasks
- **Edit prompts** to customize behavior
- **Check browser console** for errors
- **Read agent responses** for insights

## 🚀 Quick Start (60 seconds)

```bash
# 1. Install (15s)
npm install

# 2. Configure (10s)
cp .env.example .env
# Edit DATABASE_URL and GROQ_API_KEY

# 3. Setup DB (20s)
npm run db:push
npm run db:seed

# 4. Run (5s)
npm run dev

# 5. Test (10s)
# Open localhost:3000
# Drag Data Agent
# Ask "Show me all customers"
```

## 📞 Support Resources

- GitHub Issues
- Groq Discord
- Mastra AI Community
- Stack Overflow

---

**Happy Learning! 🎉**

Keep this card handy for quick reference while building!
