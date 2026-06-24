import inquirer from "inquirer";
import chalk from "chalk";
import { LLM, Message } from "./ports";
import { Ollama } from "./adapters";
import {
  Client,
  StreamableHTTPClientTransport,
  Tool,
} from "@modelcontextprotocol/client";

async function main(
  llm: LLM,
  mcpClient: Client,
  transport: StreamableHTTPClientTransport,
) {
  await connectToMcpServer(mcpClient, transport);

  const messages_history: Message[] = [];
  const MAX_MESSAGES = 150; // max number of messages to keep in history to prevent memory issues

  console.log(chalk.green("🧠 Coding Agent started"));

  //Main User - Agent loop: get user input and chat with the LLM
  while (true) {
    const userInput = await getUserInput();

    if (userInput === "") continue;
    if (userInput === "exit") break;

    messages_history.push({
      role: "user",
      content: userInput,
    });

    // keep message history manageable by only keeping the last MAX_MESSAGES messages
    if (messages_history.length > MAX_MESSAGES) {
      messages_history.splice(0, 1);
    }

    //send the messages to LLM, get response, execute tool calls if any, send results back to LLM, repeat
    await runAgentLoop(llm, messages_history, mcpClient);
  }
}

async function getUserInput(): Promise<string> {
  const { input } = await inquirer.prompt([
    {
      type: "input",
      name: "input",
      message: ">",
    },
  ]);

  return input.trim();
}

async function connectToMcpServer(
  mcpClient: Client,
  transport: StreamableHTTPClientTransport,
): Promise<void> {
  try {
    await mcpClient.connect(transport);
  } catch (err) {
    console.log(chalk.yellow("🟡 MCP not available, running without tools"));
  }
}

async function runAgentLoop(
  llm: LLM,
  messages_history: Message[],
  mcpClient: Client,
) {
  let shouldContinue = true;
  let loopCount = 0;
  const LOOP_THRESHOLD = 10; // safety threshold to prevent infinite loops

  while (shouldContinue) {
    shouldContinue = false; // reset loop flag, will be set to true if there are tool calls in the response

    loopCount++;
    if (loopCount > LOOP_THRESHOLD) {
      console.log(chalk.red("✗ too many iterations, breaking loop"));

      messages_history.push({
        role: "system",
        content: "Error: too many iterations, breaking loop",
      });
      break;
    }

    const mcpTools: Tool[] = (await mcpClient.listTools()).tools;

    const response = await llm.chat({
      messages: messages_history,
      tools: mcpTools,
    });

    messages_history.push({
      role: "assistant",
      content: response.message.content,
      toolCalls: response.toolCalls,
    });

    console.log(chalk.blue("\n🤖"), response.message.content);

    if (response.toolCalls?.length) {
      console.log(chalk.yellow("\n🔧 tool calls detected"));

      for (const toolCall of response.toolCalls) {
        const result = await mcpClient.callTool({
          name: toolCall.name,
          arguments: toolCall.arguments,
        });

        messages_history.push({
          role: "tool",
          content: JSON.stringify(result.content),
          toolCallId: toolCall.id,
        });

        shouldContinue = true;
      }
    }
  }
}

const llmProvider = new Ollama();

const mcpClient = new Client({
  name: "coding-agent",
  version: "1.0.0",
});

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:8080/mcp"),
);

main(llmProvider, mcpClient, transport).catch((err) => {
  console.error(chalk.red("Error in main:"), err);

  process.exit(1);
});
