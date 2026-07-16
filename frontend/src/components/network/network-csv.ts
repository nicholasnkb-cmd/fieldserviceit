import type { NetworkDevice } from './types';

export const networkCsvColumns = [
  'name',
  'manufacturer',
  'model',
  'serialNumber',
  'location',
  'ipAddress',
  'macAddress',
  'purchaseDate',
  'warrantyExpiresAt',
  'notes',
] as const;

type NetworkCsvColumn = typeof networkCsvColumns[number];

const headerAliases: Record<string, NetworkCsvColumn> = {
  name: 'name',
  device: 'name',
  hostname: 'name',
  manufacturer: 'manufacturer',
  vendor: 'manufacturer',
  model: 'model',
  serial: 'serialNumber',
  serialnumber: 'serialNumber',
  location: 'location',
  site: 'location',
  ip: 'ipAddress',
  ipaddress: 'ipAddress',
  mac: 'macAddress',
  macaddress: 'macAddress',
  purchasedate: 'purchaseDate',
  purchase: 'purchaseDate',
  warrantyexpiresat: 'warrantyExpiresAt',
  warrantyexpiration: 'warrantyExpiresAt',
  warrantyexpiry: 'warrantyExpiresAt',
  notes: 'notes',
};

function parseRows(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"') {
      if (quoted && value[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && value[index + 1] === '\n') index += 1;
      row.push(field.trim());
      field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizedHeader(value: string) {
  return value.replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseNetworkCsv(value: string) {
  const rows = parseRows(value);
  if (rows.length < 2) return { devices: [] as Record<string, string>[], errors: ['The CSV must include a header and at least one device row.'] };
  const headers = rows[0].map((header) => headerAliases[normalizedHeader(header)]);
  if (!headers.includes('name')) return { devices: [] as Record<string, string>[], errors: ['The CSV needs a name, device, or hostname column.'] };
  const errors: string[] = [];
  const devices = rows.slice(1).map((row, rowIndex) => {
    const device: Record<string, string> = {};
    headers.forEach((header, columnIndex) => {
      if (header && row[columnIndex]) device[header] = row[columnIndex];
    });
    if (!device.name) errors.push(`Row ${rowIndex + 2}: name is required.`);
    for (const field of ['purchaseDate', 'warrantyExpiresAt']) {
      if (device[field] && Number.isNaN(Date.parse(device[field]))) errors.push(`Row ${rowIndex + 2}: ${field} must be a valid date.`);
    }
    return device;
  }).filter((device) => Boolean(device.name));
  return { devices, errors };
}

function csvValue(value: unknown) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function networkDevicesToCsv(devices: NetworkDevice[]) {
  const rows = [networkCsvColumns.join(',')];
  for (const device of devices) {
    rows.push(networkCsvColumns.map((column) => csvValue(device[column])).join(','));
  }
  return `${rows.join('\r\n')}\r\n`;
}

export function networkCsvTemplate() {
  return `${networkCsvColumns.join(',')}\r\nCore Switch,Cisco,C9300,SN-100,Main office,192.168.1.2,00:11:22:33:44:55,2026-01-15,2029-01-15,Primary distribution switch\r\n`;
}
