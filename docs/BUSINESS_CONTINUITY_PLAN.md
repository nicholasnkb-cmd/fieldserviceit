# Business Continuity Plan

## Scope and objectives

FieldserviceIT prioritizes authentication, tenant isolation, ticket access, network inventory, and customer communications. The service target is a four-hour recovery time and a 24-hour-or-better recovery point, subject to the contracted hosting and backup configuration.

## Activation

The incident commander activates this plan when production is unavailable beyond the agreed alert window, data integrity is uncertain, a critical provider is unavailable, or recovery is expected to exceed normal operational handling.

## Recovery sequence

1. Preserve logs and identify the last known-good release, database state, and backup.
2. Revoke compromised credentials and freeze risky deployments.
3. Validate the latest encrypted backup through the isolated restore workflow.
4. Restore the database and exact immutable application release to the approved primary or replacement environment.
5. Validate tenant isolation, login, MFA/passkeys, tickets, assets/network devices, privacy requests, email, and health/SLO endpoints.
6. Communicate status and recovery expectations through the approved channel.
7. Reconcile transactions after the recovery point and document accepted data loss, if any.

## Provider failure

The vendor register contains an exit plan for each critical provider. Maintain current domain control, encrypted backup access independent of the primary runtime, deployment-repository access, credential inventories, and a tested replacement-hosting procedure.

## Exercises

Run the encrypted restore drill weekly. Conduct a full continuity exercise annually and after material architecture changes. Record actual recovery time, recovery point, missing dependencies, communications, and corrective-action owners.
