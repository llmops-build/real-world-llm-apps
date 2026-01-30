import OpenAI from "openai";
import { Agent, OpenAIResponsesModel, run } from "@openai/agents";

const client = new OpenAI({
  baseURL: "http://localhost:5177/api/genai/v1",
  apiKey: "sk_nRLp9MiTTaP4lih61daijwx2qCIaNF8q",
  defaultHeaders: {
    "x-LLMOps-Prompt": "5vnsk4kd",
  },
});

const codeReviewAgent = new Agent({
  name: "Code Review Agent",
  model: new OpenAIResponsesModel(client, "gpt-4o"),
  modelSettings: {
    providerData: {
      input_variables: {
        name: "tushar",
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
