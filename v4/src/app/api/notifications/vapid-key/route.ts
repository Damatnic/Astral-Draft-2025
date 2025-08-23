/**
 * API route to get VAPID public key for push notifications
 */

import { NextResponse } from 'next/server';
import { pushNotificationService } from '@/server/notifications/push';

export async function GET() {
  try {
    const publicKey = pushNotificationService.getVapidPublicKey();
    
    return NextResponse.json(
      { publicKey },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID key' },
      { status: 500 }
    );
  }
}