import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/api-client';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active admin session' },
        { status: 401 },
      );
    }

    // Decode JWT payload directly (avoids /users/profile which is restricted to Role.User)
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
        const user = JSON.parse(payloadStr);

        // Check token expiration
        if (user.exp && user.exp * 1000 < Date.now()) {
          cookieStore.delete(AUTH_COOKIE_NAME);
          return NextResponse.json(
            { success: false, error: 'Admin session expired. Please log in again.' },
            { status: 401 },
          );
        }

        const role = String(user.role || '').toUpperCase();
        const isAdmin = role.includes('ADMIN') || role === 'SUPER_ADMIN';

        if (!isAdmin) {
          cookieStore.delete(AUTH_COOKIE_NAME);
          return NextResponse.json(
            { success: false, error: 'Access Denied: Admin privileges required.' },
            { status: 403 },
          );
        }

        return NextResponse.json({
          success: true,
          user,
        });
      }
    } catch {
      cookieStore.delete(AUTH_COOKIE_NAME);
      return NextResponse.json(
        { success: false, error: 'Invalid token structure' },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid token' },
      { status: 401 },
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
