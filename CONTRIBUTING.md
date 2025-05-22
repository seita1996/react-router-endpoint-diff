# Contributing to React Router Endpoint Diff

Thank you for your interest in contributing to React Router Endpoint Diff! We welcome contributions from the community.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/react-router-endpoint-diff.git
cd react-router-endpoint-diff
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Development Workflow

### Building
```bash
npm run build        # Build once
npm run dev         # Build in watch mode
```

### Testing
```bash
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
```

### Linting
```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Fix linting errors automatically
```

## Project Structure

```
src/
├── cli.ts                 # CLI entry point
├── index.ts              # Main library entry point
├── types/                # TypeScript type definitions
├── core/                 # Core components
│   ├── GitDiffExecutor.ts
│   ├── DiffParser.ts
│   ├── FileFilter.ts
│   ├── ASTParser.ts
│   ├── EndpointAnalyzer.ts
│   └── MarkdownReporter.ts
├── utils/                # Utility functions
│   └── helpers.ts
└── __tests__/            # Test files
    ├── helpers.test.ts
    └── DiffParser.test.ts
```

## Contributing Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code style and conventions
- Run `npm run lint:fix` before committing
- Add JSDoc comments for public APIs

### Testing
- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Aim for good test coverage of new code

### Documentation
- Update README.md for new features
- Add JSDoc comments for public APIs
- Update help text in CLI if adding new options

### Commit Messages
- Use clear, descriptive commit messages
- Follow the conventional commits format when possible
- Reference issue numbers when applicable

## Types of Contributions

### Bug Reports
- Use the GitHub issue tracker
- Include steps to reproduce
- Provide sample code or repository if possible
- Include version information

### Feature Requests
- Use the GitHub issue tracker
- Describe the use case and motivation
- Consider if the feature fits the project scope

### Pull Requests
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation if needed
7. Submit a pull request

### Pull Request Process
1. Ensure your code follows the style guidelines
2. Include appropriate tests
3. Update documentation as needed
4. The PR will be reviewed by maintainers
5. Address any feedback
6. Once approved, the PR will be merged

## Architecture Notes

### Core Components
- **GitDiffExecutor**: Handles Git operations using simple-git
- **DiffParser**: Parses Git diff output using parse-diff
- **FileFilter**: Filters relevant React Router files
- **ASTParser**: Parses TypeScript/JavaScript using TS Compiler API
- **EndpointAnalyzer**: Analyzes AST changes to detect endpoint modifications
- **MarkdownReporter**: Generates output reports

### Design Principles
- Modular architecture with clear separation of concerns
- Comprehensive error handling
- Extensible design for future enhancements
- Performance-conscious implementation

## Questions?

Feel free to open an issue for any questions about contributing or the codebase.

Thank you for contributing!
