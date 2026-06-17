# Quality Gates

Every pull request and deployment must pass:

## Frontend

- TypeScript and Next.js production build.
- ESLint with zero warnings.
- Unit and component tests.
- Automated accessibility tests for shared primitives and critical forms.
- Browser smoke coverage for login, administration, settings, reports, billing, and ticket lifecycle.
- PWA/mobile smoke coverage for manifest installability, app icons, shortcuts, service worker, offline fallback, and small viewport overflow.

## Backend

- TypeScript build.
- Permission-decorator coverage check.
- Tenant SQL safety check.
- Unit tests.
- Full E2E suite against MySQL, including tenant customization and isolation.
- Migration startup against a clean database.

## Deployment

- Hostinger configuration preflight.
- Public frontend and API health, readiness, and liveness checks.
- Authenticated smoke checks for the deployed role.
- Monitoring dashboard check when `MONITORING_API_KEY` is configured.
- Temporary mutation checks only when explicitly enabled.
- Real-device mobile install check on Android Chrome and iPhone Safari before public launch.

## Repository hygiene

- Never commit `.next`, `dist`, `coverage`, Playwright output, logs, `*.tsbuildinfo`, generated
  marketing frames, or rendered document output.
- Keep generated media in external artifact storage or a release attachment.
- Do not commit credentials, tokens, production environment files, or database exports.

## Module maintenance

Files approaching 800 lines should be reviewed for extraction by domain responsibility. Files over
1,200 lines require a documented exception or a decomposition change in the same development cycle.
