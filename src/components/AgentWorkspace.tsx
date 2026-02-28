'use client'

import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'

import AgentNode from './AgentNode'
import DataConnectionStatus from './DataConnectionStatus'
import AgentPalette from './AgentPalette'
import AgentChat from './AgentChat'
import PromptEditor from './PromptEditor'

const nodeTypes = {
  agent: AgentNode,
}

export default function AgentWorkspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [dbConnected, setDbConnected] = useState(false)
  const [dbStats, setDbStats] = useState<any>(null)

  // Check database connection on mount
  useEffect(() => {
    checkDatabaseConnection()
  }, [])

  const checkDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/db/test')
      const data = await response.json()
      setDbConnected(data.connected)
      setDbStats(data.data)
    } catch (error) {
      console.error('Failed to connect to database:', error)
      setDbConnected(false)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      const agentId = event.dataTransfer.getData('agentId')
      const agentName = event.dataTransfer.getData('agentName')
      const agentColor = event.dataTransfer.getData('agentColor')
      const agentDescription = event.dataTransfer.getData('agentDescription')

      if (!type || !agentId) {
        return
      }

      const position = reactFlowInstance
        ? reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })
        : { x: event.clientX, y: event.clientY }

      const newNode: Node = {
        id: `${agentId}-${Date.now()}`,
        type: 'agent',
        position: { x: position.x - 100, y: position.y - 50 },
        data: {
          agentId,
          label: agentName,
          color: agentColor,
          description: agentDescription,
          onSelect: (nodeId: string) => setSelectedAgent(nodeId),
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes]
  )

  const getSelectedNode = () => {
    return nodes.find((node) => node.id === selectedAgent)
  }

  const getConnectedAgentIds = (nodeId: string | null): string[] => {
    if (!nodeId) return []

    // Traverse the full connected component so collaboration includes
    // all agents linked in the same workflow graph (not only direct neighbors).
    const adjacency = new Map<string, Set<string>>()
    for (const edge of edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set())
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set())
      adjacency.get(edge.source)!.add(edge.target)
      adjacency.get(edge.target)!.add(edge.source)
    }

    const visited = new Set<string>([nodeId])
    const queue: string[] = [nodeId]

    while (queue.length > 0) {
      const current = queue.shift()!
      const neighbors = adjacency.get(current)
      if (!neighbors) continue
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      }
    }

    return nodes
      .filter((node) => visited.has(node.id) && node.id !== nodeId)
      .map((node) => node.data.agentId)
      .filter((agentId, index, all) => all.indexOf(agentId) === index)
  }

  const updateNodePrompt = (nodeId: string, prompt: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              customPrompt: prompt,
            },
          }
        }
        return node
      })
    )
  }

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setSelectedAgent((current) => (current === nodeId ? null : current))
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      {/* Left Sidebar - Agent Palette */}
      <div className="col-span-2 space-y-4">
        <DataConnectionStatus 
          connected={dbConnected} 
          stats={dbStats}
          onReconnect={checkDatabaseConnection}
        />
        <AgentPalette />
      </div>

      {/* Center - Canvas */}
      <div className="col-span-7 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
        <div className="h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
            minZoom={0.3}
            maxZoom={2}
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Right Sidebar - Agent Controls */}
      <div className="col-span-3 space-y-4">
        {selectedAgent ? (
          <>
            <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
              <button
                onClick={() => deleteNode(selectedAgent)}
                className="w-full px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Agent
              </button>
            </div>
            <PromptEditor
              node={getSelectedNode()}
              onUpdate={updateNodePrompt}
              onClose={() => setSelectedAgent(null)}
            />
            <AgentChat
              node={getSelectedNode()}
              connectedAgentIds={getConnectedAgentIds(selectedAgent)}
              onClose={() => setSelectedAgent(null)}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-2">Get Started</h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Drag agents from the palette to the canvas</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Connect agents by dragging from one to another</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Click an agent to edit its prompt and chat with it</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Watch how agents work with your data!</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
