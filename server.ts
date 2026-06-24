import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";
import chalk from "chalk";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import type { Request, Response } from "express";
import fs from "fs/promises";

const server = new McpServer({
  name: "coding-agent",
  version: "1.0.0",
});

/*
TODO: use this snippet to create a tool
server.registerTool(
  "tool_name",
  {
    description: "meaningful description for the LLM to understand its purpose and how to use it",
    inputSchema: z.object({
      example: z.string(),
    }),
  },
  async ({ example }) => {
    some logic...

    return {
      content: [{ type: "text", text: "the response of the tool" }],
    };
  },
);
*/

server.registerTool(
  "read_file",
  {
    description: "Read a file from the filesystem",
    inputSchema: z.object({
      path: z.string(),
    }),
  },
  async ({ path }) => {
    const content = await fs.readFile(path, "utf-8");

    return {
      content: [{ type: "text", text: content }],
    };
  },
);

server.registerTool(
  "write_file",
  {
    description: "Write a file to the filesystem",
    inputSchema: z.object({
      path: z.string(),
      content: z.string(),
    }),
  },
  async ({ path, content }) => {
    await fs.writeFile(path, content, "utf-8");

    return {
      content: [{ type: "text", text: "file written successfully" }],
    };
  },
);

server.registerTool(
  "list_files",
  {
    description: "List files in a directory",
    inputSchema: z.object({
      path: z.string().default("."),
    }),
  },
  async ({ path }) => {
    const files = await fs.readdir(path);

    return {
      content: [{ type: "text", text: JSON.stringify(files) }],
    };
  },
);

server.registerTool(
  "delete_file",
  {
    description: "Delete a file from the filesystem",
    inputSchema: z.object({
      path: z.string(),
    }),
  },
  async ({ path }) => {
    await fs.unlink(path);

    return {
      content: [{ type: "text", text: "file deleted" }],
    };
  },
);

const app = createMcpExpressApp();

app.post("/mcp", async (req: Request, res: Response) => {
  const transport = new NodeStreamableHTTPServerTransport();

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  // Clean up when the response is finished or the connection is closed
  res.on("close", () => {
    transport.close();
    server.close();
  });
});

app.listen(8080, (error) => {
  if (error) {
    console.error(chalk.red("Failed to start server:"), error);
    process.exit(1);
  }
  console.log(chalk.green("MCP server running on http://localhost:8080/mcp"));
});
