import parseDiff from "parse-diff";
import { DiffFile, DiffHunk, ParsedDiff } from "../types";

export class DiffParser {
	parse(diffText: string): ParsedDiff {
		if (!diffText.trim()) {
			return { files: [] };
		}

		try {
			const parsedFiles = parseDiff(diffText);

			const files: DiffFile[] = parsedFiles.map((file) => ({
				oldPath: file.from === "/dev/null" ? null : file.from,
				newPath: file.to === "/dev/null" ? null : file.to,
				isNew: file.from === "/dev/null",
				isDeleted: file.to === "/dev/null",
				hunks: file.chunks.map((chunk) => ({
					oldStart: chunk.oldStart,
					oldLines: chunk.oldLines,
					newStart: chunk.newStart,
					newLines: chunk.newLines,
					lines: chunk.changes.map((change) => {
						const prefix =
							change.type === "add" ? "+" : change.type === "del" ? "-" : " ";
						return `${prefix}${change.content}`;
					}),
				})),
			}));

			return { files };
		} catch (error) {
			throw new Error(
				`Failed to parse diff: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	/**
	 * Get relevant diff text for a specific file and line range
	 */
	getRelevantDiff(
		diffText: string,
		filePath: string,
		startLine?: number,
		endLine?: number,
	): string {
		const lines = diffText.split("\n");
		const fileStartIndex = lines.findIndex(
			(line) => line.startsWith("---") && line.includes(filePath),
		);

		if (fileStartIndex === -1) {
			return "";
		}

		// Find the end of this file's diff
		let fileEndIndex = lines.length;
		for (let i = fileStartIndex + 1; i < lines.length; i++) {
			if (lines[i].startsWith("--- ") && !lines[i].includes(filePath)) {
				fileEndIndex = i;
				break;
			}
		}

		// If line range is specified, filter hunks
		if (startLine !== undefined && endLine !== undefined) {
			const relevantLines: string[] = [];
			let inRelevantHunk = false;
			let currentLine = 0;

			for (let i = fileStartIndex; i < fileEndIndex; i++) {
				const line = lines[i];

				// Track hunk headers
				if (line.startsWith("@@")) {
					const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
					if (match) {
						currentLine = parseInt(match[2]);
						inRelevantHunk = currentLine >= startLine && currentLine <= endLine;
					}
				}

				if (
					inRelevantHunk ||
					line.startsWith("---") ||
					line.startsWith("+++") ||
					line.startsWith("@@")
				) {
					relevantLines.push(line);
				}

				// Update current line number
				if (line.startsWith("+") || line.startsWith(" ")) {
					currentLine++;
				}
			}

			return relevantLines.join("\n");
		}

		return lines.slice(fileStartIndex, fileEndIndex).join("\n");
	}
}
