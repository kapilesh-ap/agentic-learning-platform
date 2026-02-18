// types.ts - Type definitions for LangGraph agent system

import { BaseMessage } from "@langchain/core/messages";

/**
 * Extended message type that includes tool_calls
 * LangChain messages can have tool_calls but it's not in the base type
 */
export interface MessageWithToolCalls extends BaseMessage {
  tool_calls?: Array<{
    id: string;
    name: string;
    args: Record<string, any>;
  }>;
}

/**
 * Type guard to check if a message has tool calls
 */
export function hasToolCalls(message: BaseMessage): message is MessageWithToolCalls {
  return 'tool_calls' in message && Array.isArray((message as any).tool_calls);
}

/**
 * Agent types
 */
export type AgentType = 
  | 'dataAgent' 
  | 'talkToDataAgent' 
  | 'anomalyAgent' 
  | 'alertAgent' 
  | 'orchestrationAgent';

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  response: string;
  messages: BaseMessage[];
  agentType: string;
}

/**
 * API request body
 */
export interface AgentRequest {
  agentId: AgentType;
  message: string;
  customPrompt?: string;
}

/**
 * API response
 */
export interface AgentResponse {
  success: boolean;
  response: string;
  agentId: string;
  messageCount?: number;
  error?: string;
  details?: string;
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  id: AgentType;
  name: string;
  description: string;
}