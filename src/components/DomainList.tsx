'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Shield, ShieldAlert, ShieldCheck, Loader2, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStore } from '@/store/useStore';
import CloudFlareService from '@/lib/cloudflare';
import { toast } from 'sonner';

// 域名状态映射
const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: '启用', variant: 'default' },
  pending: { label: '待激活', variant: 'secondary' },
  initializing: { label: '初始化中', variant: 'secondary' },
  moved: { label: '已移动', variant: 'destructive' },
  deleted: { label: '已删除', variant: 'destructive' },
  deactivated: { label: '已停用', variant: 'outline' },
};

export function DomainList() {
  const {
    accounts,
    selectedAccount,
    domains,
    selectedDomain,
    selectedDomains,
    setDomains,
    selectDomain,
    toggleDomainSelection,
    selectAllDomains,
    clearDomainSelection
  } = useStore();
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [domainInput, setDomainInput] = useState('');

  const currentAccount = accounts.find((acc) => acc.email === selectedAccount);

  useEffect(() => {
    if (currentAccount) {
      loadDomains();
    } else {
      setDomains([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount?.email]);

  const loadDomains = async () => {
    if (!currentAccount) return;

    setLoading(true);
    try {
      const service = new CloudFlareService({
        email: currentAccount.email,
        apiKey: currentAccount.apiKey,
      });
      const zones = await service.getZones();
      setDomains(zones);
    } catch (error) {
      console.error('加载域名失败:', error);
      toast.error('加载域名失败，请检查账户凭证');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomains = async () => {
    if (!currentAccount || !domainInput.trim()) return;

    const domainNames = domainInput
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const service = new CloudFlareService({
        email: currentAccount.email,
        apiKey: currentAccount.apiKey,
      });

      for (const domainName of domainNames) {
        try {
          await service.addZone(domainName);
        } catch (error) {
          console.error(`添加域名 ${domainName} 失败:`, error);
        }
      }

      await loadDomains();
      setDomainInput('');
      setShowAddDialog(false);
      toast.success('域名添加成功');
    } catch (error) {
      console.error('批量添加域名失败:', error);
      toast.error('批量添加域名失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDomainClick = (domainId: string, isCheckboxClick: boolean) => {
    if (isCheckboxClick) {
      toggleDomainSelection(domainId);
    } else {
      // 如果当前是多选模式，点击域名项也切换选择
      if (selectedDomains.length > 0) {
        toggleDomainSelection(domainId);
      } else {
        selectDomain(domainId);
      }
    }
  };

  if (!currentAccount) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground text-center py-4">请先选择账户</p>
      </div>
    );
  }

  const filteredDomains = domains.filter((domain) => domain.accountEmail === selectedAccount);

  // 全选/取消全选逻辑
  const allSelected = filteredDomains.length > 0 && selectedDomains.length === filteredDomains.length;
  const someSelected = selectedDomains.length > 0 && selectedDomains.length < filteredDomains.length;

  const handleSelectAll = () => {
    if (allSelected) {
      clearDomainSelection();
    } else {
      selectAllDomains(filteredDomains.map(d => d.id));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Checkbox
              checked={allSelected || someSelected}
              onCheckedChange={handleSelectAll}
              title={allSelected ? "取消全选" : "全选"}
            />
            {someSelected && (
              <Minus className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground pointer-events-none" />
            )}
          </div>
          {selectedDomains.length > 0 && (
            <span className="text-xs text-muted-foreground">
              已选 {selectedDomains.length} 项
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={loadDomains} disabled={loading} title="刷新" className="h-8 w-8">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setShowAddDialog(true)} title="批量添加" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <TooltipProvider>
          {filteredDomains.map((domain) => {
            const isSelected = selectedDomain === domain.id;
            const isMultiSelected = selectedDomains.includes(domain.id);
            const statusInfo = statusMap[domain.status] || { label: domain.status, variant: 'outline' as const };

            // 渲染安全状态图标
            const renderSafetyIcon = () => {
              if (!domain.safetyStatus || domain.safetyStatus === 'unknown') {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Shield className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>未检测</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              if (domain.safetyStatus === 'checking') {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>检测中...</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              if (domain.safetyStatus === 'safe') {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ShieldCheck className="h-3 w-3 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>安全</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              if (domain.safetyStatus === 'unsafe') {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ShieldAlert className="h-3 w-3 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-semibold">检测到威胁:</p>
                        <ul className="list-disc list-inside text-xs mt-1">
                          {domain.threats?.map((threat, idx) => (
                            <li key={idx}>{threat}</li>
                          ))}
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }
            };

            return (
              <div
                key={domain.id}
                className={`p-2 rounded cursor-pointer hover:bg-accent/50 flex items-start gap-2 ${
                  isSelected || isMultiSelected ? 'bg-accent' : ''
                }`}
                onClick={() => handleDomainClick(domain.id, false)}
              >
                <Checkbox
                  checked={isMultiSelected}
                  onCheckedChange={() => handleDomainClick(domain.id, true)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{domain.name}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant={statusInfo.variant} className="text-[10px] h-4 px-1.5">
                      {statusInfo.label}
                    </Badge>
                    {renderSafetyIcon()}
                  </div>
                </div>
              </div>
            );
          })}
        </TooltipProvider>
        {filteredDomains.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {loading ? '加载中...' : '暂无域名'}
          </p>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量添加域名</DialogTitle>
            <DialogDescription>每行输入一个域名</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domains">域名列表</Label>
              <Textarea
                id="domains"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="example1.com&#10;example2.com&#10;example3.com"
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddDomains} disabled={loading}>
              {loading ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
