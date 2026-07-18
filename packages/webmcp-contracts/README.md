# `@zto/webmcp-contracts`

Framework-neutral six-module WebMCP runtime for contract version `zto-webmcp-v1`.

```bash
# from frontend-repository root
npm install
npm run test:webmcp-contracts
npm run build:webmcp-contracts
```

## Harbor task consumption API

```ts
import {
  CONTRACT_VERSION,
  compileModules,
  createContractRuntime,
  validateAssignmentEntry,
} from "@zto/webmcp-contracts";
import { mountReactWebMcp } from "@zto/webmcp-contracts/adapters/react";
// also: adapters/{svelte,vue,angular,vanilla}
```

1. Read seed map: `schemas/webmcp-assignment-map.json` (23 `frontend-*` entries).
2. `validateAssignmentEntry(entry)` then `compileModules(entry.modules, entry.bindings, handlers)`.
3. Mount with a lifecycle adapter; bind handlers to the same functions as visible controls.
4. Never own product state; never score via WebMCP.

- Specs: `specs/modules/*`, `specs/versioning.json`
- Schema: `specs/assignment-map.schema.json` (also exported as `@zto/webmcp-contracts/assignment-map.schema.json`)
