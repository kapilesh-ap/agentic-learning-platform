// @ts-nocheck
import { Mastra, createTool } from '@mastra/core'
import Groq from 'groq-sdk'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Define tools using Mastra's createTool
const queryDatabaseTool = createTool({
  id: 'queryDatabase',
  description: 'Query the PostgreSQL database for business data',
  inputSchema: z.object({
    query: z.string().describe('Natural language query describing what data to retrieve'),
  }),
  execute: async ({ context }) => {
    const { query } = context
    const lowerQuery = query.toLowerCase()
    
    try {
      if (lowerQuery.includes('customer')) {
        const customers = await prisma.customer.findMany({ take: 10 })
        return JSON.stringify(customers, null, 2)
      }
      
      if (lowerQuery.includes('product')) {
        const products = await prisma.product.findMany({ take: 10 })
        return JSON.stringify(products, null, 2)
      }
      
      if (lowerQuery.includes('transaction')) {
        const transactions = await prisma.transaction.findMany({
          take: 10,
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        })
        return JSON.stringify(transactions, null, 2)
      }
      
      if (lowerQuery.includes('alert')) {
        const alerts = await prisma.alert.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
        })
        return JSON.stringify(alerts, null, 2)
      }
      
      return 'Query not recognized. Try asking about customers, products, transactions, or alerts.'
    } catch (error) {
      return `Error querying database: ${error}`
    }
  },
})

const detectAnomaliesTool = createTool({
  id: 'detectAnomalies',
  description: 'Scan database for anomalous patterns in transactions',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const transactions = await prisma.transaction.findMany({
        include: {
          customer: true,
        },
      })

      const anomalies = []
      const avgTransaction = transactions.reduce((sum, t) => sum + t.total, 0) / transactions.length
      const highValueThreshold = avgTransaction * 3

      const highValueTransactions = transactions.filter(t => t.total > highValueThreshold)
      if (highValueTransactions.length > 0) {
        anomalies.push({
          type: 'High Value Transaction',
          count: highValueTransactions.length,
          details: highValueTransactions.map(t => ({
            id: t.id,
            customer: t.customer.name,
            amount: t.total,
          })),
        })
      }

      const failedByCustomer = new Map()
      transactions.filter(t => t.status === 'failed').forEach(t => {
        const count = failedByCustomer.get(t.customerId) || 0
        failedByCustomer.set(t.customerId, count + 1)
      })

      const customersWithMultipleFailures = Array.from(failedByCustomer.entries())
        .filter(([_, count]) => count >= 3)
        .map(([customerId, count]) => {
          const customer = transactions.find(t => t.customerId === customerId)?.customer
          return { customerId, customerName: customer?.name, failedCount: count }
        })

      if (customersWithMultipleFailures.length > 0) {
        anomalies.push({
          type: 'Multiple Failed Transactions',
          count: customersWithMultipleFailures.length,
          details: customersWithMultipleFailures,
        })
      }

      const refundedTransactions = transactions.filter(t => t.status === 'refunded')
      if (refundedTransactions.length > 0) {
        anomalies.push({
          type: 'Refunded Transactions',
          count: refundedTransactions.length,
          details: refundedTransactions.map(t => ({
            id: t.id,
            customer: t.customer.name,
            amount: t.total,
          })),
        })
      }

      return JSON.stringify({ anomaliesFound: anomalies.length, anomalies }, null, 2)
    } catch (error) {
      return `Error detecting anomalies: ${error}`
    }
  },
})

const sendAlertTool = createTool({
  id: 'sendAlert',
  description: 'Create and send an alert notification',
  inputSchema: z.object({
    type: z.enum(['anomaly', 'threshold', 'error']).describe('Type of alert'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Alert severity level'),
    title: z.string().describe('Short alert title'),
    message: z.string().describe('Detailed alert message'),
    metadata: z.any().optional().describe('Additional context data'),
  }),
  execute: async ({ context }) => {
    const { type, severity, title, message, metadata } = context
    
    try {
      const alert = await prisma.alert.create({
        data: {
          type,
          severity,
          title,
          message,
          metadata: metadata || {},
        },
      })
      return JSON.stringify({ success: true, alert }, null, 2)
    } catch (error) {
      return `Error creating alert: ${error}`
    }
  },
})

// Initialize Mastra
export const mastra = new Mastra({
  tools: {
    queryDatabase: queryDatabaseTool,
    detectAnomalies: detectAnomaliesTool,
    sendAlert: sendAlertTool,
  },
})

// Agent configurations
export const agentConfigs = {
  dataAgent: {
    id: 'dataAgent',
    name: 'Data Agent',
    instructions: `You are a Data Agent that connects to a PostgreSQL database containing business data.
  
Your role is to:
- Query the database for customers, products, transactions, and alerts
- Provide structured data responses
- Help users understand the data schema
- Format data in a readable way

When a user asks a question, analyze what data they need and query the appropriate tables.
Always explain what data you're retrieving and why.`,
    tools: ['queryDatabase'],
  },
  
  talkToDataAgent: {
    id: 'talkToDataAgent',
    name: 'Talk to Data Agent',
    instructions: `You are a conversational data analyst. Your role is to help users explore and understand business data through natural conversation.

You have access to a database containing:
- Customers (name, email, location, purchase history)
- Products (name, category, price, stock)
- Transactions (purchases, payments, status)
- Alerts (system notifications, anomalies)

Guidelines:
- Ask clarifying questions if the request is ambiguous
- Provide insights and trends, not just raw data
- Use visualizations and summaries when helpful
- Explain your findings in business terms
- Suggest follow-up questions

Always query the database first, then provide a thoughtful analysis.`,
    tools: ['queryDatabase'],
  },
  
  anomalyAgent: {
    id: 'anomalyAgent',
    name: 'Anomaly Detection Agent',
    instructions: `You are an Anomaly Detection Agent specialized in identifying unusual patterns in business data.

Your responsibilities:
- Analyze transactions for suspicious patterns
- Detect high-value or unusual purchases
- Identify customers with multiple failed transactions
- Flag unusual refund patterns
- Spot inventory anomalies

When you detect anomalies:
1. Explain what makes it unusual
2. Assess the severity (low, medium, high, critical)
3. Suggest potential causes
4. Recommend actions

Be thorough but not alarmist. Provide context for your findings.`,
    tools: ['detectAnomalies', 'queryDatabase'],
  },
  
  alertAgent: {
    id: 'alertAgent',
    name: 'Alert Agent',
    instructions: `You are an Alert Agent responsible for sending notifications about important events.

Your role:
- Create alerts for critical issues
- Categorize alerts by type and severity
- Write clear, actionable alert messages
- Include relevant context and metadata
- Track alert resolution

Alert Types: anomaly, threshold, error
Severity Levels: low, medium, high, critical

When creating an alert:
1. Choose appropriate type and severity
2. Write a clear title (short summary)
3. Provide detailed message with context
4. Include relevant IDs and data in metadata

Be concise but informative. Alerts should enable quick action.`,
    tools: ['sendAlert', 'queryDatabase'],
  },
  
  orchestrationAgent: {
    id: 'orchestrationAgent',
    name: 'Orchestration Agent',
    instructions: `You are an Orchestration Agent that coordinates multiple specialized agents to solve complex tasks.

Available tools:
- queryDatabase: Query database for data
- detectAnomalies: Find unusual patterns
- sendAlert: Send notifications

Your role:
1. Understand user requests
2. Determine which tools are needed
3. Execute tools in the right order
4. Synthesize results
5. Provide comprehensive responses

When handling a request:
- Break complex tasks into subtasks
- Use tools efficiently
- Present unified, coherent results`,
    tools: ['queryDatabase', 'detectAnomalies', 'sendAlert'],
  },
}

export type AgentType = 'dataAgent' | 'talkToDataAgent' | 'anomalyAgent' | 'alertAgent' | 'orchestrationAgent'

// Helper function to execute agent with Groq
export async function executeAgent(agentId: AgentType, userMessage: string, customPrompt?: string) {
  const config = agentConfigs[agentId]
  const systemPrompt = customPrompt || config.instructions
  
  //  Convert tools to Groq format
  const availableTools = config.tools.map(toolId => {
    const tool = (mastra.tools as any)[toolId]
    return {
      type: 'function' as const,
      function: {
        name: toolId,
        description: tool.description,
        parameters: tool.inputSchema ? {
          type: 'object',
          properties: tool.inputSchema.shape,
          required: Object.keys(tool.inputSchema.shape),
        } : {},
      },
    }
  })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      tools: availableTools.length > 0 ? availableTools : undefined,
      tool_choice: availableTools.length > 0 ? 'auto' : undefined,
      temperature: 0.7,
      max_tokens: 2000,
    })

    const message = completion.choices[0]?.message

    // Handle tool calls
    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolResults = []
      
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name
        const toolArgs = JSON.parse(toolCall.function.arguments)
        
        const tool = (mastra.tools as any)[toolName]
        if (tool) {
          const result = await tool.execute({ context: toolArgs })
          toolResults.push(result)
        }
      }

      // Make second call with tool results
      const followUp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
          message,
          {
            role: 'tool',
            content: toolResults.join('\n\n'),
            tool_call_id: message.tool_calls[0].id,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      return { text: followUp.choices[0]?.message?.content || 'No response' }
    }

    return { text: message?.content || 'No response generated' }
  } catch (error: any) {
    console.error('Agent error:', error)
    throw error
  }
}
