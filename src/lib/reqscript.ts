import chalk from "chalk";
import ora from "ora";
import wretch from "wretch";
import { colorize } from "json-colorizer";
import type { ConfiguredMiddleware, Wretch, WretchResponseChain } from "wretch";
import { CurlGenerator } from "curl-generator";
import { WretchError } from "wretch/resolver";
import "dotenv/config";

type Req<T = unknown> = (w: Wretch) => WretchResponseChain<T>;

const verbose = process.argv.includes("--verbose");

export async function createRequest(req: Req): Promise<unknown> {
  let result;
  const context = {
    curlCommand: "",
  };

  const spinner = ora("Running request...").start();

  try {
    const response = req(
      wretch().options({ context }).middlewares([curlMiddleware]),
    );

    if (verbose) {
      console.log("\n" + chalk.yellow("Request Details:"));
      console.log(`Curl Command:\n${chalk.green(context.curlCommand)}`);
      console.log();
    }

    await response.res(async (res) => {
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
    if (error instanceof WretchError) {
      spinner.fail(chalk.red("Request failed"));
      if (error.text) {
        console.error(colorize(JSON.parse(error.text)));
      }

      if (verbose) {
        console.error(chalk.yellow("\nResponse Details:"));
        console.log(error.response);
        console.log();
      }
    }

    if (error instanceof Error) {
      console.error("\n" + chalk.red("Error:"), error.message);
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
