import chalk from "chalk";
import ora from "ora";
import wretch from "wretch";
import { colorize } from "json-colorizer";
import type { ConfiguredMiddleware, Wretch, WretchResponseChain } from "wretch";
import { CurlGenerator } from "curl-generator";
import { WretchError } from "wretch/resolver";
import "dotenv/config";

export type ReqscriptMetadata = {
  __reqscriptMetadata: true;
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "OPTIONS"
    | "HEAD"
    | "CONNECT"
    | "TRACE"
    | (string & {});
  url: string;
  headers?: Record<string, string>;
  body?: string | null;
};

type Req<T = unknown> = (w: Wretch) =>
  | (WretchResponseChain<T> & {
      __reqscriptMetadata?: false;
    })
  | ReqscriptMetadata
  | Promise<
      WretchResponseChain<T> & {
        __reqscriptMetadata?: false;
      }
    >
  | Promise<ReqscriptMetadata>;

const verbose = process.argv.includes("--verbose");

export async function createRequest(req: Req): Promise<unknown> {
  let result;
  const context = {
    curlCommand: "",
  };

  const spinner = ora("Running request...").start();
  const w = wretch().options({ context }).middlewares([curlMiddleware]);

  try {
    const returnedValue = await req(w);

    let responseChain: WretchResponseChain<unknown>;
    if (returnedValue.__reqscriptMetadata) {
      responseChain = w
        .headers(returnedValue.headers ?? {})
        .fetch(returnedValue.method, returnedValue.url, returnedValue.body);
    } else {
      responseChain = returnedValue;
    }

    if (verbose) {
      console.log("\n" + chalk.yellow("Request Details:"));
      console.log(`Curl Command:\n${chalk.blue(context.curlCommand)}`);
      console.log();
    }

    await responseChain.res(async (res) => {
      spinner.succeed(chalk.green("Request completed successfully"));
      const data = await res.text();
      result = data;

      try {
        const parsedJson = JSON.parse(data);
        result = parsedJson;
        console.log(colorize(parsedJson));
      } catch {
        console.log(data);
      }

      if (verbose) {
        console.log(chalk.yellow("\nResponse Details:"));
        console.log(res);
      }
    });
  } catch (error) {
    spinner.fail(chalk.red("Request failed"));
    if (error instanceof WretchError) {
      if (error.text) {
        try {
          console.error(colorize(JSON.parse(error.text)));
        } catch {
          console.error(error.text);
        }
      }

      if (verbose) {
        console.error(chalk.yellow("\nResponse Details:"));
        console.log(error.response);
        console.log();
      }
    } else if (error instanceof Error) {
      console.error("\n" + chalk.red("Error:"), error);
    }
  }

  spinner.stop();
  return result;
}

const curlMiddleware: ConfiguredMiddleware = (next) => (url, options) => {
  const curlCommand = CurlGenerator({
    url,
    //@ts-expect-error allow string
    method: options.method || "GET",
    //@ts-expect-error might be array
    headers: options.headers,
    body: (options.body as string) ?? undefined,
  });

  if (options.context) {
    options.context.curlCommand = curlCommand;
  }

  return next(url, options);
};
