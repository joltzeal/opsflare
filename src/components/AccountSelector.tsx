'use client';

import { useState } from 'react';
import { Plus, Download, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { CloudFlareAccount } from '@/types';
import { toast } from 'sonner';

export function AccountSelector() {
  const { accounts, selectedAccount, addAccount, removeAccount, selectAccount, importAccounts, exportAccounts } = useStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleAddAccount = () => {
    if (!email || !apiKey) return;

    const newAccount: CloudFlareAccount = {
      id: Date.now().toString(),
      email,
      apiKey,
    };
    addAccount(newAccount);
    setEmail('');
    setApiKey('');
    setShowAddDialog(false);
  };

  const handleExport = () => {
    const data = exportAccounts();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opsflare-accounts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          importAccounts(data);
          toast.success('账户导入成功');
        } catch {
          toast.error('导入失败，请检查文件格式');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={() => setShowAddDialog(true)} title="添加账户" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleImport} title="导入账户" className="h-8 w-8">
          <Upload className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleExport} title="导出账户" className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`flex justify-between items-center p-2 rounded cursor-pointer hover:bg-accent/50 ${
              selectedAccount === account.email ? 'bg-accent' : ''
            }`}
            onClick={() => selectAccount(account.email)}
          >
            <span className="text-xs truncate">{account.email}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                removeAccount(account.id);
              }}
              className="h-6 w-6"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">暂无账户</p>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 CloudFlare 账户</DialogTitle>
            <DialogDescription>请输入 CloudFlare 账户的 Email 和 API Key</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="您的 CloudFlare API Key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddAccount}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
