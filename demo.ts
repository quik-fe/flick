import { flick } from "./src/main";
import { z } from "zod";

const argsDef = {
  greet: z
    .object({
      name: z.string().describe("Name to greet"),
      times: z.number().optional().default(1).describe("Number of repetitions"),
    })
    .describe("Greet a person multiple times"),
};

flick(argsDef)
  .describe("Hello world from flick")
  .handler({
    greet: ({ name, times }) => {
      for (let i = 0; i < times; i++) {
        console.log(`👋 Hello, ${name}`);
      }
    },
  })
  .parse();
