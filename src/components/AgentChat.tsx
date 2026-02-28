'use client'

import { useState } from 'react'
import { Node } from 'reactflow'
import { agentConfigs } from '@/lib/agent-configs'

interface VizDatum {
  label: string
  value: number
}

interface VizData {
  revenue: VizDatum[]
  transactionsByStatus: VizDatum[]
  topCategories: VizDatum[]
}

interface AgentChatProps {
  node: Node | undefined
  connectedAgentIds: string[]
  onClose: () => void
}

export default function AgentChat({ node, connectedAgentIds, onClose }: AgentChatProps) {
  const [requests, setRequests] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [resultText, setResultText] = useState('')
  const [resultViz, setResultViz] = useState<VizData | null>(null)
  const [resultTitle, setResultTitle] = useState('')

  if (!node) return null

  const config = agentConfigs[node.data.agentId]
  const isOrchestration = node.data.agentId === 'orchestrationAgent'
  const isVisualization = node.data.agentId === 'visualizationAgent'
  const canOrchestrate = !isOrchestration || connectedAgentIds.length > 0

  const handleSend = async () => {
    if (!input.trim() || loading || !canOrchestrate) return

    const prompt = input
    setRequests((prev) => [prompt, ...prev].slice(0, 8))
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: node.data.agentId,
          message: prompt,
          customPrompt: node.data.customPrompt,
          connectedAgents: connectedAgentIds,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResultTitle(config.name)
        setResultText(data.response || 'No response generated')
        setResultViz(data.vizData || null)
        setPopupOpen(true)
      } else {
        setResultTitle(`${config.name} Error`)
        setResultText(`Error: ${data.error}`)
        setResultViz(null)
        setPopupOpen(true)
      }
    } catch (error: any) {
      setResultTitle(`${config.name} Error`)
      setResultText(`Error: ${error.message}`)
      setResultViz(null)
      setPopupOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Example prompts based on agent type
  const examplePrompts: Record<string, string[]> = {
    dataAgent: [
      'Show me all customers',
      'List available products',
      'Get recent transactions',
    ],
    talkToDataAgent: [
      'Who are my top customers?',
      'What products are low in stock?',
      'Summarize recent sales',
    ],
    anomalyAgent: [
      'Scan for anomalies',
      'Find unusual transactions',
      'Check for suspicious patterns',
    ],
    alertAgent: [
      'Create a test alert',
      'Show recent alerts',
      'Send notification for high value transaction',
    ],
    visualizationAgent: [
      'Show charts for revenue and transaction status',
      'Visualize top categories by product count',
      'Create a dashboard summary for current business metrics',
    ],
    orchestrationAgent: [
      'Analyze sales and create alerts for anomalies',
      'Find top customers and check for issues',
      'Generate a complete business report',
    ],
  }

  const examples = examplePrompts[node.data.agentId] || []

  const renderBarChart = (title: string, data: VizDatum[], colorClass: string) => {
    const max = Math.max(...data.map((d) => d.value), 1)
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-slate-800 mb-2">{title}</h4>
        <div className="space-y-2">
          {data.map((item) => (
            <div key={`${title}-${item.label}`}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded">
                <div
                  className={`h-2 rounded ${colorClass}`}
                  style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 flex flex-col h-[400px]">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <h3 className="font-semibold text-slate-700">Run Agent</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRequests([])}
              className="text-xs text-slate-600 hover:text-slate-700"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="text-xs text-slate-600 hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isOrchestration && (
          <div className={`text-xs rounded-lg px-3 py-2 ${canOrchestrate ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {canOrchestrate
              ? `Connected agents: ${connectedAgentIds.join(', ')}`
              : 'Connect this orchestration node to at least one other agent to enable collaboration.'}
          </div>
        )}

        {isVisualization && (
          <div className="text-xs rounded-lg px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200">
            Visualization results will open in a popup with charts.
          </div>
        )}

        {requests.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 mb-4">
              Run the agent with one of these prompts:
            </p>
            <div className="space-y-2">
              {examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setInput(example)}
                  className="block w-full text-left px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {requests.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500">Recent Runs</div>
            {requests.map((request, i) => (
              <div key={`${request}-${i}`} className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700">
                {request}
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-lg text-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the agent..."
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || !canOrchestrate}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>

    {popupOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
        <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">{resultTitle} Result</h3>
            <button
              onClick={() => setPopupOpen(false)}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{resultText}</pre>
            </div>

            {resultViz && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderBarChart('Revenue Metrics', resultViz.revenue || [], 'bg-blue-500')}
                {renderBarChart('Transactions by Status', resultViz.transactionsByStatus || [], 'bg-rose-500')}
                <div className="md:col-span-2">
                  {renderBarChart('Top Categories', resultViz.topCategories || [], 'bg-indigo-500')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
