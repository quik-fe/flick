// src/main.ts
import { Command } from "commander";
import type { ZodObject, z, ZodType, ZodUnionDef } from "zod";

type SchemaMap = Record<string, ZodObject<any>>;

function whatType(def: any) {
  // TODO 支持 ZodAny/ZodUnion 等高级类型
  const final_types = [
    "ZodString",
    "ZodObject",
    "ZodArray",
    "ZodBoolean",
    "ZodNumber",
    "ZodBigInt",
  ];
  if (final_types.includes(def._def.typeName)) {
    return def._def.typeName;
  }
  return whatType(def._def.innerType);
}

function coerceArgs<T extends ZodObject<any>>(
  args: any,
  schema: T
): z.infer<T> {
  const shape = schema.shape;
  const result: any = {};

  for (const key in shape) {
    const def = shape[key] as any;
    let value = args[key];

    if (value === undefined) continue;

    const base = whatType(def);

    switch (base) {
      case "ZodNumber":
        result[key] = Number(value);
        break;

      case "ZodBoolean":
        result[key] = value === "true" || value === true;
        break;

      case "ZodArray":
        result[key] = typeof value === "string" ? value.split(",") : value;
        break;

      case "ZodObject":
        try {
          result[key] = typeof value === "string" ? JSON.parse(value) : value;
        } catch {
          result[key] = value;
        }
        break;
      case "ZodBigInt": {
        if (typeof value === "string") {
          result[key] = BigInt(value);
        } else {
          result[key] = value;
        }
        break;
      }
      default:
        result[key] = value;
    }
  }

  return result;
}

class FlickTime<S extends SchemaMap> {
  program = new Command();

  commands: { [K in keyof S]: { schema: S[K]; cmd: Command } } = {} as any;

  constructor(readonly schemas: S) {
    this._init();
  }

  protected _init() {
    const { schemas } = this;
    for (const name in schemas) {
      const schema = schemas[name];
      const cmd = this.program
        .command(name)
        .description(schema.description ?? "");
      const shape = schema.shape;

      for (const key in shape) {
        const def = shape[key] as any;
        const desc = def.description ?? "";
        const isOptional = def.isOptional?.() || !!def._def?.defaultValue;
        const defaultVal = def._def?.defaultValue?.() ?? undefined;

        const flag = `--${key} <${key}>`;
        if (!isOptional && defaultVal === undefined) {
          cmd.requiredOption(flag, desc);
        } else {
          cmd.option(flag, desc, defaultVal);
        }
      }
      this.commands[name] = {
        schema: schemas[name],
        cmd,
      };
    }
  }

  public describe(description: string) {
    this.program.description(description);
    return this;
  }

  public handler<H extends { [K in keyof S]: (args: z.infer<S[K]>) => any }>(
    handlers: H
  ) {
    for (const name in handlers) {
      const { schema, cmd } = this.commands[name];

      cmd.action((opts: any) => {
        const coerced = coerceArgs(opts, schema);
        const parsed = schema.safeParse(coerced);
        if (!parsed.success) {
          console.error("❌ Invalid args for", name);
          console.error(parsed.error.format());
          process.exit(1);
        }
        handlers[name](parsed.data);
      });
    }

    return this;
  }

  public parse() {
    this.program.parse();
    return this;
  }
}

export function flick<S extends SchemaMap>(schemas: S) {
  return new FlickTime(schemas);
}
