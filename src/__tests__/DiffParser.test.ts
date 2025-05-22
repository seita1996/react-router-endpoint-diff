import { DiffParser } from "../core/DiffParser";

describe("DiffParser", () => {
	let parser: DiffParser;

	beforeEach(() => {
		parser = new DiffParser();
	});

	describe("parse", () => {
		it("should parse empty diff", () => {
			const result = parser.parse("");
			expect(result.files).toHaveLength(0);
		});

		it("should parse simple file addition", () => {
			const diffText = `diff --git a/app/routes/users.tsx b/app/routes/users.tsx
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/app/routes/users.tsx
@@ -0,0 +1,5 @@
+export const loader = async () => {
+  return json({ users: [] });
+};
+
+export default function Users() {}`;

			const result = parser.parse(diffText);
			expect(result.files).toHaveLength(1);
			expect(result.files[0].isNew).toBe(true);
			expect(result.files[0].newPath).toBe("app/routes/users.tsx");
			expect(result.files[0].hunks).toHaveLength(1);
		});

		it("should parse file modification", () => {
			const diffText = `diff --git a/app/routes/users.tsx b/app/routes/users.tsx
index abc1234..def5678 100644
--- a/app/routes/users.tsx
+++ b/app/routes/users.tsx
@@ -1,3 +1,4 @@
 export const loader = async () => {
+  const users = await getUsers();
-  return json({ users: [] });
+  return json({ users });
 };`;

			const result = parser.parse(diffText);
			expect(result.files).toHaveLength(1);
			expect(result.files[0].isNew).toBe(false);
			expect(result.files[0].isDeleted).toBe(false);
			expect(result.files[0].hunks).toHaveLength(1);
		});
	});

	describe("getRelevantDiff", () => {
		const sampleDiff = `diff --git a/app/routes/users.tsx b/app/routes/users.tsx
index abc1234..def5678 100644
--- a/app/routes/users.tsx
+++ b/app/routes/users.tsx
@@ -1,5 +1,6 @@
 export const loader = async () => {
+  const users = await getUsers();
   return json({ users: [] });
 };
 
 export default function Users() {}`;

		it("should extract relevant diff for specific file", () => {
			const result = parser.getRelevantDiff(sampleDiff, "app/routes/users.tsx");
			expect(result).toContain("--- a/app/routes/users.tsx");
			expect(result).toContain("+++ b/app/routes/users.tsx");
			expect(result).toContain("export const loader");
		});

		it("should return empty string for non-existent file", () => {
			const result = parser.getRelevantDiff(sampleDiff, "nonexistent.tsx");
			expect(result).toBe("");
		});
	});
});
