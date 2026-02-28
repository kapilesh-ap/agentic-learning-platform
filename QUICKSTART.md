# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example env
cp .env.example .env

# Edit with your credentials
# DATABASE_URL: Your PostgreSQL connection string
# GROQ_API_KEY: Your Groq API key
```

### 3. Setup Database
```bash
# Create schema
npm run db:push

# Add sample data
npm run db:seed
```

### 4. Start Application
```bash
npm run dev
```

Open http://localhost:3000

## First Workflow: Data Exploration

1. **Drag "Data Agent"** onto canvas
2. **Click the agent** to open controls
3. **Try these queries:**
   - "Show me all customers"
   - "List available products"
   - "Get recent transactions"

## Second Workflow: Anomaly Detection

1. **Drag "Anomaly Agent"** onto canvas
2. **Connect it** to Data Agent (optional)
3. **Click and ask:**
   - "Scan for anomalies"
   - "Find unusual transactions"
   - "Check for suspicious patterns"

## Third Workflow: Full Pipeline

1. **Drag "Orchestration Agent"** onto canvas
2. **Ask complex questions:**
   - "Analyze sales and create alerts for anomalies"
   - "Find top customers and check for issues"
   - "Generate a complete business report"

## Tips

- **Edit Prompts**: Click agent → Edit → Modify behavior
- **Example Prompts**: Click agent → See suggested queries
- **Reset**: Use "Clear" button to start fresh conversation
- **Connect Agents**: Drag from bottom to top handle

## Common Issues

**"Database not connected"**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run `npm run db:push`

**"Agent not responding"**
- Check GROQ_API_KEY in .env
- Verify you have API credits
- Check browser console for errors

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Explore [EXAMPLES.md](EXAMPLES.md) for workflow ideas
- Customize agents in `src/agents/index.ts`
