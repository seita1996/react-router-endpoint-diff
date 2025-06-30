import {
  filePathToUrlPath,
  isAddedLine,
  containsRequestParamPattern,
  formatGitRef,
} from "../utils/helpers";

describe("Utility Functions", () => {
  describe("filePathToUrlPath", () => {
    it("should convert basic file paths to URL paths", () => {
      expect(filePathToUrlPath("app/routes/users.tsx", "app/routes")).toBe("/users");
      expect(filePathToUrlPath("app/routes/posts/index.tsx", "app/routes")).toBe("/posts");
      expect(filePathToUrlPath("app/routes/index.tsx", "app/routes")).toBe("/");
    });

    it("should handle dynamic segments", () => {
      expect(filePathToUrlPath("app/routes/users/$userId.tsx", "app/routes")).toBe(
        "/users/:userId",
      );
      expect(filePathToUrlPath("app/routes/posts/$postId/comments.tsx", "app/routes")).toBe(
        "/posts/:postId/comments",
      );
    });

    it("should handle splat routes", () => {
      expect(filePathToUrlPath("app/routes/files/$.tsx", "app/routes")).toBe("/files/*");
    });

    it("should handle nested directories", () => {
      expect(filePathToUrlPath("app/routes/admin/users.tsx", "app/routes")).toBe("/admin/users");
      expect(filePathToUrlPath("app/routes/api/v1/users.tsx", "app/routes")).toBe("/api/v1/users");
    });
  });

  describe("isAddedLine", () => {
    it("should identify added lines correctly", () => {
      expect(isAddedLine("+const loader = () => {}")).toBe(true);
      expect(isAddedLine("+ export const action = async () => {}")).toBe(true);
      expect(isAddedLine("+++file.ts")).toBe(false);
      expect(isAddedLine("-removed line")).toBe(false);
      expect(isAddedLine(" unchanged line")).toBe(false);
    });
  });

  describe("containsRequestParamPattern", () => {
    it("should detect request parameter patterns", () => {
      expect(containsRequestParamPattern("+const userId = params.userId")).toBe(true);
      expect(containsRequestParamPattern("+const data = await request.json()")).toBe(true);
      expect(containsRequestParamPattern("+const formData = await request.formData()")).toBe(true);
      expect(containsRequestParamPattern("+const text = await request.text()")).toBe(true);
      expect(containsRequestParamPattern('+const query = searchParams.get("q")')).toBe(true);
      expect(containsRequestParamPattern('+const name = formData.get("name")')).toBe(true);
      expect(containsRequestParamPattern('+const regularCode = "hello world"')).toBe(false);
    });
  });

  describe("formatGitRef", () => {
    it("should format git references correctly", () => {
      expect(formatGitRef("HEAD")).toBe("HEAD");
      expect(formatGitRef("HEAD~1")).toBe("HEAD~1");
      expect(formatGitRef("abc123def456")).toBe("abc123de");
      expect(formatGitRef("v1.0.0")).toBe("v1.0.0");
      expect(formatGitRef("main")).toBe("main");
    });
  });
});
