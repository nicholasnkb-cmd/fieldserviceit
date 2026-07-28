# Accessibility Conformance Report

Product: FieldserviceIT web application  
Report version: 2026.07 draft  
Evaluation standard: WCAG 2.2 Level A and AA  
Evaluation methods: component tests with axe, production-mode Playwright with axe-core, keyboard navigation, 320 CSS-pixel reflow, responsive desktop/mobile checks, semantic inspection, and manual-review requirements.

This is an internal conformance report, not a third-party certification. “Supports” below means the implemented design and automated evidence support the criterion; manual assistive-technology verification remains required where noted.

| WCAG area | Status | Current evidence and remaining review |
|---|---|---|
| 1.1 Text alternatives | Supports | Images and icon-only controls are checked for accessible names; manually review user-uploaded content. |
| 1.2 Time-based media | Not applicable to core workflows | No required prerecorded media in the core application; reassess when media is added. |
| 1.3 Adaptable structure | Supports with manual review | Headings, labels, tables, lists, and landmarks are automated; screen-reader reading order requires annual manual testing. |
| 1.4 Distinguishable content | Supports with manual review | Automated contrast and 320-pixel reflow gates run; manually test 200%/400% zoom, forced colors, and user branding combinations. |
| 2.1 Keyboard accessible | Supports | Login, navigation, forms, dialogs, security controls, and skip link receive browser keyboard coverage. |
| 2.2 Enough time | Supports | Security ceremonies expose browser timeouts and retry; verify session-expiration messaging manually. |
| 2.3 Seizures and physical reactions | Supports | No flashing content is intentionally used. |
| 2.4 Navigable | Supports | Skip links, page titles, headings, focus movement, and named controls are regression tested. |
| 2.5 Input modalities | Supports with manual review | Controls use native semantics and sufficient targets; test touch/voice operation on representative mobile devices annually. |
| 3.1 Readable | Supports | Root language is declared and plain-language labels are used. |
| 3.2 Predictable | Supports | Navigation and form interactions are consistent; state changes provide visible status. |
| 3.3 Input assistance | Supports | Required fields, validation, error alerts, and status messages are tested; legal/financial confirmation content requires periodic review. |
| 4.1 Compatible | Supports with manual review | Automated name/role/value analysis runs on public and authenticated workflows; manually test current NVDA/Chrome, VoiceOver/Safari, and TalkBack/Chrome. |

## Required manual matrix before external publication

- NVDA with current Chrome on Windows: login, MFA, passkey fallback, ticket creation, network inventory, privacy request, and administration.
- VoiceOver with Safari on current macOS and iOS: the same critical workflows and rotor navigation.
- TalkBack with Chrome on current Android: login, ticket, profile/security, and responsive navigation.
- 200% and 400% browser zoom, Windows High Contrast/forced colors, reduced motion, and text-spacing overrides.
- At least one participant with a disability or qualified accessibility reviewer for task-based usability feedback.

Record defects with the affected success criterion, severity, owner, target date, retest evidence, and release identifier. Update this report after material UI changes and at least annually.
