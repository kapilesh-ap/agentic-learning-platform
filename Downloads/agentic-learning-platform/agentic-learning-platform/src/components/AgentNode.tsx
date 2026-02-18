'use client'

import { memo } from 'react'
import { Handle, Position } from 'reactflow'

interface AgentNodeProps {
  data: {
    agentId: string
    label: string
    color: string
    onSelect: (nodeId: string) => void
  }
  id: string
  selected?: boolean
}

function AgentNode({ data, id, selected }: AgentNodeProps) {
  return (
    <div
      onClick={() => data.onSelect(id)}
      className={`
        px-4 py-3 rounded-lg shadow-lg border-2 cursor-pointer transition-all
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300'}
        bg-white hover:shadow-xl
      `}
      style={{ minWidth: '200px' }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${data.color}`} />
        <div className="font-semibold text-slate-800">{data.label}</div>
      </div>
      
      <div className="text-xs text-slate-500 mt-1">
        {data.agentId}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

export default memo(AgentNode)
