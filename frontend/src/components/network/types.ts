export interface NetworkDevice {
  id: string;
  name: string;
  deviceCategory?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  ipAddress?: string;
  macAddress?: string;
  status: string;
  notes?: string;
  lastCheckInAt?: string;
  complianceStatus?: string;
  purchaseDate?: string;
  warrantyExpiresAt?: string;
  createdAt: string;
  deletedAt?: string;
}
