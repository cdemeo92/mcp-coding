import { Message, Ollama as OllamaClient } from "ollama";
import { LLM, LLMChatRequest, LLMChatResponse } from "../ports";

export class Ollama implements LLM {
  private client: OllamaClient;

  constructor(
    private host: string = "http://localhost:11434",
    private model: string = "qwen3.6:latest",
  ) {
    this.client = new OllamaClient({ host: this.host });
  }

  async chat(input: LLMChatRequest): Promise<LLMChatResponse> {
    const res = await this.client.chat({
      model: this.model,
      messages: this.toOllamaMessages(input),
      tools: this.toOllamaTools(input),
    });

    const message = res.message;

    return {
      model: this.model,
      message: {
        role: message.role as "system" | "user" | "assistant" | "tool",
        content: message.content,
      },
      toolCalls: this.extractToolCalls(message)
    };
  }

  private extractToolCalls(message: Message): import("../ports").LLMToolCall[] | undefined {
    return message.tool_calls?.map((t: any) => ({
      id: t.id,
      name: t.function.name,
      arguments: t.function.arguments,
    }));
  }

  private toOllamaTools(input: LLMChatRequest): import("ollama").Tool[] | undefined {
    return input.tools?.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema as any,
      },
    }));
  }

  private toOllamaMessages(input: LLMChatRequest): import("ollama").Message[] | undefined {
    return input.messages.map((m) => ({
      role: m.role,
      content: m.content,
      tool_calls: m.toolCalls?.map((t) => ({
        id: t.id,
        function: {
          name: t.name,
          arguments: t.arguments,
        },
      })),
    }));
  }
}
