import { DNSRecord, Domain, SSLMode } from '@/types';

interface CloudFlareAPIOptions {
  email: string;
  apiKey: string;
}

interface CloudFlareAPIResponse<T = unknown> {
  success: boolean;
  errors?: Array<{ message: string }>;
  result: T;
}

class CloudFlareService {
  private email: string;
  private apiKey: string;

  constructor(options: CloudFlareAPIOptions) {
    this.email = options.email;
    this.apiKey = options.apiKey;
  }

  private getHeaders() {
    return {
      'x-cf-email': this.email,
      'x-cf-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getZones(): Promise<Domain[]> {
    try {
      const response = await fetch('/api/cloudflare/zones', {
        headers: this.getHeaders(),
      });

      type ZoneData = { id: string; name: string; status: string; name_servers?: string[] };
      const data = await response.json() as CloudFlareAPIResponse<ZoneData[]>;

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || '获取域名列表失败');
      }

      return data.result.map((zone) => ({
        id: zone.id,
        name: zone.name,
        status: zone.status,
        nameServers: zone.name_servers || [],
        accountEmail: this.email,
      }));
    } catch (error) {
      console.error('获取域名列表失败:', error);
      throw error;
    }
  }

  async addZone(domainName: string): Promise<Domain> {
    try {
      const response = await fetch('/api/cloudflare/zones', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: domainName,
          jump_start: true,
        }),
      });

      type ZoneData = { id: string; name: string; status: string; name_servers?: string[] };
      const data = await response.json() as CloudFlareAPIResponse<ZoneData>;

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || '添加域名失败');
      }

      const zone = data.result;
      return {
        id: zone.id,
        name: zone.name,
        status: zone.status,
        nameServers: zone.name_servers || [],
        accountEmail: this.email,
      };
    } catch (error) {
      console.error('添加域名失败:', error);
      throw error;
    }
  }

  async getDNSRecords(zoneId: string): Promise<DNSRecord[]> {
    try {
      const response = await fetch(
        `/api/cloudflare/zones/${zoneId}/dns`,
        {
          headers: this.getHeaders(),
        }
      );

      type RecordData = { id: string; type: string; name: string; content: string; ttl: number; proxied: boolean };
      const data = await response.json() as CloudFlareAPIResponse<RecordData[]>;

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || '获取DNS记录失败');
      }

      return data.result.map((record) => ({
        id: record.id,
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl,
        proxied: record.proxied,
      }));
    } catch (error) {
      console.error('获取DNS记录失败:', error);
      throw error;
    }
  }

  async addDNSRecord(
    zoneId: string,
    name: string,
    content: string
  ): Promise<DNSRecord> {
    try {
      const response = await fetch(
        `/api/cloudflare/zones/${zoneId}/dns`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            type: 'A',
            name: name,
            content: content,
            ttl: 1,
            proxied: false,
          }),
        }
      );

      type RecordData = { id: string; type: string; name: string; content: string; ttl: number; proxied: boolean };
      const data = await response.json() as CloudFlareAPIResponse<RecordData>;

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || '添加DNS记录失败');
      }

      const record = data.result;
      return {
        id: record.id,
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl,
        proxied: record.proxied,
      };
    } catch (error) {
      console.error('添加DNS记录失败:', error);
      throw error;
    }
  }

  async updateDNSRecord(
    zoneId: string,
    recordId: string,
    name: string,
    content: string
  ): Promise<DNSRecord> {
    try {
      const response = await fetch(
        `/api/cloudflare/zones/${zoneId}/dns`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({
            recordId,
            type: 'A',
            name: name,
            content: content,
            ttl: 1,
            proxied: false,
          }),
        }
      );

      type RecordData = { id: string; type: string; name: string; content: string; ttl: number; proxied: boolean };
      const data = await response.json() as CloudFlareAPIResponse<RecordData>;

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || '更新DNS记录失败');
      }

      const record = data.result;
      return {
        id: record.id,
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl,
        proxied: record.proxied,
      };
    } catch (error) {
      console.error('更新DNS记录失败:', error);
      throw error;
    }
  }

  async getSSLSetting(zoneId: string): Promise<SSLMode> {
    try {
      const response = await fetch(
        `/api/cloudflare/zones/${zoneId}/ssl`,
        {
          headers: this.getHeaders(),
        }
      );

      type SSLData = { value: SSLMode };
      const data = await response.json() as CloudFlareAPIResponse<SSLData>;

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || '获取SSL设置失败');
      }

      return data.result.value;
    } catch (error) {
      console.error('获取SSL设置失败:', error);
      throw error;
    }
  }

  async updateSSLSetting(zoneId: string, mode: SSLMode): Promise<void> {
    try {
      const response = await fetch(
        `/api/cloudflare/zones/${zoneId}/ssl`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({
            value: mode,
          }),
        }
      );

      const data = await response.json() as CloudFlareAPIResponse<unknown>;

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || '更新SSL设置失败');
      }
    } catch (error) {
      console.error('更新SSL设置失败:', error);
      throw error;
    }
  }
}

export default CloudFlareService;
