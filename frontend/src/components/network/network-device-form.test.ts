import { networkDeviceSchema } from './network-device-form';

const validDevice = {
  name: 'Core firewall',
  equipmentType: 'Firewall',
  manufacturer: 'Fortinet',
  model: '60F',
  serialNumber: '',
  location: 'Main office',
  ipAddress: '192.168.10.1',
  macAddress: 'aa:bb:cc:dd:ee:ff',
};

describe('networkDeviceSchema', () => {
  it('accepts and trims valid equipment input', () => {
    const result = networkDeviceSchema.parse({ ...validDevice, name: '  Core firewall  ' });
    expect(result.name).toBe('Core firewall');
  });

  it('rejects out-of-range IPv4 octets and malformed MAC addresses', () => {
    const result = networkDeviceSchema.safeParse({ ...validDevice, ipAddress: '999.1.1.1', macAddress: 'not-a-mac' });
    expect(result.success).toBe(false);
  });
});
