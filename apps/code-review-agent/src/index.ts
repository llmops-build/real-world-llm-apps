import OpenAI from "openai";
import { Agent, run, setDefaultOpenAIClient } from "@openai/agents";

const client = new OpenAI({
  baseURL: "http://localhost:5177/api/genai/v1",
  apiKey: "sk_nRLp9MiTTaP4lih61daijwx2qCIaNF8q",
});

setDefaultOpenAIClient(client);

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
});

async function main() {
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

  console.log(result.finalOutput);
}

main();
