import type { EndpointChange } from "../types";
import { escapeMarkdown, formatGitRef } from "../utils/helpers";

export class MarkdownReporter {
	generate(
		changes: EndpointChange[],
		fromRef: string,
		toRef: string,
		staged = false,
	): string {
		const sections: string[] = [];

		// Header
		sections.push("# API Endpoint Change Report\n");

		if (staged) {
			sections.push("Comparing staged changes with `HEAD`\n");
		} else {
			sections.push(
				`Comparing \`${formatGitRef(fromRef)}\` and \`${formatGitRef(
					toRef,
				)}\`\n`,
			);
		}

		// Group changes by type
		const newEndpoints = changes.filter((c) => c.type === "new-api");
		const modifiedEndpoints = changes.filter((c) => c.type === "param-change");

		// Summary
		if (changes.length === 0) {
			sections.push("**No API endpoint changes detected.**\n");
			return sections.join("\n");
		}

		sections.push("## Summary\n");
		if (newEndpoints.length > 0) {
			sections.push(`- **${newEndpoints.length}** new endpoint(s) detected`);
		}
		if (modifiedEndpoints.length > 0) {
			sections.push(
				`- **${modifiedEndpoints.length}** endpoint(s) with potential parameter changes`,
			);
		}
		sections.push("");

		// New Endpoints Section
		if (newEndpoints.length > 0) {
			sections.push("## New Endpoints\n");

			for (const change of newEndpoints) {
				sections.push(this.formatEndpointChange(change));
			}
		}

		// Modified Endpoints Section
		if (modifiedEndpoints.length > 0) {
			sections.push(
				"## Modified Endpoints (Request Parameter Change Suspected)\n",
			);

			for (const change of modifiedEndpoints) {
				sections.push(this.formatEndpointChange(change));
			}
		}

		return sections.join("\n");
	}

	private formatEndpointChange(change: EndpointChange): string {
		const sections: string[] = [];

		// Header
		const typeLabel = change.type === "new-api" ? "New" : "Modified";
		sections.push(
			`### ${typeLabel} \`${change.functionType}\` for \`${change.endpointPath}\`\n`,
		);

		// File path
		sections.push(`**File:** \`${escapeMarkdown(change.filePath)}\`\n`);

		// Description if available
		if (change.description) {
			sections.push(`**Description:** ${change.description}\n`);
		}

		// Relevant diff
		if (change.relevantDiff?.trim()) {
			sections.push("**Relevant Diff:**");
			sections.push("```diff");
			sections.push(change.relevantDiff);
			sections.push("```\n");
		}

		return sections.join("\n");
	}

	/**
	 * Generate a simple text summary for CLI output
	 */
	generateSummary(changes: EndpointChange[]): string {
		if (changes.length === 0) {
			return "No API endpoint changes detected.";
		}

		const newEndpoints = changes.filter((c) => c.type === "new-api");
		const modifiedEndpoints = changes.filter((c) => c.type === "param-change");

		const parts: string[] = [];

		if (newEndpoints.length > 0) {
			parts.push(`${newEndpoints.length} new endpoint(s)`);
		}

		if (modifiedEndpoints.length > 0) {
			parts.push(`${modifiedEndpoints.length} modified endpoint(s)`);
		}

		return `Found ${parts.join(" and ")}.`;
	}

	/**
	 * Generate JSON output
	 */
	generateJson(
		changes: EndpointChange[],
		fromRef: string,
		toRef: string,
		staged = false,
	): string {
		const report = {
			summary: {
				fromRef: staged ? "staged" : fromRef,
				toRef: staged ? "HEAD" : toRef,
				totalChanges: changes.length,
				newEndpoints: changes.filter((c) => c.type === "new-api").length,
				modifiedEndpoints: changes.filter((c) => c.type === "param-change")
					.length,
				generatedAt: new Date().toISOString(),
			},
			changes: changes.map((change) => ({
				type: change.type,
				endpointPath: change.endpointPath,
				functionType: change.functionType,
				filePath: change.filePath,
				description: change.description,
				// Note: Excluding relevantDiff from JSON to keep it clean
			})),
		};

		return JSON.stringify(report, null, 2);
	}
}
