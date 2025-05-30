# React Router Endpoint Diff — Compare loaders and actions across commits

[![Test](https://github.com/seita1996/react-router-endpoint-diff/actions/workflows/test.yml/badge.svg)](https://github.com/seita1996/react-router-endpoint-diff/actions/workflows/test.yml)
[![CodeQL](https://github.com/seita1996/react-router-endpoint-diff/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/seita1996/react-router-endpoint-diff/actions/workflows/github-code-scanning/codeql)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/seita1996/react-router-endpoint-diff)

A CLI tool to detect API endpoint changes in React Router applications by analyzing Git diffs and identifying changes to `loader` and `action` functions.

## Features

- **New API Detection**: Identifies newly added `loader` and `action` functions
- **Parameter Change Detection**: Detects potential changes to request parameter handling
- **Git Integration**: Works with any Git repository and supports various comparison methods
- **Flexible Configuration**: Customizable routes directory and file patterns
- **Multiple Output Formats**: Markdown, JSON, and summary-only outputs
- **TypeScript Support**: Built with TypeScript and supports both TS/JS files

## Installation

```bash
npm install -g react-router-endpoint-diff
```

Or use with npx:

```bash
npx react-router-endpoint-diff
```

## Usage

### Basic Usage

```bash
# Compare last commit with current HEAD
rrdiff

# Compare specific commits
rrdiff --from HEAD~3 --to HEAD

# Compare with a specific tag
rrdiff --from v1.0.0 --to HEAD

# Compare staged changes
rrdiff --staged
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--from <ref>` | Git reference to compare from | `HEAD~1` |
| `--to <ref>` | Git reference to compare to | `HEAD` |
| `--staged` | Compare staged changes with HEAD | `false` |
| `--routes-dir <path>` | Base directory containing route files | `app/routes` |
| `--file-pattern <glob>` | File pattern to match route files | `**/*.{ts,tsx,js,jsx}` |
| `--git-dir <path>` | Git repository path | `.` |
| `--verbose` | Enable verbose logging | `false` |
| `--json` | Output in JSON format | `false` |
| `--summary-only` | Output only summary text | `false` |

### Examples

```bash
# Analyze changes in a specific routes directory
rrdiff --routes-dir src/routes

# Get JSON output for CI/CD integration
rrdiff --json

# Compare changes from last week
rrdiff --from 'HEAD@{1.week.ago}' --to HEAD

# Verbose output for debugging
rrdiff --verbose

# Quick summary only
rrdiff --summary-only
```

## Output Format

### Markdown Output (Default)

```markdown
# API Endpoint Change Report

Comparing `HEAD~1` and `HEAD`

## Summary

- **2** new endpoint(s) detected
- **1** endpoint(s) with potential parameter changes

## New Endpoints

### New `loader` for `/users/:userId`

**File:** `app/routes/users/$userId.tsx`

**Description:** New loader function in new file

**Relevant Diff:**
```diff
--- /dev/null
+++ b/app/routes/users/$userId.tsx
@@ -0,0 +1,8 @@
+export const loader: LoaderFunction = async ({ params }) => {
+  const user = await getUser(params.userId);
+  return json(user);
+};
```

## Modified Endpoints (Request Parameter Change Suspected)

### Modified `action` for `/products`

**File:** `app/routes/products.tsx`

**Description:** Request parameter pattern changes detected in action function

**Relevant Diff:**
```diff
--- a/app/routes/products.tsx
+++ b/app/routes/products.tsx
@@ -10,7 +10,8 @@
 export const action: ActionFunction = async ({ request }) => {
-  const formData = await request.formData();
-  const productName = formData.get("name");
+  const data = await request.json();
+  const productName = data.productName;
+  const productPrice = data.price;
   return redirect("/products");
 };
```
```

### JSON Output

```json
{
  "summary": {
    "fromRef": "HEAD~1",
    "toRef": "HEAD",
    "totalChanges": 3,
    "newEndpoints": 2,
    "modifiedEndpoints": 1,
    "generatedAt": "2024-01-15T10:30:00.000Z"
  },
  "changes": [
    {
      "type": "new-api",
      "endpointPath": "/users/:userId",
      "functionType": "loader",
      "filePath": "app/routes/users/$userId.tsx",
      "description": "New loader function in new file"
    }
  ]
}
```

## Programmatic Usage

You can also use this tool as a library in your Node.js applications:

```typescript
import { ReactRouterEndpointDiff } from 'react-router-endpoint-diff';

const analyzer = new ReactRouterEndpointDiff({
  routesDir: 'app/routes',
  gitDir: '.'
});

const result = await analyzer.analyze({
  from: 'HEAD~1',
  to: 'HEAD',
  verbose: false
});

console.log(result.summary);
console.log(result.markdownReport);

// Or get JSON report
const jsonReport = await analyzer.generateJsonReport({
  from: 'HEAD~1',
  to: 'HEAD'
});
```

## How It Works

1. **Git Diff Analysis**: Executes `git diff` between specified references
2. **File Filtering**: Identifies relevant React Router route files
3. **AST Parsing**: Uses TypeScript Compiler API to parse file contents
4. **Pattern Detection**: Looks for `loader` and `action` function exports
5. **Change Analysis**: Compares with diff hunks to detect:
   - New API endpoints (new files or new functions)
   - Parameter changes (modifications to request handling patterns)
6. **Report Generation**: Outputs findings in the requested format

## Supported Patterns

The tool detects the following React Router patterns:

### Loader Functions
```typescript
// Variable declaration
export const loader = async ({ params, request }) => { ... };

// Function declaration
export async function loader({ params, request }) { ... }
```

### Action Functions
```typescript
// Variable declaration
export const action = async ({ params, request }) => { ... };

// Function declaration
export async function action({ params, request }) { ... }
```

### Parameter Patterns
The tool detects changes to these request parameter patterns:

- `params.propertyName`
- `request.json()`
- `request.formData()`
- `request.text()`
- `request.arrayBuffer()`
- `request.blob()`
- `new URL(request.url).searchParams`
- `formData.get()`, `formData.getAll()`, `formData.has()`

## File Path Mapping

The tool converts file paths to URL paths following React Router conventions:

| File Path | URL Path |
|-----------|----------|
| `app/routes/users.tsx` | `/users` |
| `app/routes/users/$userId.tsx` | `/users/:userId` |
| `app/routes/posts/index.tsx` | `/posts` |
| `app/routes/files/$.tsx` | `/files/*` |

## CI/CD Integration

This tool is designed to integrate well with CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Check API Changes
  run: |
    npx react-router-endpoint-diff --json > api-changes.json
    if [ -s api-changes.json ]; then
      echo "API changes detected!"
      cat api-changes.json
    fi
```

## Develop

Build

```
pnpm build
```

Help

```
./dist/cli.js --help
```

Specify the test directory and execute

```
./dist/cli.js --routes-dir . --verbose
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.
