# Example Workflows

This document provides detailed examples of agent workflows you can build and test.

## Workflow 1: Customer Analysis

**Objective**: Analyze customer behavior and identify VIPs

**Agents**: Data Agent → Talk to Data Agent

**Steps**:
1. Drag "Data Agent" onto canvas
2. Drag "Talk to Data Agent" onto canvas
3. Connect them (Data Agent → Talk to Data Agent)
4. Click "Talk to Data Agent"
5. Ask: "Who are my top customers by transaction volume?"

**Expected Output**: Analysis of customers with highest purchase amounts, frequency, and patterns.

**Prompt Modification**:
Edit Talk to Data Agent prompt to add:
```
When analyzing customers, always include:
- Total spent
- Number of transactions
- Average transaction value
- Last purchase date
Rank them and provide actionable insights.
```

## Workflow 2: Fraud Detection Pipeline

**Objective**: Detect and alert on suspicious transactions

**Agents**: Data Agent → Anomaly Agent → Alert Agent

**Steps**:
1. Drag all three agents onto canvas
2. Connect: Data → Anomaly → Alert
3. Click "Anomaly Agent"
4. Ask: "Scan all transactions for fraudulent patterns"

**Expected Output**: 
- Detection of high-value transactions ($15,000+)
- Multiple failed transactions from same customer
- Unusual refund patterns
- Automated alert creation

**Prompt Modification**:
Edit Anomaly Agent to be more aggressive:
```
You are a strict fraud detection agent.

Flag ANY transaction that meets these criteria:
- Over $5,000 (reduced threshold)
- 2+ failed attempts (reduced from 3)
- Any refund pattern
- Purchases at unusual times

For each anomaly, assess severity as:
- Critical: Immediate action needed
- High: Review within 24 hours
- Medium: Weekly review
- Low: Monitor

Always err on the side of caution.
```

## Workflow 3: Inventory Management

**Objective**: Monitor stock levels and alert on low inventory

**Agents**: Data Agent + Alert Agent

**Steps**:
1. Drag "Data Agent" and "Alert Agent"
2. Connect them
3. Click "Data Agent"
4. Ask: "Check inventory levels for all products"
5. If any products < 50 units, click "Alert Agent"
6. Ask: "Create alert for low stock items"

**Expected Output**: Inventory report + alerts for restocking

**Custom Tool Addition** (advanced):
Add to Data Agent in `src/agents/index.ts`:
```typescript
checkInventory: {
  description: 'Check product inventory levels',
  parameters: {
    type: 'object',
    properties: {
      threshold: {
        type: 'number',
        description: 'Alert threshold quantity',
      }
    }
  },
  execute: async ({ threshold = 50 }) => {
    const lowStock = await prisma.product.findMany({
      where: { stock: { lt: threshold } }
    })
    return JSON.stringify(lowStock)
  }
}
```

## Workflow 4: Sales Dashboard

**Objective**: Generate comprehensive sales report

**Agents**: Orchestration Agent (coordinates all others)

**Steps**:
1. Drag "Orchestration Agent" onto canvas
2. Click it and ask comprehensive questions:

**Example Queries**:
```
"Generate a complete sales dashboard with:
- Total revenue this month
- Top 5 customers
- Best-selling products
- Any anomalies or concerns
- Recommendations for next steps"
```

**Expected Output**: Multi-section report synthesizing data from all agents

**Advanced Prompt**:
```
You are a Business Intelligence Orchestrator.

When generating reports, ALWAYS:
1. Query data from Data Agent
2. Analyze for insights (Talk to Data Agent)
3. Check for anomalies (Anomaly Agent)
4. Create alerts if needed (Alert Agent)
5. Synthesize into executive summary

Format reports as:
## Executive Summary
[Key takeaways]

## Metrics
[Data points]

## Insights
[Analysis]

## Concerns
[Issues found]

## Recommendations
[Action items]
```

## Workflow 5: Customer Support Analysis

**Objective**: Analyze failed transactions and customer issues

**Agents**: Talk to Data Agent → Alert Agent

**Steps**:
1. Setup agents and connect
2. Ask Talk to Data Agent:
```
"Find all customers with failed transactions.
For each, tell me:
- Customer name and contact
- Number of failures
- Products they tried to buy
- Possible reasons for failure
- Recommended follow-up action"
```

3. Based on results, ask Alert Agent:
```
"Create high-priority alerts for customers with 3+ failed transactions
Include customer details and suggested actions"
```

**Expected Output**: 
- Detailed customer issue analysis
- Prioritized alerts for support team
- Action plans for each case

## Workflow 6: Product Performance Review

**Objective**: Identify winning and losing products

**Agents**: Data Agent + Talk to Data Agent

**Query**:
```
"Analyze product performance:
- Which products sell best?
- Which have low sales?
- What's the average profit margin?
- Are there seasonal trends?
- Which products should we discontinue?
- Which should we stock more of?"
```

**Enhanced Prompt** for Talk to Data Agent:
```
You are a Product Analytics Specialist.

For every product analysis:
1. Calculate sales velocity (units/day)
2. Compute profit margins
3. Identify trends over time
4. Compare against category averages
5. Provide specific recommendations

Use business terminology and be direct about decisions.
```

## Workflow 7: Real-Time Monitoring

**Objective**: Continuous monitoring with automated alerts

**Agents**: All agents in monitoring configuration

**Setup**:
1. Place Orchestration Agent at center
2. Connect to all other agents
3. Ask it to "Monitor the system continuously"

**Monitoring Prompt**:
```
You are a Real-Time Monitoring System.

Every 5 minutes (simulated via user query):
1. Check for new transactions
2. Scan for anomalies
3. Verify data integrity
4. Create alerts if needed
5. Report system status

Alert on:
- Transactions > $10,000
- 3+ failed transactions per customer
- Products with 0 stock
- Unusual refund rates
- Database connection issues

Provide status in this format:
🟢 All systems normal
⚠️  [X] warnings detected
🔴 [X] critical issues
```

## Custom Workflow: Your Use Case

**Template for creating your own workflow:**

1. **Define Objective**: What do you want to achieve?

2. **Select Agents**: Which agents do you need?
   - Data retrieval? → Data Agent
   - Analysis? → Talk to Data Agent
   - Pattern detection? → Anomaly Agent
   - Notifications? → Alert Agent
   - Complex multi-step? → Orchestration Agent

3. **Design Flow**: How should agents connect?
   ```
   Agent A → Agent B → Agent C
   ```

4. **Customize Prompts**: Tailor each agent's behavior

5. **Test Queries**: Start with simple questions, increase complexity

6. **Refine**: Adjust prompts based on results

## Tips for Building Workflows

1. **Start Simple**: Test one agent at a time
2. **Be Specific**: Clear prompts = better results
3. **Iterate**: Refine prompts based on responses
4. **Chain Thoughtfully**: Consider data flow between agents
5. **Use Examples**: Include examples in custom prompts
6. **Monitor Performance**: Check agent response quality
7. **Document**: Note what works for your use case

## Troubleshooting Workflows

**Agent gives generic responses:**
- Make prompts more specific
- Add examples to the system prompt
- Include desired output format

**Agents don't coordinate well:**
- Use Orchestration Agent for complex tasks
- Clarify each agent's role in prompts
- Test individual agents first

**Data queries fail:**
- Check database connection
- Verify data exists for the query
- Simplify the query

**Alerts not created:**
- Ensure Alert Agent is connected
- Check alert parameters are valid
- Verify database write permissions

## Next Steps

- Experiment with agent combinations
- Create custom agents for your domain
- Build automation workflows
- Share your workflows with the community!
