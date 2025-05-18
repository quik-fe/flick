# flick

nodejs cli utils like fire(python)

## features

- safety typing
- easy to define

# usage

install

```
pnpm add @quik-fe/flick
```

```ts
import { flick } from "@quik-fe/flick";
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
```

```bash
$ npx tsx ./demo.ts -h
Usage: demo [options] [command]

Hello world from flick

Options:
  -h, --help       display help for command

Commands:
  greet [options]  Greet a person multiple times
  help [command]   display help for command
```

```bash
$ npx tsx ./demo.ts greet -h
Usage: demo greet [options]

Greet a person multiple times

Options:
  --name <name>    Name to greet
  --times <times>  Number of repetitions (default: 1)
  -h, --help       display help for command
```

```ts
$ npx tsx ./demo.ts greet --name 我 --times 3
👋 Hello, 我
👋 Hello, 我
👋 Hello, 我
```

# LICENSE

MIT
