import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/api-client';

export async function GET() {
  const result = await fetchFromBackend('/', {
    method: 'GET',
    timeoutMs: 80000,
  });

  return NextResponse.json({
    online: result.ok || result.status === 404 || result.status === 200,
    status: result.status,
    durationMs: result.durationMs,
    coldStart: result.coldStart,
    backendUrl: process.env.NEST_API_URL || 'https://nestjs-postgres-prisma.onrender.com',
  });
}
