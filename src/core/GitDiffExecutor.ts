import { simpleGit, SimpleGit } from "simple-git";
import { GitDiffOptions } from "../types";

export class GitDiffExecutor {
	private git: SimpleGit;

	constructor(gitDir = ".") {
		this.git = simpleGit(gitDir);
	}

	async execute(options: GitDiffOptions): Promise<string> {
		const { fromRef, toRef, staged } = options;

		try {
			// Check if git repository exists
			const isRepo = await this.git.checkIsRepo();
			if (!isRepo) {
				throw new Error(
					`Not a git repository: ${options.gitDir || process.cwd()}`,
				);
			}

			let diffResult: string;

			if (staged) {
				// Compare staged changes with HEAD
				diffResult = await this.git.diff(["--cached", "--unified=3"]);
			} else {
				// Resolve refs to ensure they exist
				await this.resolveRef(fromRef);
				await this.resolveRef(toRef);

				// Execute git diff
				diffResult = await this.git.diff([
					"--unified=3",
					`${fromRef}...${toRef}`,
				]);
			}

			return diffResult;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Git diff execution failed: ${error.message}`);
			}
			throw new Error("Git diff execution failed: Unknown error");
		}
	}

	private async resolveRef(ref: string): Promise<void> {
		try {
			await this.git.revparse([ref]);
		} catch (error) {
			throw new Error(`Invalid git reference: ${ref}`);
		}
	}

	async getCurrentBranch(): Promise<string> {
		try {
			const branch = await this.git.branch();
			return branch.current || "HEAD";
		} catch (error) {
			return "HEAD";
		}
	}
}
