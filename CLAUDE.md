# CLAUDE.md

This file defines the baseline engineering rules for Claude when working on this project. Follow these instructions unless the user explicitly gives different directions.

## Core Principles

- Build reliable, maintainable software that a mid-level developer can understand and extend.
- Prefer simple, explicit solutions over clever or overly abstract ones.
- Respect the existing codebase. Match its style, architecture, naming conventions, and tooling before introducing anything new.
- Do not make broad, unrelated changes while completing a focused task.
- When context is missing or a requirement is ambiguous, ask the user for clarification before making risky assumptions.

## Project Discovery

- Before editing code, inspect the existing project structure.
- Confirm that referenced files, folders, module names, functions, classes, routes, and configuration keys actually exist before using them.
- Read nearby code before changing a file so the implementation fits the local patterns.
- Check dependency files before importing a package. Do not hallucinate libraries, APIs, or helper functions.
- If a dependency is required but missing, ask the user before adding it unless the task clearly requires dependency installation.

## Code Structure & Modularity

- Never create a source code file longer than 500 lines.
- If a file approaches 500 lines, refactor by splitting it into smaller modules, helper files, or feature-specific components.
- Organize code by feature or responsibility, not by convenience.
- Keep modules focused on one clear purpose.
- Avoid circular dependencies.
- Prefer small, composable functions and classes.
- Keep business logic separate from framework glue, UI code, routing, and external service integrations when practical.
- Avoid duplicating logic. Extract shared behavior only when it is genuinely reused or improves clarity.
- Do not introduce a new architecture or abstraction unless it solves a real problem in the current codebase.

## Implementation Rules

- Make the smallest complete change that satisfies the task.
- Preserve backward compatibility unless the user asks for a breaking change.
- Validate inputs at system boundaries such as APIs, CLIs, forms, file parsers, and external integrations.
- Handle errors intentionally. Avoid swallowing exceptions silently.
- Use clear names for variables, functions, classes, files, and modules.
- Avoid hardcoded values when they should be configuration, constants, or environment variables.
- Keep secrets, tokens, credentials, and private configuration out of source code.
- Do not delete or overwrite existing code unless explicitly instructed or clearly required for the task.
- If existing code must be removed, explain why and ensure tests cover the replacement behavior.

## Testing & Reliability

- Always create unit tests for new features, including new functions, classes, routes, commands, and important UI behavior.
- After updating logic, check whether existing tests need to be updated. If they do, update them in the same task.
- Tests should live in a `tests/` folder that mirrors the main application structure when possible.
- Each new feature should include at least:
  - One test for expected behavior.
  - One edge case test.
  - One failure case test.
- Add regression tests for bug fixes.
- Keep tests deterministic. Avoid reliance on real time, random values, network calls, or external services unless they are mocked or controlled.
- Use fixtures, factories, or helper functions when they make tests easier to read.
- Run the relevant test suite before considering the task complete.
- If tests cannot be run, explain exactly why and what should be run manually.

## Documentation & Explainability

- Update `README.md` when:
  - New features are added.
  - Dependencies change.
  - Setup steps change.
  - Commands, environment variables, or configuration options change.
- Document public APIs, commands, configuration, and non-obvious workflows.
- Comment non-obvious code so it is understandable to a mid-level developer.
- Do not comment obvious code.
- When writing complex logic, include an inline `# Reason:` comment explaining why the approach is necessary, not just what the code does.
- Keep documentation accurate and concise.

## AI Behavior Rules

- Never assume missing context when the decision could affect architecture, data, security, compatibility, or user experience.
- Ask clarifying questions when requirements are uncertain.
- Never hallucinate libraries, functions, file paths, modules, environment variables, commands, or APIs.
- Verify packages, imports, file paths, and module names before referencing them in code or tests.
- Do not invent behavior for external services. Use official documentation or existing project integrations as the source of truth.
- Do not delete, rewrite, or replace existing work unless explicitly instructed or clearly necessary for the requested task.
- If a requested change may be risky, explain the risk and choose the safest reasonable implementation.
- If multiple implementation paths are valid, prefer the one that best matches the current codebase.
- Do not mark work as complete until code, tests, and documentation have been considered.

## Git Workflow

- Always develop features and fixes on a separate branch.
- Treat `main` as the default primary branch name unless the existing repository clearly uses a different primary branch.
- Do not merge back into the main branch without user authorization.
- Only request permission to merge after relevant tests have passed.
- Make short, clear commits after completing each meaningful part of the work.
- Use Conventional Commits format for every commit message:
  - `type: short imperative summary`
  - `type(scope): short imperative summary` when a scope adds useful context.
- Use the following commit types:
  - `feat:` for a new feature or user-visible capability.
  - `fix:` for a bug fix.
  - `docs:` for documentation-only changes.
  - `test:` for adding or updating tests without production logic changes.
  - `refactor:` for code restructuring that does not change behavior.
  - `perf:` for performance improvements.
  - `style:` for formatting, linting, or whitespace-only changes.
  - `chore:` for maintenance tasks, tooling, dependency updates, or project configuration.
  - `build:` for build system, packaging, or dependency management changes.
  - `ci:` for CI/CD workflow changes.
  - `revert:` for reverting a previous commit.
- Commit summaries must be concise, imperative, and lower-case after the prefix unless a proper noun is required.
- Do not end commit summaries with a period.
- Examples:
  - `feat(auth): add password reset flow`
  - `fix: handle empty invoice dates`
  - `docs: update local setup steps`
  - `test(api): cover invalid token response`
  - `refactor: split payment validation helpers`
- For breaking changes, add `!` after the type or scope and explain the impact in the commit body, for example `feat(api)!: remove legacy user endpoint`.
- If a task includes unrelated changes, split them into separate commits with appropriate types.
- Keep commits focused. Avoid mixing unrelated changes in one commit.
- Before committing, review the diff to ensure no accidental files, secrets, logs, build artifacts, or unrelated edits are included.
- Never rewrite shared Git history unless the user explicitly asks for it.

## Versioning

- Every project should have a configured version number.
- For a new project, start at `0.0.1`.
- After each completed branch goal, Claude may increment only the patch version, for example `0.0.1` to `0.0.2`.
- Major and minor version changes must be guided by the user.
- After the MVP is implemented and accepted by the user, update the version to `1.0.0` only under the user's direction.
- Keep the version number consistent across project files such as package manifests, config files, documentation, and release notes.

## Security & Data Safety

- Never commit secrets, API keys, private tokens, passwords, certificates, or sensitive user data.
- Use environment variables or secret management tools for sensitive configuration.
- Validate and sanitize untrusted input.
- Avoid logging sensitive information.
- Be careful with file operations. Confirm paths before modifying, moving, or deleting files.
- Use least-privilege assumptions for permissions, credentials, and external access.

## Dependencies

- Prefer standard library or existing project dependencies when they are sufficient.
- Add new dependencies only when they provide clear value.
- Verify that a dependency is actively maintained, appropriate for the project license, and compatible with the existing stack.
- Update dependency documentation and setup instructions when dependencies change.
- Avoid introducing large frameworks for small tasks.

## Completion Checklist

Before considering a task complete, verify:

- The implementation satisfies the user's request.
- The change is scoped and consistent with the existing codebase.
- New or changed logic has appropriate tests.
- Relevant tests have been run, or the reason they could not be run is documented.
- Documentation has been updated when needed.
- File paths, imports, and module names are valid.
- No unrelated code was changed.
- No secrets or generated artifacts were accidentally included.
- Version changes were applied when appropriate.
- A clear commit was made for the completed unit of work when using Git.
