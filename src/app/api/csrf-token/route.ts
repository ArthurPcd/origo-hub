import { NextResponse } from 'next/server';
import { generateCSRFToken, getCSRFToken } from '@/lib/csrf';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Only authenticated users get a CSRF token — prevents unauthenticated relay abuse
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let token = await getCSRFToken();

    if (!token) {
      token = await generateCSRFToken();
    }

    return NextResponse.json({ csrfToken: token });
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to get CSRF token' },
      { status: 500 }
    );
  }
}
