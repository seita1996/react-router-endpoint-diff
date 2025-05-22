#!/usr/bin/env node

import { Command } from "commander";
import { ReactRouterEndpointDiff } from "./index";
import type { CLIOptions } from "./types";

const program = new Command();

program
	.name("rrdiff")
	.description(
		"CLI tool to detect API endpoint changes in React Router applications",
	)
	.version("0.1.1");

program
	.option(
		"--from <ref>",
		"Git reference or date expression to compare from",
		"HEAD~1",
	)
	.option(
		"--to <ref>",
		"Git reference or date expression to compare to",
		"HEAD",
	)
	.option("--staged", "Compare staged changes with HEAD", false)
	.option(
		"--routes-dir <path>",
		"Base directory containing route files",
		"app/routes",
	)
	.option(
		"--file-pattern <glob>",
		"File pattern to match route files",
		"**/*.{ts,tsx,js,jsx}",
	)
	.option("--git-dir <path>", "Git repository path", ".")
	.option("--verbose", "Enable verbose logging", false)
	.option("--json", "Output in JSON format", false)
	.option("--summary-only", "Output only summary text", false);

program.action(async (options) => {
	try {
		const cliOptions: Partial<CLIOptions> = {
			from: options.from,
			to: options.to,
			staged: options.staged,
			routesDir: options.routesDir,
			filePattern: options.filePattern,
			gitDir: options.gitDir,
			verbose: options.verbose,
		};

		const analyzer = new ReactRouterEndpointDiff(cliOptions);

		if (options.json) {
			// JSON output
			const jsonReport = await analyzer.generateJsonReport(cliOptions);
			console.log(jsonReport);
		} else {
			// Regular analysis
			const result = await analyzer.analyze(cliOptions);

			if (options.summaryOnly) {
				console.log(result.summary);
			} else {
				console.log(result.markdownReport);
			}
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error(`Error: ${errorMessage}`);
		process.exit(1);
	}
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);
