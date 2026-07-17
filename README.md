# Relational Lens

Local-first relationship interpretation for SillyTavern.

## Generated architecture

- `src/analyst`: secondary-model prompt, request, response parsing
- `src/domain`: relationship state, patches, validation, brief compiler
- `src/lifecycle`: canonical turns, fingerprints, cache, coordinator
- `src/st`: SillyTavern adapters and prompt injection
- `src/ui`: settings and diagnostics
- `tests`: domain, lifecycle, and scenario fixtures

## First build

```bash
npm install
npm run check
```

The scaffold intentionally keeps persistent relationship updates behind a
feature boundary. Prove scene-brief quality before enabling durable patches.
