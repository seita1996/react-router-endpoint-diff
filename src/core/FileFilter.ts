import * as path from "path";
import * as fs from "fs";
import { DiffFile } from "../types";

export class FileFilter {
	private routesDir: string;
	private filePattern: string;

	constructor(routesDir: string, filePattern = "**/*.{ts,tsx,js,jsx}") {
		this.routesDir = routesDir;
		this.filePattern = filePattern;
	}

	filter(files: DiffFile[]): DiffFile[] {
		return files.filter((file) => this.isRelevantFile(file));
	}

	private isRelevantFile(file: DiffFile): boolean {
		// Skip deleted files
		if (file.isDeleted) {
			return false;
		}

		const filePath = file.newPath || file.oldPath;
		if (!filePath) {
			return false;
		}

		// Check if file is in routes directory
		const normalizedFilePath = path.normalize(filePath);
		const normalizedRoutesDir = path.normalize(this.routesDir);

		if (!normalizedFilePath.includes(normalizedRoutesDir)) {
			return false;
		}

		// Check file extension
		const ext = path.extname(filePath);
		const allowedExtensions = [".ts", ".tsx", ".js", ".jsx"];

		if (!allowedExtensions.includes(ext)) {
			return false;
		}

		// Skip layout files (files starting with _)
		const basename = path.basename(filePath);
		if (basename.startsWith("_")) {
			return false;
		}

		return true;
	}

	/**
	 * Check if routes directory exists
	 */
	validateRoutesDirectory(): void {
		if (!fs.existsSync(this.routesDir)) {
			throw new Error(`Routes directory not found: ${this.routesDir}`);
		}

		const stat = fs.statSync(this.routesDir);
		if (!stat.isDirectory()) {
			throw new Error(`Routes path is not a directory: ${this.routesDir}`);
		}
	}

	/**
	 * Get all route files in the routes directory (for development/testing)
	 */
	getAllRouteFiles(): string[] {
		if (!fs.existsSync(this.routesDir)) {
			return [];
		}

		const files: string[] = [];

		const scanDirectory = (dir: string) => {
			const entries = fs.readdirSync(dir);

			for (const entry of entries) {
				const fullPath = path.join(dir, entry);
				const stat = fs.statSync(fullPath);

				if (stat.isDirectory()) {
					scanDirectory(fullPath);
				} else if (
					this.isRelevantFile({
						oldPath: null,
						newPath: fullPath,
						hunks: [],
						isNew: false,
						isDeleted: false,
					})
				) {
					files.push(fullPath);
				}
			}
		};

		scanDirectory(this.routesDir);
		return files;
	}
}
