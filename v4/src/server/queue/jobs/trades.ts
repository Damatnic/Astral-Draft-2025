/**
 * Trade expiration job handler
 */

import { prisma } from '../../db';

interface ProcessTradeExpirationData {
  tradeId: string;
}

export async function processTradeExpiration(data: ProcessTradeExpirationData) {
  const { tradeId } = data;
  
  try {
    // Get the trade
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        initiator: true,
        partner: true,
      },
    });
    
    if (!trade) {
      throw new Error(`Trade ${tradeId} not found`);
    }
    
    // Check if trade is still pending
    if (trade.status !== 'PROPOSED') {
      return {
        success: true,
        message: 'Trade already processed',
      };
    }
    
    // Check if trade has expired
    if (trade.expiresAt > new Date()) {
      return {
        success: true,
        message: 'Trade not yet expired',
      };
    }
    
    // Expire the trade
    await prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: 'EXPIRED',
      },
    });
    
    // Send notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: trade.initiator.ownerId,
          type: 'TRADE_EXPIRED',
          title: 'Trade Expired',
          content: `Your trade proposal with ${trade.partner.name} has expired`,
          data: {
            tradeId,
            partnerTeamId: trade.partnerId,
          },
        },
        {
          userId: trade.partner.ownerId,
          type: 'TRADE_EXPIRED',
          title: 'Trade Expired',
          content: `Trade proposal from ${trade.initiator.name} has expired`,
          data: {
            tradeId,
            initiatorTeamId: trade.initiatorId,
          },
        },
      ],
    });
    
    return {
      success: true,
      message: 'Trade expired successfully',
    };
    
  } catch (error) {
    console.error('Error processing trade expiration:', error);
    throw error;
  }
}