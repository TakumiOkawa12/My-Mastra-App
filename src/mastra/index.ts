import { Mastra } from "@mastra/core/mastra";
import { ConsoleLogger } from "@mastra/core/logger";

import { codeInterpreterAgent } from "./agents/code-interpreter-agent";

export const mastra = new Mastra({
  agents: {
    codeInterpreterAgent,
  },
  logger: new ConsoleLogger({
    name: "mastra",
    level: "info",
  }),
});