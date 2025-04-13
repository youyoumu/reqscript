#!/usr/bin/env node
import path from "path";
import fs from "fs";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import wretch from "wretch";

import type { ConfiguredMiddleware } from "wretch";
import { CurlGenerator } from "curl-generator";

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

      if (
        !requestModule.default ||
        typeof requestModule.default !== "function"
      ) {
        spinner.fail();
        console.error(
          chalk.red(
            `Error: ${filePath} should export a function as default export`,
          ),
        );
        process.exit(1);
      }

      const context = {
        curlCommand: "",
      };

      function printVerbose() {
        if (options.verbose) {
          console.log("\n" + chalk.yellow("Request Details:"));
          console.log(`File: ${chalk.green(filePath)}`);
          console.log(`Curl Command: '${chalk.green(context.curlCommand)}'`);
        }
      }

      try {
        const response = await requestModule.default(
          wretch().options({ context }).middlewares([curlMiddleware]),
        );
        spinner.succeed(chalk.green("Request completed successfully"));

        // Display the response
        console.log("\n" + chalk.blue("Response:"));

        if (typeof response === "object") {
          console.log(JSON.stringify(response, null, 2));
        } else {
          console.log(response);
        }

        printVerbose();
      } catch (error: any) {
        spinner.fail(chalk.red("Request failed"));
        console.error("\n" + chalk.red("Error:"), error.message);

        if (error.response) {
          console.error(chalk.yellow("\nResponse:"));
          console.error(error.response);
        }

        printVerbose();

        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
