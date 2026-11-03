import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, fetchFromBackend } from '@/lib/api-client';

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin login required' },
        { status: 401 },
      );
    }

    const result = await fetchFromBackend(`/admin/users/${userId}`, {
      method: 'DELETE',
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
          : 'Failed to delete user';

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
      message: `User #${userId} deleted successfully`,
      coldStart: result.coldStart,
      durationMs: result.durationMs,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
