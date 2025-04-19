#!/usr/bin/env node
import path from "path";
import fs from "fs";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import wretch from "wretch";
import { colorize } from "json-colorizer";
import type { ConfiguredMiddleware, Wretch, WretchResponseChain } from "wretch";
import { CurlGenerator } from "curl-generator";
import { WretchError } from "wretch/resolver";

type Req<T = unknown> = (w: Wretch) => WretchResponseChain<T>;

export function createRequest(req: Req) {
  return {
    req,
  };
}

const curlMiddleware: ConfiguredMiddleware = (next) => (url, options) => {
  const curlCommand = CurlGenerator({
    url,
    //@ts-expect-error allow string
    method: options.method || "GET",
    //@ts-expect-error might be array
    headers: options.headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (options.context) {
    options.context.curlCommand = curlCommand;
  }

  return next(url, options);
};

const program = new Command();

program
  .name("reqscript")
  .description(
    "Run HTTP requests defined in JavaScript/TypeScript files using Wretch",
  )
  .version("0.0.1")
  .argument("<file>", "The request file to run (TypeScript or JavaScript)")
  .option("-v, --verbose", "Show verbose output")
  .option("-e, --env <path>", "Path to environment file", ".env")
  .action(async (file, options) => {
    try {
      // Handle both relative and absolute paths
      const filePath = path.isAbsolute(file)
        ? file
        : path.join(process.cwd(), file);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`Error: File ${filePath} does not exist`));
        process.exit(1);
      }

      const spinner = ora("Running request...").start();

      const requestModule = await import(`file://${filePath}`);

      if (!requestModule.Request) {
        spinner.fail();
        console.error(
          chalk.red(
            `Error: ${filePath} should export a variable named 'Request'`,
          ),
        );
        process.exit(1);
      }

      const req = requestModule.Request.req as Req;

      if (!req) {
        spinner.fail();
        console.error(
          chalk.red(
            `Error: Request should be the return value of createRequest from '#reqscript'`,
          ),
        );
        process.exit(1);
      }

      const context = {
        curlCommand: "",
      };

      try {
        const response = req(
          wretch().options({ context }).middlewares([curlMiddleware]),
        );

        if (options.verbose) {
          console.log("\n" + chalk.yellow("Request Details:"));
          console.log(`File: ${chalk.green(filePath)}`);
          console.log(`Curl Command: '${chalk.green(context.curlCommand)}'`);
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

        if (options.verbose) {
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

          if (options.verbose) {
            console.error(chalk.yellow("\nResponse Details:"));
            console.log(error.response);
            console.log();
          }
          process.exit(1);
        }

        if (error instanceof Error) {
          console.error("\n" + chalk.red("Error:"), error.message);
        }

        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
