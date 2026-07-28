# Module Decomposition Plan

**Owner:** Engineering  
**Review cadence:** Every development cycle  
**Rule:** No new source file may exceed 1,200 lines. Existing exceptions may not grow beyond the
ratcheted caps in `scripts/check-module-size.mjs`.

| Priority | Module | Target boundaries | Exit condition |
|---:|---|---|---|
| 1 | `DatabaseService` | connection/runtime, generic SQL executor, domain repositories | No new domain query methods; top ten workflows use typed repositories |
| 2 | `CmdbService` | assets, device credentials, lifecycle, network utilities | Each responsibility has characterization tests and an injected service |
| 3 | `AdminService` | tenants, users, plans, platform readiness, governance | Controller depends on focused services; platform checks are isolated |
| 4 | Migration service | runner, state store, migration files | Migration definitions exist only as numbered SQL files |
| 5 | Network page | data hooks, commands, inventory table, discovery, retired devices | Page shell under 400 lines; child units independently tested |
| 6 | Permissions page | role editor, matrix, grants, history, analytics | Page shell under 400 lines; mutations use typed hooks |

## Safe refactor sequence

1. Add characterization tests for current behavior.
2. Extract one responsibility without changing the public contract.
3. Run tenant, permission, unit, and build gates.
4. Reduce the legacy cap in `check-module-size.mjs` to the new file size.
5. Repeat; do not combine a data-layer rewrite with a feature change.
