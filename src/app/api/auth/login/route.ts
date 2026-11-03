import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, fetchFromBackend } from '@/lib/api-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const result = await fetchFromBackend('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!result.ok) {
      const errorMsg =
        typeof result.data === 'object' && result.data !== null && 'message' in result.data
          ? Array.isArray((result.data as { message: unknown }).message)
            ? (result.data as { message: string[] }).message.join(', ')
            : String((result.data as { message: unknown }).message)
          : 'Invalid admin credentials.';

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          details: result.data,
          coldStart: result.coldStart,
          durationMs: result.durationMs,
        },
        { status: result.status },
      );
    }

    const accessToken =
      typeof result.data === 'object' && result.data !== null && 'accessToken' in result.data
        ? (result.data as { accessToken: string }).accessToken
        : typeof result.data === 'object' && result.data !== null && 'access_token' in result.data
        ? (result.data as { access_token: string }).access_token
        : null;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'No access token received from authentication backend.' },
        { status: 500 },
      );
    }

    // Decode JWT payload to verify Admin role
    let userPayload: { email?: string; id?: number; role?: string } = {};
    try {
      const parts = accessToken.split('.');
      if (parts.length >= 2) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
        userPayload = JSON.parse(payloadStr);
      }
    } catch {
      // payload decoding fallback
    }

    const role = userPayload.role || '';
    const isAdmin =
      role.toUpperCase().includes('ADMIN') ||
      role.toUpperCase() === 'SUPER_ADMIN' ||
      role.toUpperCase() === 'ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: `Access Denied: Current role is "${role}". Only ADMIN or SUPER_ADMIN users can access the Admin Dashboard.`,
        },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({
      success: true,
      message: 'Admin authenticated successfully',
      user: userPayload,
      coldStart: result.coldStart,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
