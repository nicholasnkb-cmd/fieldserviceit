# Compliance Control Register

The authoritative machine-validated register is `compliance/control-register.json`. It uses a NIST CSF 2.0 organizational profile and records a control owner, review frequency, operating status, and repository evidence for every control.

`operating` means the repository contains an implemented control and evidence source. It does not mean an auditor has tested operating effectiveness. `needs-evidence` means policy or technical support exists but human, contractual, or third-party evidence must still be attached.

## Operating cadence

- Monthly: privacy-request aging, privileged activity, security alerts, vulnerability findings, failed jobs, and SLO results.
- Quarterly: access review, vendor register, risk register, incident exercise, legal obligation review, and exception review.
- Annually: security/privacy training, continuity exercise, accessibility manual review, policy approval, penetration test, and provider contract/security review.
- Per release: staged migration evidence, build/test results, approval, deployed SHA, smoke tests, and rollback target.

Store external evidence—contracts, training certificates, penetration-test reports, insurer notices, legal advice, and personnel records—in an access-controlled evidence repository. Reference it by stable identifier; do not commit confidential evidence to source control.
