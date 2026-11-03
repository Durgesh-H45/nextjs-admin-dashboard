import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, fetchFromBackend } from '@/lib/api-client';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin login required' },
        { status: 401 },
      );
    }

    const result = await fetchFromBackend('/admin/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!result.ok) {
      const errorMsg =
        typeof result.data === 'object' && result.data !== null && 'message' in result.data
          ? Array.isArray((result.data as { message: unknown }).message)
            ? (result.data as { message: string[] }).message.join(', ')
            : String((result.data as { message: unknown }).message)
          : 'Failed to retrieve users list';

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

    return NextResponse.json({
      success: true,
      users: result.data,
      coldStart: result.coldStart,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin login required' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { email, password, firstName, lastName, role, blocked } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      email,
      password,
    };

    if (firstName && typeof firstName === 'string' && firstName.trim()) {
      payload.firstName = firstName.trim();
    }
    if (lastName && typeof lastName === 'string' && lastName.trim()) {
      payload.lastName = lastName.trim();
    }
    if (role && typeof role === 'string' && role.trim()) {
      payload.role = role.trim();
    }
    if (typeof blocked === 'boolean') {
      payload.blocked = blocked;
    }

    const result = await fetchFromBackend('/admin/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      const errorMsg =
        typeof result.data === 'object' && result.data !== null && 'message' in result.data
          ? Array.isArray((result.data as { message: unknown }).message)
            ? (result.data as { message: string[] }).message.join(', ')
            : String((result.data as { message: unknown }).message)
          : 'Failed to create user.';

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

    return NextResponse.json({
      success: true,
      data: result.data,
      coldStart: result.coldStart,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
