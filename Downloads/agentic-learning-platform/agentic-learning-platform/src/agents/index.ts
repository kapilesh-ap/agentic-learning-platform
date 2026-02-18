import Groq from "groq-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type AgentType =
  | "dataAgent"
  | "talkToDataAgent"
  | "anomalyAgent"
  | "alertAgent"
  | "orchestrationAgent";

// ─── Tool Definitions ─────────────────────────────────────────────────────────
const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "query_customers",
      description:
        "Retrieve customer records from the database. Can filter by city or search by name/email.",
      parameters: {
        type: "object",
        properties: {
          limit:  { type: "number", description: "Max records to return (default 10, max 100)" },
          city:   { type: "string", description: "Filter customers by city (optional)" },
          search: { type: "string", description: "Search in name or email (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_products",
      description:
        "Retrieve product records. Filter by category, price range, or low stock flag.",
      parameters: {
        type: "object",
        properties: {
          limit:          { type: "number",  description: "Max records (default 10, max 100)" },
          category:       { type: "string",  description: "Filter by category (optional)" },
          min_price:      { type: "number",  description: "Minimum price (optional)" },
          max_price:      { type: "number",  description: "Maximum price (optional)" },
          low_stock_only: { type: "boolean", description: "Only products with stock < 20 (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_transactions",
      description:
        "Retrieve transaction records. Filter by status, payment method, minimum total, or customer ID.",
      parameters: {
        type: "object",
        properties: {
          limit:          { type: "number", description: "Max records (default 10, max 100)" },
          status:         { type: "string", enum: ["completed", "pending", "failed", "refunded"], description: "Filter by status (optional)" },
          payment_method: { type: "string", enum: ["credit_card", "debit_card", "paypal"], description: "Filter by payment method (optional)" },
          min_total:      { type: "number", description: "Minimum transaction total (optional)" },
          customer_id:    { type: "string", description: "Filter by customer ID (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_summary_stats",
      description:
        "Get high-level business statistics: total customers, products, revenue, transaction breakdown by status, average order value, and top categories.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "detect_anomalies",
      description:
        "Analyse transactions to detect anomalies: high-value transactions, customers with repeated failed payments, and refund patterns.",
      parameters: {
        type: "object",
        properties: {
          threshold_amount:    { type: "number", description: "Flag transactions above this amount (default 1000)" },
          failed_tx_threshold: { type: "number", description: "Flag customers with this many failed transactions (default 2)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_alerts",
      description: "Retrieve existing alerts from the database, optionally filtered by severity.",
      parameters: {
        type: "object",
        properties: {
          limit:       { type: "number",  description: "Max alerts (default 20)" },
          severity:    { type: "string",  enum: ["high", "medium", "low"], description: "Filter by severity (optional)" },
          unread_only: { type: "boolean", description: "Only unread alerts (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_alert",
      description: "Create a new alert in the database to flag an important event or anomaly.",
      parameters: {
        type: "object",
        properties: {
          type:     { type: "string", description: "Alert type e.g. anomaly, inventory, fraud, system" },
          severity: { type: "string", enum: ["high", "medium", "low"], description: "Severity level" },
          title:    { type: "string", description: "Short alert title" },
          message:  { type: "string", description: "Detailed alert description" },
        },
        required: ["type", "severity", "title", "message"],
      },
    },
  },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  try {
    switch (name) {

      case "query_customers": {
        const where: any = {};
        if (input.city)   where.city = { contains: input.city, mode: "insensitive" };
        if (input.search) {
          where.OR = [
            { name:  { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
          ];
        }
        const customers = await prisma.customer.findMany({
          where,
          take: Math.min(Number(input.limit ?? 10), 100),
          orderBy: { createdAt: "desc" },
        });
        return JSON.stringify({ count: customers.length, customers });
      }

      case "query_products": {
        const where: any = {};
        if (input.category) where.category = { contains: input.category, mode: "insensitive" };
        if (input.min_price !== undefined || input.max_price !== undefined) {
          where.price = {};
          if (input.min_price !== undefined) where.price.gte = Number(input.min_price);
          if (input.max_price !== undefined) where.price.lte = Number(input.max_price);
        }
        if (input.low_stock_only) where.stock = { lt: 20 };
        const products = await prisma.product.findMany({
          where,
          take: Math.min(Number(input.limit ?? 10), 100),
          orderBy: { price: "desc" },
        });
        return JSON.stringify({ count: products.length, products });
      }

      case "query_transactions": {
        const where: any = {};
        if (input.status)                  where.status        = input.status;
        if (input.payment_method)          where.paymentMethod = input.payment_method;
        if (input.min_total !== undefined) where.total         = { gte: Number(input.min_total) };
        if (input.customer_id)             where.customerId    = input.customer_id;
        const transactions = await prisma.transaction.findMany({
          where,
          take: Math.min(Number(input.limit ?? 10), 100),
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { name: true, email: true } },
            items: { include: { product: { select: { name: true, category: true } } } },
          },
        });
        return JSON.stringify({ count: transactions.length, transactions });
      }

      case "get_summary_stats": {
        const [
          totalCustomers, totalProducts, totalTransactions,
          completedTx, failedTx, pendingTx,
          revenueAgg, topCategories,
        ] = await Promise.all([
          prisma.customer.count(),
          prisma.product.count(),
          prisma.transaction.count(),
          prisma.transaction.count({ where: { status: "completed" } }),
          prisma.transaction.count({ where: { status: "failed" } }),
          prisma.transaction.count({ where: { status: "pending" } }),
          prisma.transaction.aggregate({
            _sum: { total: true },
            _avg: { total: true },
            where: { status: "completed" },
          }),
          prisma.product.groupBy({
            by: ["category"],
            _count: { id: true },
            _sum:   { stock: true },
            orderBy: { _count: { id: "desc" } },
            take: 5,
          }),
        ]);
        return JSON.stringify({
          totalCustomers, totalProducts, totalTransactions,
          byStatus: { completed: completedTx, failed: failedTx, pending: pendingTx },
          revenue: {
            total: revenueAgg._sum.total ?? 0,
            averageOrderValue: revenueAgg._avg.total ?? 0,
          },
          topCategories: topCategories.map((c) => ({
            category: c.category, productCount: c._count.id, totalStock: c._sum.stock,
          })),
        });
      }

      case "detect_anomalies": {
        const amountThreshold = Number(input.threshold_amount    ?? 1000);
        const failedThreshold = Number(input.failed_tx_threshold ?? 2);

        const [highValueTx, allFailed, allRefunded] = await Promise.all([
          prisma.transaction.findMany({
            where: { total: { gte: amountThreshold } },
            orderBy: { total: "desc" },
            take: 20,
            include: { customer: { select: { name: true, email: true } } },
          }),
          prisma.transaction.findMany({
            where: { status: "failed" },
            include: { customer: { select: { id: true, name: true } } },
          }),
          prisma.transaction.findMany({
            where: { status: "refunded" },
            include: { customer: { select: { name: true } } },
          }),
        ]);

        const failedByCustomer = new Map<string, { name: string; count: number }>();
        for (const tx of allFailed) {
          if (!failedByCustomer.has(tx.customerId)) {
            failedByCustomer.set(tx.customerId, { name: tx.customer?.name ?? "Unknown", count: 0 });
          }
          failedByCustomer.get(tx.customerId)!.count++;
        }

        const repeatFailures = Array.from(failedByCustomer.entries())
          .filter(([, v]) => v.count >= failedThreshold)
          .map(([id, v]) => ({ customerId: id, ...v }));

        return JSON.stringify({
          highValueTransactions: { threshold: amountThreshold, count: highValueTx.length, transactions: highValueTx },
          repeatFailures:        { threshold: failedThreshold,  count: repeatFailures.length, customers: repeatFailures },
          refunds:               { count: allRefunded.length, transactions: allRefunded.slice(0, 10) },
        });
      }

      case "query_alerts": {
        const where: any = {};
        if (input.severity)    where.severity = input.severity;
        if (input.unread_only) where.read = false;
        const alerts = await prisma.alert.findMany({
          where,
          take: Math.min(Number(input.limit ?? 20), 100),
          orderBy: { createdAt: "desc" },
        });
        return JSON.stringify({ count: alerts.length, alerts });
      }

      case "create_alert": {
        const alert = await prisma.alert.create({
          data: {
            type: input.type, severity: input.severity,
            title: input.title, message: input.message,
            metadata: {},
          },
        });
        return JSON.stringify({ success: true, alert });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    console.error(`[tool:${name}]`, err);
    return JSON.stringify({ error: `Tool '${name}' failed: ${err.message}` });
  }
}

// ─── System Prompts ───────────────────────────────────────────────────────────
const SYSTEM_PROMPTS: Record<AgentType, string> = {
  dataAgent:
    "You are a Data Agent with access to a business database via tools. " +
    "Always call a tool to fetch real data before answering — never invent numbers. " +
    "Summarise results clearly and concisely.",

  talkToDataAgent:
    "You are a friendly conversational data analyst. " +
    "Use tools to fetch real data, then explain findings in plain English. " +
    "Highlight trends, outliers, and actionable patterns.",

  anomalyAgent:
    "You are an Anomaly Detection Agent specialising in fraud and risk. " +
    "Call detect_anomalies first, then dig into specific transactions. " +
    "Rate each finding HIGH / MEDIUM / LOW risk and recommend a concrete action.",

  alertAgent:
    "You are an Alert Management Agent. " +
    "Call query_alerts first to see what is active. Use create_alert to log new issues. " +
    "Group alerts by severity and suggest an immediate remediation for every HIGH alert.",

  orchestrationAgent:
    "You are a senior business intelligence analyst. " +
    "You have been given a complete snapshot of live business data. " +
    "Analyse it thoroughly and answer the user's question with a structured report:\n" +
    "1) Executive Summary\n2) Key Findings\n3) Anomalies & Risks\n4) Recommended Actions\n" +
    "Be specific — use the actual numbers provided. Do not ask for more data.",
};

// ─── Orchestration: pre-fetch all data, then synthesise in one LLM call ───────
// Groq's Llama models struggle with planning 5+ sequential tool calls autonomously.
// Solution: fetch all data in parallel ourselves, then hand the full context to the
// model for analysis. Faster, more reliable, and produces richer reports.
async function runOrchestrationAgent(
  message: string,
  systemPrompt: string
): Promise<{ response: string; messages: any[] }> {
  console.log("[orchestrationAgent] Pre-fetching all data in parallel…");

  const [stats, anomalies, alerts, recentTx, lowStock, failedTx] = await Promise.all([
    executeTool("get_summary_stats",  {}),
    executeTool("detect_anomalies",   { threshold_amount: 1000, failed_tx_threshold: 2 }),
    executeTool("query_alerts",       { limit: 20 }),
    executeTool("query_transactions", { limit: 20 }),
    executeTool("query_products",     { low_stock_only: true, limit: 10 }),
    executeTool("query_transactions", { status: "failed", limit: 20 }),
  ]);

  console.log("[orchestrationAgent] Data ready — calling LLM for synthesis…");

  const dataContext = [
    "=== LIVE BUSINESS DATA SNAPSHOT ===\n",
    "--- Summary Statistics ---",       stats,
    "--- Anomaly Detection ---",        anomalies,
    "--- Active Alerts ---",            alerts,
    "--- Recent Transactions (×20) ---", recentTx,
    "--- Failed Transactions (×20) ---", failedTx,
    "--- Low Stock Products ---",       lowStock,
    "\n===================================",
  ].join("\n");

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user",   content: `${dataContext}\n\nUser question: ${message}` },
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatilee",
    max_tokens: 4096,
    messages,
    // No tools — model just analyses the data we already collected
  });

  const finalResponse = response.choices[0].message.content ?? "No response generated.";
  messages.push({ role: "assistant", content: finalResponse });

  return { response: finalResponse, messages };
}

// ─── Standard Agentic Loop (tool-calling loop for all other agents) ────────────
async function runToolCallingAgent(
  agentId: AgentType,
  message: string,
  systemPrompt: string
): Promise<{ response: string; messages: any[] }> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user",   content: message },
  ];

  let finalResponse = "";
  const MAX_ITERATIONS = 10;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      tools: TOOLS,
      tool_choice: "auto",
      messages,
    });

    const assistantMsg = response.choices[0].message;
    messages.push(assistantMsg as Groq.Chat.ChatCompletionMessageParam);

    // No tool calls → model is done
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      finalResponse = assistantMsg.content ?? "";
      break;
    }

    // Execute all tool calls and feed results back
    for (const toolCall of assistantMsg.tool_calls) {
      const fnName = toolCall.function.name;
      let fnArgs: Record<string, any> = {};
      try {
        fnArgs = JSON.parse(toolCall.function.arguments ?? "{}");
      } catch {
        fnArgs = {};
      }

      console.log(`[${agentId}][iter ${iteration}] → ${fnName}`, fnArgs);
      const result = await executeTool(fnName, fnArgs);
      console.log(`[${agentId}][iter ${iteration}] ← ${fnName} (${result.length} chars)`);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  return {
    response: finalResponse || "Agent finished processing.",
    messages,
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────
export async function executeAgent(
  agentId: AgentType,
  message: string,
  customPrompt: string | null = null
): Promise<{ response: string; messages: any[] }> {
  const systemPrompt = customPrompt ?? SYSTEM_PROMPTS[agentId];

  if (agentId === "orchestrationAgent") {
    return runOrchestrationAgent(message, systemPrompt);
  }

  return runToolCallingAgent(agentId, message, systemPrompt);
}