# Tenant customization

Tenant administrators can publish company-specific presentation and behavior from `/settings`.
Customization remains isolated in the tenant's existing `Company.branding` and `Company.settings`
JSON fields.

Supported controls:

- Logos, browser icon, login background, and sidebar imagery through validated tenant uploads.
- Primary, secondary, accent, background, surface, and text colors plus corner radius.
- Dismissible information, success, warning, or critical workspace banners.
- Default workflow trigger and optional approval step for newly created workflows.
- Report logo, accent, header/footer text, date range, and page orientation preferences.

Uploaded images accept PNG, JPEG, and WebP files up to 5 MB. The upload route requires
`settings.manage`, stores files under a tenant-specific directory, and runs the existing malware
and content-signature checks.

The authenticated app hydrates `/settings` after login and applies the theme with CSS variables.
Super-admin company context requests use the same tenant-scoped settings endpoint.
