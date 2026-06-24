import { Tool } from "@modelcontextprotocol/client";

export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: LLMToolCall[];
};

export type LLMChatRequest = {
  messages: Message[];
  tools?: Tool[];
};

export type LLMToolCall = {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type LLMChatResponse = {
  model: string;
  message: Message;
  toolCalls?: LLMToolCall[];
};

export interface LLM {
  chat(input: LLMChatRequest): Promise<LLMChatResponse>;
}
