'use client'

import { useState, useEffect } from 'react'
import { Node } from 'reactflow'
import { agentConfigs } from '@/lib/agent-configs'

interface PromptEditorProps {
  node: Node | undefined
  onUpdate: (nodeId: string, prompt: string) => void
  onClose: () => void
}

export default function PromptEditor({ node, onUpdate, onClose }: PromptEditorProps) {
  const [prompt, setPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (node) {
      const config = agentConfigs[node.data.agentId]
      setPrompt(node.data.customPrompt || config.defaultPrompt)
    }
  }, [node])

  if (!node) return null

  const config = agentConfigs[node.data.agentId]

  const handleSave = () => {
    onUpdate(node.id, prompt)
    setIsEditing(false)
  }

  const handleReset = () => {
    setPrompt(config.defaultPrompt)
    onUpdate(node.id, config.defaultPrompt)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          <h3 className="font-semibold text-slate-700">{config.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">
            System Prompt
          </label>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleReset}
              className="text-xs text-slate-600 hover:text-slate-700"
            >
              Reset
            </button>
          </div>
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-48 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Enter system prompt..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  const config = agentConfigs[node.data.agentId]
                  setPrompt(node.data.customPrompt || config.defaultPrompt)
                }}
                className="flex-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-48 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 overflow-y-auto whitespace-pre-wrap font-mono text-slate-600">
            {prompt}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 bg-blue-50 p-2 rounded">
        💡 Tip: Modify the prompt to change how this agent behaves and responds
      </div>
    </div>
  )
}
