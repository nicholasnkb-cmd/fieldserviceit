import { networkDevicesToCsv, parseNetworkCsv } from './network-csv';

describe('network CSV helpers', () => {
  it('parses aliases, quoted commas, and warranty dates', () => {
    const result = parseNetworkCsv('hostname,vendor,ip,warranty expiry,notes\r\n"Core, Switch",Cisco,10.0.0.2,2028-01-15,"Main, rack"');
    expect(result.errors).toEqual([]);
    expect(result.devices).toEqual([{
      name: 'Core, Switch',
      manufacturer: 'Cisco',
      ipAddress: '10.0.0.2',
      warrantyExpiresAt: '2028-01-15',
      notes: 'Main, rack',
    }]);
  });

  it('reports missing names and invalid dates', () => {
    const result = parseNetworkCsv('name,purchaseDate\n,not-a-date\nRouter,not-a-date');
    expect(result.devices).toHaveLength(1);
    expect(result.errors).toContain('Row 2: name is required.');
    expect(result.errors).toContain('Row 3: purchaseDate must be a valid date.');
  });

  it('escapes exported values', () => {
    const csv = networkDevicesToCsv([{ id: '1', name: 'Core, Switch', status: 'active', createdAt: '2026-01-01', notes: 'Line "A"' }]);
    expect(csv).toContain('"Core, Switch"');
    expect(csv).toContain('"Line ""A"""');
  });
});
