'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { AccountSelector } from '@/components/AccountSelector';
import { DomainList } from '@/components/DomainList';
import { DomainDetails } from '@/components/DomainDetails';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export default function Home() {
	const { googleApiKey, setGoogleApiKey } = useStore();
	const [showSettings, setShowSettings] = useState(false);
	const [apiKeyInput, setApiKeyInput] = useState(googleApiKey);

	const handleSaveSettings = () => {
		setGoogleApiKey(apiKeyInput);
		setShowSettings(false);
		toast.success('设置已保存');
	};

	return (
		<AuthGuard>
			<div className="h-screen flex flex-col">
				{/* 全局页头 */}
				<div className="p-4 flex justify-between items-center border-b bg-background">
					<div>
						<h1 className="text-xl font-bold">OpsFlare</h1>
						<p className="text-xs text-muted-foreground">CloudFlare 管理工具 @ Power by <a href='https://t.me/amenotg' >Ameno</a></p>
					</div>
					<div className="flex gap-2">
						<ThemeToggle />
						<Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
							<Settings className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* 内容区 */}
				<div className="flex-1 flex overflow-hidden">
					{/* 左侧边栏 - 两列布局 */}
					<div className="w-[600px] flex gap-4 p-4">
						{/* 账户列表列 */}
						<Card className="w-1/2 flex flex-col">
							<div className="p-4 border-b">
								<h2 className="text-sm font-semibold">账户列表</h2>
							</div>
							<ScrollArea className="flex-1 p-4">
								<AccountSelector />
							</ScrollArea>
						</Card>

						{/* 域名列表列 */}
						<Card className="w-1/2 flex flex-col">
							<div className="p-4 border-b">
								<h2 className="text-sm font-semibold">域名列表</h2>
							</div>
							<ScrollArea className="flex-1 p-4">
								<DomainList />
							</ScrollArea>
						</Card>
					</div>

					{/* 右侧内容区 */}
					<div className="flex-1 overflow-hidden border-l">
						<ScrollArea className="h-full">
							<div className="p-6">
								<DomainDetails />
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>

			{/* 设置对话框 */}
			<Dialog open={showSettings} onOpenChange={setShowSettings}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>设置</DialogTitle>
						<DialogDescription>配置 Google Safe Browsing API Key</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="googleApiKey">Google Safe Browsing API Key</Label>
							<Input
								id="googleApiKey"
								type="password"
								value={apiKeyInput}
								onChange={(e) => setApiKeyInput(e.target.value)}
								placeholder="输入 API Key"
							/>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setShowSettings(false)}>
							取消
						</Button>
						<Button onClick={handleSaveSettings}>保存</Button>
					</div>
				</DialogContent>
			</Dialog>
		</AuthGuard>
	);
}
