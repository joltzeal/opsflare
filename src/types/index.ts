export interface CloudFlareAccount {
  id: string;
  email: string;
  apiKey: string;
}

export interface Domain {
  id: string;
  name: string;
  status: string;
  nameServers: string[];
  accountEmail: string;
  safetyStatus?: 'safe' | 'unsafe' | 'checking' | 'unknown';
  threats?: string[];
}

export interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
}

export type SSLMode = 'off' | 'flexible' | 'full' | 'strict';

export interface ZoneSettings {
  ssl: SSLMode;
}
