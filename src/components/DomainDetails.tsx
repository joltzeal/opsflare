'use client';

import { useState, useEffect } from 'react';
import { Copy, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/store/useStore';
import CloudFlareService from '@/lib/cloudflare';
import { DNSRecord, SSLMode } from '@/types';
import { DomainSafetyCheck } from './DomainSafetyCheck';
import { toast } from 'sonner';

export function DomainDetails() {
  const { accounts, selectedAccount, domains, selectedDomain, selectedDomains, clearDomainSelection } = useStore();
  const [sslMode, setSslMode] = useState<SSLMode>('off');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DNSRecord | null>(null);
  const [recordName, setRecordName] = useState('');
  const [recordContent, setRecordContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearAllRecords, setClearAllRecords] = useState(false);

  // 批量添加解析的状态
  const [batchRecordName, setBatchRecordName] = useState('');
  const [batchRecordContent, setBatchRecordContent] = useState('');
  const [batchClearAllRecords, setBatchClearAllRecords] = useState(false);

  const currentAccount = accounts.find((acc) => acc.email === selectedAccount);
  const currentDomain = domains.find((domain) => domain.id === selectedDomain);

  // 获取多选的域名列表
  const selectedDomainsData = domains.filter((domain) => selectedDomains.includes(domain.id));

  useEffect(() => {
    if (currentAccount && currentDomain) {
      loadDomainDetails();
      // 切换域名时重置表单
      setRecordName('');
      setRecordContent('');
      setSelectedRecord(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDomain?.id]);

  const loadDomainDetails = async () => {
    if (!currentAccount || !currentDomain) return;

    setLoading(true);
    try {
      const service = new CloudFlareService({
        email: currentAccount.email,
        apiKey: currentAccount.apiKey,
      });

      const [ssl, records] = await Promise.all([
        service.getSSLSetting(currentDomain.id),
        service.getDNSRecords(currentDomain.id),
      ]);

      setSslMode(ssl);
      setDnsRecords(records);
    } catch (error) {
      console.error('加载域名详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNameServer = (ns: string) => {
    navigator.clipboard.writeText(ns);
    toast.success('已复制到剪贴板');
  };

  const handleCopyAllNameServers = () => {
    if (!currentDomain) return;
    const allNs = currentDomain.nameServers.join('\n');
    navigator.clipboard.writeText(allNs);
    toast.success('已复制所有名称服务器到剪贴板');
  };

  const handleSaveSSL = async () => {
    if (!currentAccount || !currentDomain) return;

    setLoading(true);
    try {
      const service = new CloudFlareService({
        email: currentAccount.email,
        apiKey: currentAccount.apiKey,
      });
      await service.updateSSLSetting(currentDomain.id, sslMode);
      toast.success('SSL 设置已更新');
    } catch (error) {
      console.error('更新SSL设置失败:', error);
      toast.error('更新SSL设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDNSRecord = async () => {
    if (!currentAccount || !currentDomain || !recordName || !recordContent) return;

    setLoading(true);
    try {
      const service = new CloudFlareService({
        email: currentAccount.email,
        apiKey: currentAccount.apiKey,
      });

      // 如果勾选了清空所有记录，先删除所有记录
      if (clearAllRecords && !selectedRecord) {
        const deletedCount = await service.deleteAllDNSRecords(currentDomain.id);
        toast.success(`已清空 ${deletedCount} 条 DNS 记录`);
      }

      if (selectedRecord) {
        await service.updateDNSRecord(
          currentDomain.id,
          selectedRecord.id,
          recordName,
          recordContent
        );
        toast.success('DNS 记录已更新');
      } else {
        await service.addDNSRecord(currentDomain.id, recordName, recordContent);
        toast.success('DNS 记录已添加');
      }

      await loadDomainDetails();
      setRecordName('');
      setRecordContent('');
      setSelectedRecord(null);
      setClearAllRecords(false);
    } catch (error) {
      console.error('保存DNS记录失败:', error);
      toast.error('保存DNS记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecord = (record: DNSRecord) => {
    setSelectedRecord(record);
    setRecordName(record.name);
    setRecordContent(record.content);
  };

  const handleBatchAddDNS = async () => {
    if (!currentAccount || !batchRecordName || !batchRecordContent || selectedDomains.length === 0) {
      toast.error('请填写完整信息');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    let clearedCount = 0;

    try {
      const service = new CloudFlareService({
        email: currentAccount.email,
        apiKey: currentAccount.apiKey,
      });

      for (const domainId of selectedDomains) {
        try {
          // 如果勾选了清空所有记录，先删除
          if (batchClearAllRecords) {
            const deleted = await service.deleteAllDNSRecords(domainId);
            clearedCount += deleted;
          }

          await service.addDNSRecord(domainId, batchRecordName, batchRecordContent);
          successCount++;
        } catch (error) {
          console.error(`为域名 ${domainId} 添加 DNS 记录失败:`, error);
          failCount++;
        }
      }

      const message = batchClearAllRecords
        ? `已清空 ${clearedCount} 条记录，成功为 ${successCount} 个域名添加了 DNS 记录${failCount > 0 ? `，${failCount} 个失败` : ''}`
        : `成功为 ${successCount} 个域名添加了 DNS 记录${failCount > 0 ? `，${failCount} 个失败` : ''}`;

      toast.success(message);

      setBatchRecordName('');
      setBatchRecordContent('');
      setBatchClearAllRecords(false);
      clearDomainSelection();
    } catch (error) {
      console.error('批量添加 DNS 记录失败:', error);
      toast.error('批量添加 DNS 记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 多选模式下显示批量添加界面
  if (selectedDomains.length > 0) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h1 className="text-xl font-bold">批量操作</h1>
          <p className="text-sm text-muted-foreground mt-2">已选中 {selectedDomains.length} 个域名</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>选中的域名</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {selectedDomainsData.map((domain) => (
                <div key={domain.id} className="text-sm p-2 bg-muted rounded">
                  {domain.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>批量添加 DNS 解析</CardTitle>
            <CardDescription>为选中的所有域名添加相同的 A 记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchRecordName">记录名称</Label>
              <Input
                id="batchRecordName"
                value={batchRecordName}
                onChange={(e) => setBatchRecordName(e.target.value)}
                placeholder="www 或 @"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchRecordContent">记录值 (IP 地址)</Label>
              <Input
                id="batchRecordContent"
                value={batchRecordContent}
                onChange={(e) => setBatchRecordContent(e.target.value)}
                placeholder="8.8.8.8"
              />
            </div>

            <div className="flex items-center space-x-2 py-2 px-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Checkbox
                id="batchClearAllRecords"
                checked={batchClearAllRecords}
                onCheckedChange={(checked) => setBatchClearAllRecords(checked as boolean)}
              />
              <label
                htmlFor="batchClearAllRecords"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                添加前清空所有域名的现有 DNS 记录
              </label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleBatchAddDNS} disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? '添加中...' : `为 ${selectedDomains.length} 个域名添加记录`}
              </Button>
              <Button variant="outline" onClick={clearDomainSelection}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentDomain) {
    return (
      <div className="h-full">
        <DomainSafetyCheck />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-xl font-bold">{currentDomain.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">名称服务器</CardTitle>
          <CardDescription className="text-xs">将域名的名称服务器修改为以下地址</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center flex-wrap">
            {currentDomain.nameServers.map((ns, index) => (
              <>
                <Input key={`input-${index}`} value={ns} readOnly className="flex-1 min-w-[200px] text-sm" />
                <Button key={`btn-${index}`} variant="outline" size="sm" onClick={() => handleCopyNameServer(ns)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </>
            ))}
            {currentDomain.nameServers.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleCopyAllNameServers}>
                复制所有名称服务器
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SSL/TLS 加密模式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={sslMode} onValueChange={(value) => setSslMode(value as SSLMode)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">关闭</SelectItem>
                <SelectItem value="flexible">灵活</SelectItem>
                <SelectItem value="full">完全</SelectItem>
                <SelectItem value="strict">完全（严格）</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSaveSSL} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DNS 记录 (A 记录)</CardTitle>
          <CardDescription className="text-xs">
            点击记录进行编辑，或填写下方表单添加新记录
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {dnsRecords.map((record) => (
              <div
                key={record.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-accent ${
                  selectedRecord?.id === record.id ? 'bg-accent' : ''
                }`}
                onClick={() => handleSelectRecord(record)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{record.name}</span>
                  <span className="text-muted-foreground">{record.content}</span>
                </div>
              </div>
            ))}
            {dnsRecords.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无 A 记录</p>
            )}
          </div>

          {selectedRecord && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm mb-0">
                  正在编辑: {selectedRecord.name} → {selectedRecord.content}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRecord(null);
                    setRecordName('');
                    setRecordContent('');
                  }}
                  className="h-6 text-xs"
                >
                  取消编辑
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="recordName">记录名称</Label>
            <Input
              id="recordName"
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
              placeholder="www 或 @"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recordContent">记录值 (IP 地址)</Label>
            <Input
              id="recordContent"
              value={recordContent}
              onChange={(e) => setRecordContent(e.target.value)}
              placeholder="8.8.8.8"
            />
          </div>

          {!selectedRecord && (
            <div className="flex items-center space-x-2 py-2 px-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Checkbox
                id="clearAllRecords"
                checked={clearAllRecords}
                onCheckedChange={(checked) => setClearAllRecords(checked as boolean)}
              />
              <label
                htmlFor="clearAllRecords"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                添加前清空当前域名的所有 DNS 记录
              </label>
            </div>
          )}

          <Button onClick={handleSaveDNSRecord} disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {selectedRecord ? '更新记录' : '添加记录'}
          </Button>
        </CardContent>
      </Card>

      
    </div>
  );
}
