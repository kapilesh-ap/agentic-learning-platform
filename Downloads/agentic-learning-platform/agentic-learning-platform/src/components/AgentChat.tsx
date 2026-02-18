'use client'

import { useState } from 'react'
import { Node } from 'reactflow'
import { agentConfigs } from '@/lib/agent-configs'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AgentChatProps {
  node: Node | undefined
  onClose: () => void
}

export default function AgentChat({ node, onClose }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  if (!node) return null

  const config = agentConfigs[node.data.agentId]

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
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
          message: input,
          customPrompt: node.data.customPrompt,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${data.error}`,
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}`,
      }
      setMessages((prev) => [...prev, errorMessage])
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
    orchestrationAgent: [
      'Analyze sales and create alerts for anomalies',
      'Find top customers and check for issues',
      'Generate a complete business report',
    ],
  }

  const examples = examplePrompts[node.data.agentId] || []

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 flex flex-col h-[400px]">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <h3 className="font-semibold text-slate-700">Chat with Agent</h3>
          </div>
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-600 hover:text-slate-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 mb-4">
              Try asking the agent something:
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

        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">
                {message.content}
              </pre>
            </div>
          </div>
        ))}

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
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
