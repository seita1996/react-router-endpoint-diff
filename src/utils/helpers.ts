import * as path from "path";

/**
 * Convert file path to React Router URL path
 */
export function filePathToUrlPath(filePath: string, routesDir: string): string {
	// Normalize paths
	const normalizedFilePath = path.normalize(filePath);
	const normalizedRoutesDir = path.normalize(routesDir);

	// Get relative path from routes directory
	let relativePath = path.relative(normalizedRoutesDir, normalizedFilePath);

	// Remove file extension
	relativePath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "");

	// Handle index files
	if (relativePath.endsWith("/index") || relativePath === "index") {
		if (relativePath === "index") {
			relativePath = "";
		} else {
			relativePath = relativePath.replace(/\/index$/, "");
		}
		if (relativePath === "") {
			relativePath = "/";
		}
	}

	// Convert to URL path - handle the special case first
	if (relativePath === "/" || relativePath === "") {
		return "/";
	}

	let urlPath = `/${relativePath.replace(/\\/g, "/")}`; // Handle Windows paths

	// Handle dynamic segments ($ prefix)
	urlPath = urlPath.replace(/\/\$([^/]+)/g, "/:$1");

	// Handle splat routes
	urlPath = urlPath.replace(/\/\$$/g, "/*");

	// Normalize slashes
	urlPath = urlPath.replace(/\/+/g, "/");

	// Handle root case
	if (urlPath === "//" || urlPath === "") {
		urlPath = "/";
	}

	return urlPath;
}

/**
 * Check if a line is an addition in diff
 */
export function isAddedLine(line: string): boolean {
	return line.startsWith("+") && !line.startsWith("+++");
}

/**
 * Check if a line is a deletion in diff
 */
export function isDeletedLine(line: string): boolean {
	return line.startsWith("-") && !line.startsWith("---");
}

/**
 * Check if a line is unchanged in diff
 */
export function isUnchangedLine(line: string): boolean {
	return (
		line.startsWith(" ") || (!line.startsWith("+") && !line.startsWith("-"))
	);
}

/**
 * Extract line content without diff prefix
 */
export function extractLineContent(line: string): string {
	if (line.startsWith("+") || line.startsWith("-") || line.startsWith(" ")) {
		return line.substring(1);
	}
	return line;
}

/**
 * Check if the change involves request parameter patterns
 */
export function containsRequestParamPattern(line: string): boolean {
	const content = extractLineContent(line);

	const patterns = [
		"params.",
		"request.json",
		"request.formData",
		"request.text",
		"request.arrayBuffer",
		"request.blob",
		"searchParams",
		"formData.get",
		"formData.getAll",
		"formData.has",
	];

	return patterns.some((pattern) => content.includes(pattern));
}

/**
 * Log verbose message if verbose mode is enabled
 */
export function logVerbose(message: string, verbose = false): void {
	if (verbose) {
		console.error(`[VERBOSE] ${message}`);
	}
}

/**
 * Format git reference for display
 */
export function formatGitRef(ref: string): string {
	// Handle common git references
	if (ref === "HEAD") return "HEAD";
	if (ref.startsWith("HEAD~")) return ref;
	if (ref.match(/^[a-f0-9]{7,40}$/)) {
		// Short commit hash
		return ref.length > 8 ? ref.substring(0, 8) : ref;
	}
	return ref;
}

/**
 * Escape markdown special characters
 */
export function escapeMarkdown(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/\*/g, "\\*")
		.replace(/_/g, "\\_")
		.replace(/`/g, "\\`")
		.replace(/~/g, "\\~")
		.replace(/\|/g, "\\|");
}
