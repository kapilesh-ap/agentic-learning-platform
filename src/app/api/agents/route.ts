import { NextRequest, NextResponse } from 'next/server';
import { executeAgent, type AgentType } from '@/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, message, customPrompt, connectedAgents } = body;

    // Validate required fields
    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'Agent ID and message are required' },
        { status: 400 }
      );
    }

    // Validate agent type
    const validAgentTypes: AgentType[] = [
      'dataAgent',
      'talkToDataAgent',
      'anomalyAgent',
      'alertAgent',
      'visualizationAgent',
      'orchestrationAgent',
    ];

    if (!validAgentTypes.includes(agentId as AgentType)) {
      return NextResponse.json(
        { error: `Invalid agent ID. Must be one of: ${validAgentTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const connectedAgentTypes = Array.isArray(connectedAgents)
      ? connectedAgents.filter((id: string): id is AgentType => validAgentTypes.includes(id as AgentType))
      : [];

    // Execute the agent with LangGraph
    const result = await executeAgent(
      agentId as AgentType,
      message,
      customPrompt || null,
      connectedAgentTypes
    );

    return NextResponse.json({
      success: true,
      response: result.response || 'No response generated',
      vizData: result.vizData || null,
      agentId,
      messageCount: result.messages.length,
    });
  } catch (error: any) {
    console.error('Agent execution error:', error);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Failed to execute agent';
    const errorStack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorStack,
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to list available agents
export async function GET() {
  const agents = [
    {
      id: 'dataAgent',
      name: 'Data Agent',
      description: 'Queries database and retrieves structured data',
    },
    {
      id: 'talkToDataAgent',
      name: 'Talk to Data Agent',
      description: 'Conversational data analysis with insights',
    },
    {
      id: 'anomalyAgent',
      name: 'Anomaly Detection Agent',
      description: 'Identifies unusual patterns in business data',
    },
    {
      id: 'alertAgent',
      name: 'Alert Agent',
      description: 'Sends notifications about important events',
    },
    {
      id: 'visualizationAgent',
      name: 'Visualization Agent',
      description: 'Generates chart-ready business insights',
    },
    {
      id: 'orchestrationAgent',
      name: 'Orchestration Agent',
      description: 'Coordinates multiple tools to solve complex tasks',
    },
  ];

  return NextResponse.json({
    success: true,
    agents,
  });
}
