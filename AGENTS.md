# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Memory
Project memory keeps persistent guidance (steering, specs notes, component docs) so Codex honors your standards each run. Treat it as the long-lived source of truth for patterns, conventions, and decisions.

- Use `.kiro/steering/` for project-wide policies: architecture principles, naming schemes, security constraints, tech stack decisions, api standards, etc.
- Use local `AGENTS.md` files for feature or library context (e.g. `src/lib/payments/AGENTS.md`): describe domain assumptions, API contracts, or testing conventions specific to that folder. Codex auto-loads these when working in the matching path.
- Specs notes stay with each spec (under `.kiro/specs/`) to guide specification-level workflows.

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/prompts:kiro-spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in Simplified Chinese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow
- Phase 0 (optional): `/prompts:kiro-steering`, `/prompts:kiro-steering-custom`
- Phase 1 (Specification):
  - `/prompts:kiro-spec-init "description"`
  - `/prompts:kiro-spec-requirements {feature}`
  - `/prompts:kiro-validate-gap {feature}` (optional: for existing codebase)
  - `/prompts:kiro-spec-design {feature} [-y]`
  - `/prompts:kiro-validate-design {feature}` (optional: design review)
  - `/prompts:kiro-spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/prompts:kiro-spec-impl {feature} [tasks]`
  - `/prompts:kiro-validate-impl {feature}` (optional: after implementation)
- Progress check: `/prompts:kiro-spec-status {feature}` (use anytime)

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/prompts:kiro-spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/prompts:kiro-steering-custom`)

# Context7 Integration Rules

## Core Principle: Documentation as Truth
You have access to the **Context7 MCP tool**, which provides real-time, version-specific documentation from official sources. You must prioritize information retrieved from Context7 over your internal training data, especially for third-party libraries and frameworks.

## 1. When to Use Context7 (Triggers)
You **MUST** invoke the Context7 tool in the following scenarios:
- **New Features:** When the user asks about features released after your knowledge cutoff (e.g., Next.js latest App Router features, React 19, new Python library updates).
- **Third-Party Libraries:** When generating code for specific external libraries (e.g., Shadcn/ui, Tailwind, Stripe, Supabase, Drizzle ORM).
- **Deprecation Checks:** When you are unsure if a specific API or method has been deprecated or changed.
- **Error Resolution:** When the user reports that your generated code is causing "Method not found" or "Import error".

## 2. How to Use Context7 (Action Protocol)
When the trigger conditions are met, follow this step-by-step protocol:

1.  **Identify the Library:** Clearly identify the library and the specific version (if known) relevant to the user's request.
2.  **Consult Docs First:** Before generating any code, use the Context7 tool to fetch the documentation.
    - *Internal Note:* If your environment requires a keyword to trigger the tool, append "use context7" to your internal search query or tool call intent.
3.  **Verify & Synthesize:**
    - Read the retrieved documentation carefully.
    - Check for version mismatches.
    - Look for official "Best Practices" or "Recommended Patterns" in the retrieved context.
4.  **Generate Code:** Write the code strictly adhering to the documentation provided by Context7.

## 3. Negative Constraints (What NOT to do)
- **Do NOT guess APIs:** If you are unsure about a function signature, do not hallucinate. Use Context7 to find the definition.
- **Do NOT mix versions:** Do not mix syntax from old versions (e.g., generic `pages` router) with new versions (e.g., `app` router) unless explicitly requested.
- **Do NOT ignore the tool:** If Context7 returns data, it supersedes your pre-training knowledge.

## 4. Example Internal Thought Process
*User:* "How do I implement a toaster using the latest Sonner library?"
*Bad Response:* (Immediately writing code based on old memory).
*Good Response:* "The user is asking about 'Sonner'. This is a third-party UI library. I need to check the latest syntax. -> **Invoking Context7: 'Sonner library documentation examples'** -> Receiving docs -> Generating code based on the retrieved examples."