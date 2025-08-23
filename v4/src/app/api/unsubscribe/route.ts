import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  userId: z.string(),
  type: z.string(),
  token: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const token = searchParams.get('token');

    // Validate input
    const validation = unsubscribeSchema.safeParse({ userId, type, token });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe parameters' },
        { status: 400 }
      );
    }

    // TODO: Implement actual unsubscribe logic
    // This would typically involve:
    // 1. Validating the token/signature
    // 2. Updating user preferences in database
    // 3. Logging the unsubscribe event

    console.log(`User ${userId} unsubscribed from ${type} emails`);

    // Return HTML page confirming unsubscription
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unsubscribed - Astral Draft</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1e1b4b 0%, #0f0a2e 100%);
          color: white;
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          max-width: 500px;
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 16px;
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.2);
        }
        h1 {
          color: #8B5CF6;
          margin-bottom: 20px;
          font-size: 32px;
        }
        p {
          line-height: 1.6;
          margin-bottom: 20px;
          color: #e2e8f0;
        }
        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 20px;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .email-type {
          background: rgba(139, 92, 246, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          color: #8B5CF6;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✅</div>
        <h1>Successfully Unsubscribed</h1>
        <p>
          You have been successfully unsubscribed from 
          <span class="email-type">${type?.replace(/-/g, ' ') || 'all'}</span> 
          emails from Astral Draft.
        </p>
        <p>
          You will no longer receive these types of notifications. 
          You can always re-enable them in your account settings.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/settings" class="button">
          Manage Email Preferences
        </a>
      </div>
    </body>
    </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = unsubscribeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe parameters' },
        { status: 400 }
      );
    }

    const { userId, type } = validation.data;

    // TODO: Implement actual unsubscribe logic in database
    console.log(`User ${userId} unsubscribed from ${type} emails via API`);

    return NextResponse.json({
      success: true,
      message: `Successfully unsubscribed from ${type} emails`,
    });
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}