import { DiffParser } from "./core/DiffParser";
import { EndpointAnalyzer } from "./core/EndpointAnalyzer";
import { FileFilter } from "./core/FileFilter";
import { GitDiffExecutor } from "./core/GitDiffExecutor";
import { MarkdownReporter } from "./core/MarkdownReporter";
import type { CLIOptions, EndpointChange } from "./types";
import { logVerbose } from "./utils/helpers";

export class ReactRouterEndpointDiff {
	private gitDiffExecutor: GitDiffExecutor;
	private diffParser: DiffParser;
	private fileFilter: FileFilter;
	private endpointAnalyzer: EndpointAnalyzer;
	private markdownReporter: MarkdownReporter;

	constructor(options: Partial<CLIOptions> = {}) {
		const gitDir = options.gitDir || ".";
		const routesDir = options.routesDir || "app/routes";
		const filePattern = options.filePattern || "**/*.{ts,tsx,js,jsx}";

		this.gitDiffExecutor = new GitDiffExecutor(gitDir);
		this.diffParser = new DiffParser();
		this.fileFilter = new FileFilter(routesDir, filePattern);
		this.endpointAnalyzer = new EndpointAnalyzer();
		this.markdownReporter = new MarkdownReporter();
	}

	async analyze(options: Partial<CLIOptions> = {}): Promise<{
		changes: EndpointChange[];
		markdownReport: string;
		summary: string;
	}> {
		const {
			from = "HEAD~1",
			to = "HEAD",
			staged = false,
			routesDir = "app/routes",
			verbose = false,
		} = options;

		try {
			logVerbose("Starting analysis...", verbose);

			// Validate routes directory
			this.fileFilter.validateRoutesDirectory();
			logVerbose(`Routes directory validated: ${routesDir}`, verbose);

			// Execute git diff
			logVerbose(
				`Getting diff from ${from} to ${to}${staged ? " (staged)" : ""}`,
				verbose,
			);
			const diffText = await this.gitDiffExecutor.execute({
				fromRef: from,
				toRef: to,
				staged,
				gitDir: options.gitDir,
			});

			if (!diffText.trim()) {
				logVerbose("No diff found", verbose);
				return {
					changes: [],
					markdownReport: this.markdownReporter.generate([], from, to, staged),
					summary: "No changes detected.",
				};
			}

			// Parse diff
			logVerbose("Parsing diff...", verbose);
			const parsedDiff = this.diffParser.parse(diffText);
			logVerbose(`Found ${parsedDiff.files.length} changed files`, verbose);

			// Filter relevant files
			const relevantFiles = this.fileFilter.filter(parsedDiff.files);
			logVerbose(
				`Filtered to ${relevantFiles.length} relevant route files`,
				verbose,
			);

			if (relevantFiles.length === 0) {
				logVerbose("No relevant route files found in diff", verbose);
				return {
					changes: [],
					markdownReport: this.markdownReporter.generate([], from, to, staged),
					summary: "No relevant route file changes detected.",
				};
			}

			// Analyze endpoint changes
			logVerbose("Analyzing endpoint changes...", verbose);
			const changes = this.endpointAnalyzer.analyzeChanges(
				relevantFiles,
				routesDir,
				diffText,
				verbose,
			);

			logVerbose(`Found ${changes.length} endpoint changes`, verbose);

			// Generate reports
			const markdownReport = this.markdownReporter.generate(
				changes,
				from,
				to,
				staged,
			);
			const summary = this.markdownReporter.generateSummary(changes);

			return {
				changes,
				markdownReport,
				summary,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			logVerbose(`Analysis failed: ${errorMessage}`, verbose);
			throw new Error(`Analysis failed: ${errorMessage}`);
		}
	}

	async generateJsonReport(options: Partial<CLIOptions> = {}): Promise<string> {
		const result = await this.analyze(options);
		const { from = "HEAD~1", to = "HEAD", staged = false } = options;

		return this.markdownReporter.generateJson(result.changes, from, to, staged);
	}
}

// Export all types and classes for library usage
export * from "./types";
export { GitDiffExecutor } from "./core/GitDiffExecutor";
export { DiffParser } from "./core/DiffParser";
export { FileFilter } from "./core/FileFilter";
export { EndpointAnalyzer } from "./core/EndpointAnalyzer";
export { MarkdownReporter } from "./core/MarkdownReporter";
export { ASTParser } from "./core/ASTParser";
export * from "./utils/helpers";
