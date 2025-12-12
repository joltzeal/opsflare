'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';

interface AuthCheckResponse {
  requirePassword: boolean;
}

interface AuthVerifyResponse {
  success: boolean;
  noPassword?: boolean;
  error?: string;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuthenticated } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requirePassword, setRequirePassword] = useState(true);

  // 检查是否需要密码保护
  useEffect(() => {
    const checkPasswordRequired = async () => {
      try {
        const response = await fetch('/api/auth');
        const data = (await response.json()) as AuthCheckResponse;
        setRequirePassword(data.requirePassword);

        // 如果不需要密码保护，直接认证通过
        if (!data.requirePassword) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error('检查密码设置失败:', error);
        // 出错时默认需要密码保护
        setRequirePassword(true);
      } finally {
        setLoading(false);
      }
    };

    checkPasswordRequired();
  }, [setAuthenticated]);

  useEffect(() => {
    if (!loading && requirePassword) {
      setIsOpen(!isAuthenticated);
    }
  }, [isAuthenticated, loading, requirePassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json()) as AuthVerifyResponse;

      if (data.success) {
        setAuthenticated(true);
        setIsOpen(false);
        setPassword('');
      } else {
        setError(data.error || '密码错误，请重试');
        setPassword('');
      }
    } catch (error) {
      console.error('验证失败:', error);
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载中显示加载状态
  if (loading && requirePassword && !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 已认证或不需要密码保护，显示内容
  if (isAuthenticated || !requirePassword) {
    return <>{children}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>访问验证</DialogTitle>
          <DialogDescription>请输入访问密码以继续使用 OpsFlare</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoFocus
              disabled={loading}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '验证中...' : '登录'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
