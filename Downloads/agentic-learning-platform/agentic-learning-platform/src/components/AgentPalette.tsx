'use client'

import { agentConfigs } from '@/lib/agent-configs'

export default function AgentPalette() {
  const onDragStart = (event: React.DragEvent, agentId: string) => {
    const config = agentConfigs[agentId]
    event.dataTransfer.setData('application/reactflow', 'agent')
    event.dataTransfer.setData('agentId', agentId)
    event.dataTransfer.setData('agentName', config.name)
    event.dataTransfer.setData('agentColor', config.color)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
      <h3 className="font-semibold text-slate-700 mb-3">Agent Palette</h3>
      <p className="text-xs text-slate-500 mb-4">
        Drag agents to the canvas
      </p>
      
      <div className="space-y-2">
        {Object.entries(agentConfigs).map(([id, config]) => (
          <div
            key={id}
            draggable
            onDragStart={(e) => onDragStart(e, id)}
            className="p-3 border-2 border-slate-200 rounded-lg cursor-move hover:border-slate-400 hover:shadow-md transition-all bg-white"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${config.color}`} />
              <div className="font-medium text-sm text-slate-800">
                {config.name}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {config.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
