/**
 * Feature Activation API Endpoint
 *
 * POST /api/features/activate
 *
 * SECURITY CRITICAL:
 * - Server-side validation ONLY
 * - Uses service_role to access activation_codes table
 * - Rate limiting: 5 attempts per user per 15 minutes
 * - Never exposes activation_codes data to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { FeatureRepository } from '@/lib/repositories/features';
import { ApiError, ErrorCodes } from '@/lib/errors';
import { checkActivateRateLimit } from '@/lib/rate-limit';
import { notifyActivationCode } from '@/lib/telegram';

/**
 * POST /api/features/activate
 * Activate a feature using an activation code
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Activation code is required' },
        { status: 400 }
      );
    }

    // 2. Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 3. Check rate limit
    const rateLimit = await checkActivateRateLimit(userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // 4. Create service_role client (CRITICAL: Never expose to client)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase service role credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 5. Activate feature using repository
    const repo = new FeatureRepository(supabase, userId);

    try {
      const activation = await repo.activateFeature(code, serviceClient);

      void notifyActivationCode(userId, activation.featureCode);

      return NextResponse.json({
        success: true,
        feature: {
          code: activation.featureCode,
          activatedAt: activation.activatedAt,
        },
        message: 'Feature activated successfully!',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        // Map ApiError codes to user-friendly responses
        const errorMessages: Record<string, string> = {
          [ErrorCodes.INVALID_INPUT]: 'Invalid activation code',
          [ErrorCodes.DUPLICATE_ENTRY]: 'You already have this feature activated',
        };

        const message = error.code && errorMessages[error.code] ? errorMessages[error.code] : error.message;

        return NextResponse.json(
          {
            error: message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }

      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('Feature activation error:', error);

    return NextResponse.json(
      {
        error: 'An error occurred while activating the feature',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/features/activate
 * Get user's activated features
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();
    const repo = new FeatureRepository(supabase, userId);
    const activations = await repo.getUserActivations();

    return NextResponse.json({
      activations: activations.map(a => ({
        featureCode: a.featureCode,
        activatedAt: a.activatedAt,
        expiresAt: a.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching activations:', error);

    return NextResponse.json(
      { error: 'Failed to fetch activations' },
      { status: 500 }
    );
  }
}
