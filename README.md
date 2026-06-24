# mcp-coding

This repository is an experiment to explore the Model Context Protocol (MCP) and local LLM orchestration.
It is intended for learning and prototyping, not as a production-ready product.

The project includes:

- an MCP HTTP server (`server.ts`) with filesystem tools (`read_file`, `write_file`, `list_files`, `delete_file`)
- a CLI agent (`main.ts`) that talks to the LLM and executes MCP tool calls when needed

## Requirements (first-time setup)

If you just cloned this repository, install only:

- [Node.js](https://nodejs.org/en)
- [Ollama](https://ollama.com)

This repository currently defaults to `qwen3.6:latest` in [adapters/ollama.llm.ts](adapters/ollama.llm.ts).
If you keep that default, run:

```bash
ollama pull qwen3.6:latest
```

## Initialize the project

```bash
npm install
```

## Run locally

Start MCP server (terminal 1):

```bash
npm run server
```

Server endpoint:

- `http://localhost:8080/mcp`

Start agent (terminal 2):

```bash
npm run start
```

In the interactive prompt, type your requests.
To exit:

```text
exit
```

## Use MCP Inspector

1. Make sure the MCP server is running:

```bash
npm run server
```

2. In another terminal, start Inspector:

```bash
npm run inspector
```

3. In Inspector, connect to:

```text
http://localhost:8080/mcp
```

You can then inspect available tools and test tool calls against the local MCP server.

## Available scripts

- `npm run build` - build TypeScript
- `npm test` - run Jest tests
- `npm run start` - run the agent (`client.ts`)
- `npm run start:watch` - run the agent in watch mode
- `npm run server` - run MCP server (`server.ts`)
- `npm run server:watch` - run MCP server in watch mode
- `npm run inspector` - run MCP Inspector

## How it works

1. You enter a prompt in the CLI client.
2. The agent sends messages to the LLM through Ollama.
3. If the LLM returns tool calls, the client invokes tools on the MCP server.
4. Tool results are sent back to the LLM to continue the loop.

## Repository structure

```text
.
├── main.ts
├── server.ts
├── adapters/
│   ├── index.ts
│   └── ollama.llm.ts
├── ports/
│   ├── index.ts
│   └── llm.port.ts
├── package.json
└── tsconfig.json
```

## License

ISC
