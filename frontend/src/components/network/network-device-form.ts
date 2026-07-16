import { z } from 'zod';

const isIpv4 = (value: string) => !value || value.split('.').length === 4 && value.split('.').every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);

export const networkDeviceSchema = z.object({
  name: z.string().trim().min(2, 'Equipment name must be at least 2 characters').max(191),
  equipmentType: z.string().trim().min(1, 'Equipment type is required'),
  manufacturer: z.string().trim().max(191),
  model: z.string().trim().max(191),
  serialNumber: z.string().trim().max(191),
  location: z.string().trim().max(191),
  ipAddress: z.string().trim().refine(isIpv4, 'Enter a valid IPv4 address'),
  macAddress: z.string().trim().refine((value) => !value || /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(value), 'Enter a valid MAC address'),
});
