import { DiffFile, DiffHunk, EndpointChange } from "../types";
import {
	containsRequestParamPattern,
	filePathToUrlPath,
	isAddedLine,
	logVerbose,
} from "../utils/helpers";
import { ASTParser, LoaderActionInfo } from "./ASTParser";
import { DiffParser } from "./DiffParser";

export class EndpointAnalyzer {
	private astParser: ASTParser;
	private diffParser: DiffParser;

	constructor() {
		this.astParser = new ASTParser();
		this.diffParser = new DiffParser();
	}

	analyzeChanges(
		diffFiles: DiffFile[],
		routesDir: string,
		originalDiffText: string,
		verbose = false,
	): EndpointChange[] {
		const changes: EndpointChange[] = [];

		for (const file of diffFiles) {
			try {
				const filePath = file.newPath || file.oldPath;
				if (!filePath) continue;

				logVerbose(`Analyzing file: ${filePath}`, verbose);

				// Detect new API endpoints
				const newApiChanges = this.detectNewApiEndpoints(
					file,
					routesDir,
					originalDiffText,
					verbose,
				);
				changes.push(...newApiChanges);

				// Detect parameter changes in existing endpoints
				const paramChanges = this.detectParameterChanges(
					file,
					routesDir,
					originalDiffText,
					verbose,
				);
				changes.push(...paramChanges);
			} catch (error) {
				logVerbose(
					`Error analyzing file ${file.newPath || file.oldPath}: ${error}`,
					verbose,
				);
			}
		}

		return changes;
	}

	private detectNewApiEndpoints(
		file: DiffFile,
		routesDir: string,
		originalDiffText: string,
		verbose: boolean,
	): EndpointChange[] {
		const changes: EndpointChange[] = [];
		const filePath = file.newPath || file.oldPath;
		if (!filePath) return changes;

		try {
			// Case 1: Entirely new file with loader/action
			if (file.isNew) {
				logVerbose(`Checking new file: ${filePath}`, verbose);
				const sourceFile = this.astParser.parseFile(filePath);
				const functions =
					this.astParser.findLoaderAndActionFunctions(sourceFile);

				for (const func of functions) {
					const urlPath = filePathToUrlPath(filePath, routesDir);
					const relevantDiff = this.diffParser.getRelevantDiff(
						originalDiffText,
						filePath,
					);

					changes.push({
						type: "new-api",
						endpointPath: urlPath,
						functionType: func.type,
						filePath,
						relevantDiff,
						description: `New ${func.type} function in new file`,
					});

					logVerbose(`Found new ${func.type} in new file: ${urlPath}`, verbose);
				}
				return changes;
			}

			// Case 2: New loader/action functions in existing file
			const sourceFile = this.astParser.parseFile(filePath);
			const functions = this.astParser.findLoaderAndActionFunctions(sourceFile);

			for (const func of functions) {
				if (this.isFunctionEntirelyNew(func, file.hunks)) {
					const urlPath = filePathToUrlPath(filePath, routesDir);
					const relevantDiff = this.diffParser.getRelevantDiff(
						originalDiffText,
						filePath,
						func.startLine,
						func.endLine,
					);

					changes.push({
						type: "new-api",
						endpointPath: urlPath,
						functionType: func.type,
						filePath,
						relevantDiff,
						description: `New ${func.type} function added to existing file`,
					});

					logVerbose(
						`Found new ${func.type} in existing file: ${urlPath}`,
						verbose,
					);
				}
			}
		} catch (error) {
			logVerbose(`Error detecting new APIs in ${filePath}: ${error}`, verbose);
		}

		return changes;
	}

	private detectParameterChanges(
		file: DiffFile,
		routesDir: string,
		originalDiffText: string,
		verbose: boolean,
	): EndpointChange[] {
		const changes: EndpointChange[] = [];
		const filePath = file.newPath || file.oldPath;
		if (!filePath || file.isNew) return changes;

		try {
			const sourceFile = this.astParser.parseFile(filePath);
			const functions = this.astParser.findLoaderAndActionFunctions(sourceFile);

			for (const func of functions) {
				if (this.hasParameterChanges(func, file.hunks)) {
					const urlPath = filePathToUrlPath(filePath, routesDir);
					const relevantDiff = this.diffParser.getRelevantDiff(
						originalDiffText,
						filePath,
						func.startLine,
						func.endLine,
					);

					changes.push({
						type: "param-change",
						endpointPath: urlPath,
						functionType: func.type,
						filePath,
						relevantDiff,
						description: `Request parameter pattern changes detected in ${func.type} function`,
					});

					logVerbose(
						`Found parameter changes in ${func.type}: ${urlPath}`,
						verbose,
					);
				}
			}
		} catch (error) {
			logVerbose(
				`Error detecting parameter changes in ${filePath}: ${error}`,
				verbose,
			);
		}

		return changes;
	}

	private isFunctionEntirelyNew(
		func: LoaderActionInfo,
		hunks: DiffHunk[],
	): boolean {
		// Check if the entire function is within added lines
		for (const hunk of hunks) {
			const hunkStartLine = hunk.newStart;
			const hunkEndLine = hunk.newStart + hunk.newLines - 1;

			// Check if function overlaps with this hunk
			if (func.startLine <= hunkEndLine && func.endLine >= hunkStartLine) {
				// Count added lines that overlap with the function
				let addedLinesInFunction = 0;
				let totalLinesInHunk = 0;
				let currentLine = hunk.newStart;

				for (const line of hunk.lines) {
					if (currentLine >= func.startLine && currentLine <= func.endLine) {
						totalLinesInHunk++;
						if (isAddedLine(line)) {
							addedLinesInFunction++;
						}
					}

					// Update line counter
					if (isAddedLine(line) || line.startsWith(" ")) {
						currentLine++;
					}
				}

				// If most lines in the function range are added, consider it new
				if (
					totalLinesInHunk > 0 &&
					addedLinesInFunction / totalLinesInHunk > 0.8
				) {
					return true;
				}
			}
		}

		return false;
	}

	private hasParameterChanges(
		func: LoaderActionInfo,
		hunks: DiffHunk[],
	): boolean {
		// Check if any changes within the function involve parameter patterns
		for (const hunk of hunks) {
			const hunkStartLine = hunk.newStart;
			const hunkEndLine = hunk.newStart + hunk.newLines - 1;

			// Check if hunk overlaps with function
			if (func.startLine <= hunkEndLine && func.endLine >= hunkStartLine) {
				let currentLine = hunk.newStart;

				for (const line of hunk.lines) {
					// Check if this line is within the function and has parameter patterns
					if (currentLine >= func.startLine && currentLine <= func.endLine) {
						if (
							(isAddedLine(line) || line.startsWith("-")) &&
							containsRequestParamPattern(line)
						) {
							return true;
						}
					}

					// Update line counter
					if (isAddedLine(line) || line.startsWith(" ")) {
						currentLine++;
					}
				}
			}
		}

		return false;
	}
}
