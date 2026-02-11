import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { Agent } from "@mastra/core/agent";
import { codeInterpreterTool } from "../tools/code-interpreter-tool";

const bedrock = createAmazonBedrock({
  region: "ap-northeast-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const codeInterpreterAgent = new Agent({
  name: "Code Interpreter Agent",
  instructions: `
    You are an excellent assistant who helps users by executing Python code to fulfill their requests.

    - Write appropriate Python code to accomplish the user's request. You can use commonly available libraries (numpy, pandas, etc.).
    - Pass the program code you want to execute to the Code Interpreter and generate responses based on the results.
    - Since the Code Interpreter's response consists of standard output content, generate code that includes print statements so you can verify the responses.
  `,
  model: bedrock("jp.anthropic.claude-sonnet-4-5-20250929-v1:0"),
  tools: { codeInterpreterTool },
});