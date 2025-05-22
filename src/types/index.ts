export interface DiffHunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	lines: string[];
}

export interface DiffFile {
	oldPath: string | null;
	newPath: string | null;
	hunks: DiffHunk[];
	isNew: boolean;
	isDeleted: boolean;
}

export interface GitDiffOptions {
	fromRef: string;
	toRef: string;
	staged?: boolean;
	gitDir?: string;
}

export interface ParsedDiff {
	files: DiffFile[];
}

export interface EndpointChange {
	type: "new-api" | "param-change";
	endpointPath: string;
	functionType: "loader" | "action";
	filePath: string;
	relevantDiff: string;
	description?: string;
}

export interface AnalysisOptions {
	routesDir: string;
	filePattern: string;
	verbose?: boolean;
}

export interface CLIOptions {
	from: string;
	to: string;
	staged: boolean;
	routesDir: string;
	filePattern: string;
	gitDir: string;
	verbose: boolean;
}

export interface RequestParamPattern {
	type:
		| "params"
		| "request.json"
		| "request.formData"
		| "request.text"
		| "request.searchParams";
	property?: string;
	line: number;
	text: string;
}
