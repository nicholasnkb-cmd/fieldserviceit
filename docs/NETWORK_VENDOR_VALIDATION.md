# Network Vendor Validation

This project includes a live validation harness for vendor controllers and SNMP-capable devices:

```powershell
cd backend
npm run validate:network-vendors -- .\vendor-validation.json
```

The validator is intentionally dry-run by default for risky actions. Set `dryRunActions` to `false` only in a lab or approved maintenance window.

## Example Config

```json
{
  "dryRunActions": true,
  "outputPath": "../docs/network-validation-report.json",
  "targets": [
    {
      "name": "Main Meraki Switch",
      "vendor": "meraki",
      "apiKey": "MERAKI_API_KEY",
      "serialNumber": "Q2XX-XXXX-XXXX",
      "snmp": { "host": "10.0.0.10", "community": "public" },
      "safeActions": ["sync", "bounce_poe"],
      "actionPort": "1"
    },
    {
      "name": "Core MikroTik",
      "vendor": "mikrotik",
      "baseUrl": "https://10.0.0.1",
      "username": "api-user",
      "password": "password",
      "snmp": { "host": "10.0.0.1", "community": "public" }
    },
    {
      "name": "Edge FortiGate",
      "vendor": "fortinet",
      "baseUrl": "https://10.0.0.254",
      "apiKey": "FORTIGATE_TOKEN"
    },
    {
      "name": "UniFi Controller",
      "vendor": "unifi",
      "baseUrl": "https://unifi.example.com",
      "apiKey": "UNIFI_TOKEN",
      "siteId": "default"
    }
  ]
}
```

## What It Validates

- Exact API response key shapes for each configured vendor target.
- Normalized interface and firmware output used by the FieldserviceIT network console.
- Standard SNMP system OIDs: `sysDescr` and `sysUpTime`.
- Vendor/feature SNMP OID coverage samples for PoE, LLDP/CDP-like neighbor data, and temperature sensors.
- Action safety status. Risky actions remain dry-run unless explicitly enabled.

## Official Endpoint References

- Cisco Meraki switch port status: `GET /devices/{serial}/switch/ports/statuses`.
- MikroTik RouterOS REST API uses `/rest/...` resources over HTTP/HTTPS.
- UniFi exposes Site Manager APIs and local Network API documentation per controller version.
- FortiGate exposes REST monitor endpoints under `/api/v2/monitor/...`.

## Validation Boundary

The repository can provide the harness and mappings, but final confirmation requires real reachable controllers/devices and approved credentials. Save the generated report with the deployment handoff when hardware validation is complete.
