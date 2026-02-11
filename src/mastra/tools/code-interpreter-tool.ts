import {
  BedrockAgentCoreClient, // AWS SDK v3 client for Bedrock Agent Core
  InvokeCodeInterpreterCommand, // Command to invoke code interpreter
  StartCodeInterpreterSessionCommand, // Command to start a code interpreter session
  StopCodeInterpreterSessionCommand, // Command to stop a code interpreter session
} from "@aws-sdk/client-bedrock-agentcore";
import { Tool } from "@mastra/core";
import { z } from "zod";

// Initialize the Bedrock Agent Core client with AWS credentials
const bedrockAgentCoreClient = new BedrockAgentCoreClient({
  region: "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Define the Code Interpreter Tool which allows executing Python code through the Bedrock Agent Core
export const codeInterpreterTool: Tool = {
  id: "use-code-interpreter",
  description: "Execute Python code using a Code Interpreter",
  // Define the input schema for the tool, which expects a string of Python code to execute
  inputSchema: z.object({
    code: z.string(),
  }),
  // Define the output schema for the tool, which will return the standard output from the executed code as a string
  outputSchema: z.object({
    output: z.string(),
  }),

  // The execute function is called when the tool is invoked. It handles the entire lifecycle of a code interpreter session:
  execute: async (input) => {
    // Start a new code interpreter session
    const startSessionResponse = await bedrockAgentCoreClient.send(
      new StartCodeInterpreterSessionCommand({
        codeInterpreterIdentifier: "aws.codeinterpreter.v1",
        name: "mastra-session",
        sessionTimeoutSeconds: 900, // Session timeout set to 15 minutes
      }),
    );
    // Extract the session ID from the response
    // This ID is used to reference the session in subsequent commands
    const sessionId = startSessionResponse.sessionId;

    // Invoke the code interpreter with the provided Python code
    const invokeResponse = await bedrockAgentCoreClient.send(
      new InvokeCodeInterpreterCommand({
        codeInterpreterIdentifier: "aws.codeinterpreter.v1",
        sessionId: sessionId,
        name: "executeCode",
        arguments: {
          language: "python",
          code: input.code, // input.code contains the Python code which Agent wants to execute
        },
      }),
    );

    // Retrieve the output from the invocation response
    // The output is streamed, so we iterate over the stream to collect the result
    let output = "";
    for await (const event of invokeResponse.stream!) {
      const contents = event.result!.content!;
      for (const contentItem of contents) {
        if (contentItem.type === "text") {
          output = contentItem.text!;
        }
      }
    }

    // Stop the code interpreter session to free up resources
    await bedrockAgentCoreClient.send(
      new StopCodeInterpreterSessionCommand({
        codeInterpreterIdentifier: "aws.codeinterpreter.v1",
        sessionId: sessionId,
      }),
    );

    // Return the output of the code execution to the caller(Agent)
    return { output };
  },
};