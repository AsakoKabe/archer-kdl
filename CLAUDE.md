# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build              # Full build (packages → langium-generate → compile → bundle)
yarn compile            # TypeScript compilation (tsc -b)
yarn bundle             # Webpack bundle all components
yarn watch              # Watch mode (tsc + extension + GLSP server)
yarn lint               # ESLint across all workspaces
yarn langium-generate   # Regenerate parser/AST from .langium grammars
yarn package            # Package VS Code extension as .vsix
yarn clean              # Clean all generated artifacts

# Run commands in specific workspaces
yarn kdl-language <cmd>
yarn webview <cmd>
yarn extension <cmd>
```

Requires Node >= 16.11.0 (prefer 18.19.1) and Yarn 1.x.

## Architecture

This is a **Yarn/Lerna monorepo** implementing a VS Code extension that visualizes Kubernetes Deployment Language (KDL) files as interactive diagrams.

### Three-Server Model

The extension runs three cooperating servers, all launched from the Language Server:

1. **Language Server (LSP)** — `kdl-language/src/language-server/`
   Langium-based parser for `.kdl` files. Provides parsing, validation, completions, semantic tokens, and cross-reference resolution. Entry point: `main.ts`.

2. **GLSP Server** — `kdl-language/src/glsp-server/`
   Transforms the KDL AST into a graphical model for diagram rendering. Handles user interactions (create, delete, move, route edges) via operation handlers. Entry point: `app.ts`.

3. **Model Server** — `kdl-language/src/model-server/`
   RPC interface exposing the semantic model for form-based editing and programmatic access.

### Workspaces

| Workspace | Path | Purpose |
|-----------|------|---------|
| `kdl-language` | `kdl-language/` | Language server, GLSP server, model server, Kubernetes integration |
| `@kdl/protocol` | `packages/protocol/` | Shared protocol constants and types |
| `@kdl/glsp-client` | `packages/glsp-client/` | GLSP client configuration and CSS |
| `kdl-extension` | `vscode/kdl-extension/` | VS Code extension host, editor provider |
| `kdl-webview` | `vscode/kdl-webview/` | Webview that renders the GLSP diagram |

### Data Flow

User opens `.kdl` file → Language Server parses AST → GLSP Server builds graphical model → Webview renders diagram. Diagram edits flow back through GLSP operation handlers which update the AST, triggering re-validation.

## Key Conventions

- **Grammar files** (`.langium`) live in `kdl-language/src/language-server/`. The grammar uses indentation-aware parsing with synthetic INDENT/DEDENT tokens. Run `yarn langium-generate` after editing grammars — generated code goes to `language-server/generated/` (do not edit manually).
- **Validators** are split by domain in `language-server/validators/` (pod, service, ingress, volume, container, controller). The orchestrator is `kdl-validator.ts`.
- **Operation handlers** in `glsp-server/kdl-diagram/handler/` are organized by operation type (`create/`, `validate/`, `recovery/`).
- **Dependency injection** uses Inversify throughout (Langium modules + GLSP modules). Service registration is in `kdl-module.ts` (language) and `kdl-diagram-module.ts` (GLSP).
- **Domain model hierarchy**: KDLDiagram → NamespaceNode → [IngressNode, ServiceNode, PodNode]. Pods contain controllers, volumes, containers, and ports. Services/Ingresses reference PortNodes.
- **Shared configs** (ESLint, TypeScript, Jest) live in `configs/`.
