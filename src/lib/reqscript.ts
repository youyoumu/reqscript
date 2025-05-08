import chalk from "chalk";
import ora from "ora";
import wretch from "wretch";
import { colorize } from "json-colorizer";
import type { ConfiguredMiddleware, Wretch, WretchResponseChain } from "wretch";
import { CurlGenerator } from "curl-generator";
import { WretchError } from "wretch/resolver";
import "dotenv/config";

type Req<T = unknown> = (w: Wretch) => WretchResponseChain<T>;

const verbose = process.env.REQSCRIPT_VERBOSE === "true";

export async function createRequest(req: Req) {
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

    await response.json((data) => {
      spinner.succeed(chalk.green("Request completed successfully"));

      if (typeof data === "object") {
        console.log(colorize(data));
      } else {
        console.log(data);
      }
    });

    if (verbose) {
      await response.res((response) => {
        console.log(chalk.yellow("\nResponse Details:"));
        console.log(response);
      });
    }
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
