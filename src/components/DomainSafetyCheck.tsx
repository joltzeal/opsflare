'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export function DomainSafetyCheck() {
  const { domains, selectedAccount, googleApiKey, updateDomainSafety } = useStore();
  const [checking, setChecking] = useState(false);

  // 获取当前账户的域名
  const currentDomains = domains.filter((domain) => domain.accountEmail === selectedAccount);

  const checkAllDomains = async () => {
    if (!googleApiKey) {
      toast.error('请先在设置中配置 Google Safe Browsing API Key');
      return;
    }

    if (currentDomains.length === 0) {
      toast.error('当前账户没有域名');
      return;
    }

    setChecking(true);

    try {
      // 标记所有域名为检测中
      currentDomains.forEach((domain) => {
        updateDomainSafety(domain.id, 'checking');
      });

      // 构建批量检测请求
      const threatEntries: Array<{ url: string }> = [];
      currentDomains.forEach((domain) => {
        threatEntries.push({ url: `http://${domain.name}` });
        threatEntries.push({ url: `https://${domain.name}` });
      });

      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client: {
              clientId: 'opsflare',
              clientVersion: '1.0.0',
            },
            threatInfo: {
              threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries,
            },
          }),
        }
      );

      const data = await response.json() as {
        matches?: Array<{ threat: { url: string }; threatType: string }>;
      };

      // 创建域名到威胁的映射
      const domainThreats = new Map<string, string[]>();

      if (data.matches && data.matches.length > 0) {
        data.matches.forEach((match) => {
          const url = match.threat.url;
          const domainName = url.replace(/^https?:\/\//, '');

          if (!domainThreats.has(domainName)) {
            domainThreats.set(domainName, []);
          }
          domainThreats.get(domainName)!.push(match.threatType);
        });
      }

      // 更新所有域名的安全状态
      let safeCount = 0;
      let unsafeCount = 0;

      currentDomains.forEach((domain) => {
        const threats = domainThreats.get(domain.name);
        if (threats && threats.length > 0) {
          updateDomainSafety(domain.id, 'unsafe', threats);
          unsafeCount++;
        } else {
          updateDomainSafety(domain.id, 'safe');
          safeCount++;
        }
      });

      toast.success(`检测完成：${safeCount} 个安全，${unsafeCount} 个有风险`);
    } catch (error) {
      console.error('批量检测失败:', error);
      toast.error('批量检测失败，请检查 API Key 是否正确');

      // 检测失败时将所有域名标记为未知
      currentDomains.forEach((domain) => {
        updateDomainSafety(domain.id, 'unknown');
      });
    } finally {
      setChecking(false);
    }
  };

  const getSafetyStats = () => {
    const safe = currentDomains.filter((d) => d.safetyStatus === 'safe').length;
    const unsafe = currentDomains.filter((d) => d.safetyStatus === 'unsafe').length;
    const checking = currentDomains.filter((d) => d.safetyStatus === 'checking').length;
    const unknown = currentDomains.filter((d) => !d.safetyStatus || d.safetyStatus === 'unknown').length;

    return { safe, unsafe, checking, unknown };
  };

  const stats = getSafetyStats();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>批量域名安全检测</CardTitle>
        <CardDescription>批量检测所有域名的安全性</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">安全</span>
            </div>
            <p className="text-2xl font-bold">{stats.safe}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">有风险</span>
            </div>
            <p className="text-2xl font-bold">{stats.unsafe}</p>
          </div>
        </div>

        <Button
          onClick={checkAllDomains}
          disabled={checking || currentDomains.length === 0}
          className="w-full"
        >
          <Search className="h-4 w-4 mr-2" />
          {checking ? `检测中... (${stats.checking}/${currentDomains.length})` : `批量检测 ${currentDomains.length} 个域名`}
        </Button>

        {stats.unsafe > 0 && (
          <div className="border rounded-lg p-4 bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">检测到风险域名</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.unsafe} 个域名存在安全风险，请在域名列表中查看详情
                </p>
              </div>
            </div>
          </div>
        )}

        {stats.safe > 0 && stats.unsafe === 0 && stats.unknown === 0 && (
          <div className="border rounded-lg p-4 bg-green-500/10">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">所有域名安全</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  已检测 {stats.safe} 个域名，均未发现安全风险
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p className="font-medium mb-2">威胁类型说明:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>MALWARE: 恶意软件</li>
            <li>SOCIAL_ENGINEERING: 社会工程学攻击（钓鱼）</li>
            <li>UNWANTED_SOFTWARE: 不需要的软件</li>
            <li>POTENTIALLY_HARMFUL_APPLICATION: 潜在有害应用</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
