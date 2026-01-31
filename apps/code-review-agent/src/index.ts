import OpenAI from "openai";
import { Agent, run, setDefaultOpenAIClient, tool } from "@openai/agents";
import { z } from "zod";

const client = new OpenAI({
  baseURL: "http://localhost:5177/api/genai/v1",
  apiKey: "sk_nRLp9MiTTaP4lih61daijwx2qCIaNF8q",
});

setDefaultOpenAIClient(client);

const countLines = tool({
  name: "count_lines",
  description: "Counts the number of lines in the provided code",
  parameters: z.object({
    code: z.string().describe("The code to analyze"),
  }),
  execute: async (input) => {
    console.log("[count_lines] Tool called");
    const lines = input.code.split("\n").length;
    const nonEmptyLines = input.code.split("\n").filter((l) => l.trim()).length;
    const result = JSON.stringify({ totalLines: lines, nonEmptyLines });
    console.log("[count_lines] Result:", result);
    return result;
  },
});

const findTodos = tool({
  name: "find_todos",
  description: "Finds all TODO and FIXME comments in the code",
  parameters: z.object({
    code: z.string().describe("The code to search"),
  }),
  execute: async (input) => {
    console.log("[find_todos] Tool called");
    const lines = input.code.split("\n");
    const todos: { line: number; text: string }[] = [];
    lines.forEach((line, index) => {
      if (line.includes("TODO") || line.includes("FIXME")) {
        todos.push({ line: index + 1, text: line.trim() });
      }
    });
    const result = JSON.stringify(
      todos.length > 0 ? todos : "No TODOs or FIXMEs found",
    );
    console.log("[find_todos] Result:", result);
    return result;
  },
});

async function main() {
  const codeAnalysisAgent = new Agent({
    name: "Code Analysis Agent",
    model: "@openai/gpt-4o-mini",
    instructions: `
      You are a code analysis assistant. Use your tools to analyze code and provide insights:
      - Count lines of code when asked about code size
      - Find TODO/FIXME comments to identify pending work
      - Provide summaries based on tool results
    `,
    modelSettings: {
      providerData: {
        metadata: {
          tenant: "genai",
        },
      },
    },
    tools: [countLines, findTodos],
  });

  const codeReviewAgent = new Agent({
    name: "Code Review Agent",
    model: "@openai/gpt-4o-mini",
    instructions: `
      You are an expert code reviewer. When given code, you:
      - Identify bugs and potential issues
      - Suggest improvements for readability and maintainability
      - Check for security vulnerabilities
      -  Recommend best practices
      - Keep feedback concise and actionable
    `,
    modelSettings: {
      providerData: {
        metadata: {
          tenant: "genai",
        },
      },
    },
    tools: [],
  });
  const code = `
function fetchData(url) {
  let data = null;
  fetch(url).then(res => {
    data = res.json();
  });
  return data;
}
`;

  const result = await run(codeReviewAgent, `Review this code:\n${code}`);
  console.log("=== Code Review Agent ===");
  console.log(result.finalOutput);

  console.log("\n=== Code Analysis Agent (Streaming) ===");
  const analysisStream = await run(
    codeAnalysisAgent,
    `Analyze this code - count the lines and check for any TODOs:\n${code}`,
    { stream: true },
  );

  analysisStream
    .toTextStream({
      compatibleWithNodeStreams: true,
    })
    .pipe(process.stdout);
}

main();
