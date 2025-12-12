import { NextRequest, NextResponse } from 'next/server';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  try {
    const email = request.headers.get('x-cf-email');
    const apiKey = request.headers.get('x-cf-key');
    const { zoneId } = await params;

    if (!email || !apiKey) {
      return NextResponse.json(
        { error: '缺少认证信息' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/zones/${zoneId}/dns_records?type=A`,
      {
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取DNS记录失败:', error);
    return NextResponse.json(
      { error: '获取DNS记录失败' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  try {
    const email = request.headers.get('x-cf-email');
    const apiKey = request.headers.get('x-cf-key');
    const { zoneId } = await params;
    const body = await request.json();

    if (!email || !apiKey) {
      return NextResponse.json(
        { error: '缺少认证信息' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('添加DNS记录失败:', error);
    return NextResponse.json(
      { error: '添加DNS记录失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  try {
    const email = request.headers.get('x-cf-email');
    const apiKey = request.headers.get('x-cf-key');
    const { zoneId } = await params;
    const body = await request.json() as { recordId: string; [key: string]: unknown };
    const { recordId, ...recordData } = body;

    if (!email || !apiKey) {
      return NextResponse.json(
        { error: '缺少认证信息' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: 'PUT',
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('更新DNS记录失败:', error);
    return NextResponse.json(
      { error: '更新DNS记录失败' },
      { status: 500 }
    );
  }
}
