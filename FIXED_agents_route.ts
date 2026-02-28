import { NextRequest, NextResponse } from 'next/server'
import { executeAgent, AgentType } from '@/agents'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, message, customPrompt } = body

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'Agent ID and message are required' },
        { status: 400 }
      )
    }

    // Execute the agent
    const response = await executeAgent(agentId as AgentType, message, customPrompt)

    return NextResponse.json({
      success: true,
      response: response.text,
      agentId,
    })
  } catch (error: any) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to execute agent' },
      { status: 500 }
    )
  }
}
