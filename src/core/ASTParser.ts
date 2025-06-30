import * as fs from "node:fs";
import * as ts from "typescript";

export interface LoaderActionInfo {
  type: "loader" | "action";
  name: string;
  startLine: number;
  endLine: number;
  isExported: boolean;
  parameterPatterns: string[];
}

export class ASTParser {
  private compilerOptions: ts.CompilerOptions;

  constructor() {
    this.compilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      allowJs: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      skipLibCheck: true,
      strict: false, // Be lenient with user code
    };
  }

  parseFile(filePath: string): ts.SourceFile {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const sourceText = fs.readFileSync(filePath, "utf8");
    return this.parseSource(sourceText, filePath);
  }

  parseSource(sourceText: string, fileName: string): ts.SourceFile {
    const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.ES2020, true);

    // Check for parse diagnostics - TypeScript 5.x compatible
    // Note: sourceFile.parseDiagnostics does not exist in the public API.
    // To get diagnostics, you need to use a TypeScript program.
    // Here, we skip diagnostics reporting for single-file parsing.

    return sourceFile;
  }

  findLoaderAndActionFunctions(sourceFile: ts.SourceFile): LoaderActionInfo[] {
    const results: LoaderActionInfo[] = [];

    const visit = (node: ts.Node) => {
      // Check for exported variable declarations: export const loader = ...
      if (ts.isVariableStatement(node) && this.hasExportModifier(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (ts.isIdentifier(declaration.name)) {
            const name = declaration.name.text;
            if (name === "loader" || name === "action") {
              const info = this.extractFunctionInfo(node, name as "loader" | "action", sourceFile);
              if (info) {
                results.push(info);
              }
            }
          }
        });
      }

      // Check for exported function declarations: export function loader() {}
      if (ts.isFunctionDeclaration(node) && this.hasExportModifier(node) && node.name) {
        const name = node.name.text;
        if (name === "loader" || name === "action") {
          const info = this.extractFunctionInfo(node, name as "loader" | "action", sourceFile);
          if (info) {
            results.push(info);
          }
        }
      }

      // Check for export assignments: export { loader, action }
      if (
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      ) {
        node.exportClause.elements.forEach((element) => {
          const name = element.name.text;
          if (name === "loader" || name === "action") {
            // Find the original declaration
            const declaration = this.findDeclaration(sourceFile, name);
            if (declaration) {
              const info = this.extractFunctionInfo(
                declaration,
                name as "loader" | "action",
                sourceFile,
              );
              if (info) {
                results.push({ ...info, isExported: true });
              }
            }
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return results;
  }

  private hasExportModifier(node: ts.Node): boolean {
    if (ts.canHaveModifiers(node)) {
      const modifiers = node.modifiers;
      return (
        modifiers?.some((modifier: ts.Modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
        false
      );
    }
    return false;
  }

  private extractFunctionInfo(
    node: ts.Node,
    type: "loader" | "action",
    sourceFile: ts.SourceFile,
  ): LoaderActionInfo | null {
    const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

    const parameterPatterns = this.extractParameterPatterns(node);

    return {
      type,
      name: type,
      startLine: startPos.line + 1, // Convert to 1-based line numbers
      endLine: endPos.line + 1,
      isExported: this.hasExportModifier(node),
      parameterPatterns,
    };
  }

  private extractParameterPatterns(node: ts.Node): string[] {
    const patterns: string[] = [];

    const visit = (node: ts.Node) => {
      // Look for patterns like params.userId, request.json(), etc.
      if (ts.isPropertyAccessExpression(node)) {
        const text = node.getText();
        if (
          text.includes("params.") ||
          text.includes("request.json") ||
          text.includes("request.formData") ||
          text.includes("request.text") ||
          text.includes("searchParams")
        ) {
          patterns.push(text);
        }
      }

      // Look for destructuring patterns
      if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
        patterns.push(node.getText());
      }

      ts.forEachChild(node, visit);
    };

    visit(node);
    return patterns;
  }

  private findDeclaration(sourceFile: ts.SourceFile, name: string): ts.Node | null {
    let found: ts.Node | null = null;

    const visit = (node: ts.Node) => {
      if (found) return;

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
        found = node.parent.parent; // Get the variable statement
      } else if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
        found = node;
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return found;
  }

  getSourceLineContent(sourceFile: ts.SourceFile, lineNumber: number): string {
    const lines = sourceFile.getFullText().split("\n");
    return lines[lineNumber - 1] || "";
  }
}
