import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

// 获取密码配置
export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const password = env.NEXT_PUBLIC_ACCESS_PASSWORD as string | undefined;

    return NextResponse.json({
      requirePassword: !!password,
    });
  } catch (error) {
    console.error('获取环境变量失败:', error);
    return NextResponse.json({ requirePassword: false });
  }
}

// 验证密码
export async function POST(request: Request) {
  try {
    const { password: inputPassword } = await request.json();
    const { env } = await getCloudflareContext();
    const correctPassword = env.NEXT_PUBLIC_ACCESS_PASSWORD as string | undefined;

    // 如果未设置密码，直接返回成功
    if (!correctPassword) {
      return NextResponse.json({ success: true, noPassword: true });
    }

    // 验证密码
    if (inputPassword === correctPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
  } catch (error) {
    console.error('验证失败:', error);
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}
