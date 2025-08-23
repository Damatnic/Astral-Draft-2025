import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseEmailTemplate, CyberButton, CyberPlayerCard } from './BaseEmailTemplate';

interface TradeNotificationEmailProps {
  recipientName: string;
  proposerName: string;
  leagueName: string;
  tradeDetails: {
    giving: string[];
    receiving: string[];
  };
  tradeUrl: string;
  unsubscribeUrl: string;
  type: 'proposed' | 'accepted' | 'rejected';
}

export function TradeNotificationEmail({
  recipientName,
  proposerName,
  leagueName,
  tradeDetails,
  tradeUrl,
  unsubscribeUrl,
  type,
}: TradeNotificationEmailProps) {
  const typeConfig = {
    proposed: {
      icon: '📈',
      title: 'New Trade Proposal',
      color: 'text-cyber-accent',
      action: 'Review Trade',
      message: `${proposerName} has sent you a trade proposal in ${leagueName}.`,
    },
    accepted: {
      icon: '✅',
      title: 'Trade Accepted',
      color: 'text-green-400',
      action: 'View Details',
      message: `Your trade with ${proposerName} in ${leagueName} has been accepted!`,
    },
    rejected: {
      icon: '❌',
      title: 'Trade Rejected',
      color: 'text-red-400',
      action: 'View League',
      message: `Your trade proposal to ${proposerName} in ${leagueName} has been rejected.`,
    },
  };

  const config = typeConfig[type];
  const previewText = `${config.title}: ${config.message}`;

  return (
    <BaseEmailTemplate previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      {/* Header */}
      <Section className="text-center mb-8">
        <Text className={`text-4xl mb-2`}>{config.icon}</Text>
        <Text className={`text-2xl font-bold mb-2 ${config.color}`}>
          {config.title}
        </Text>
        <Text className="text-lg text-gray-300 mb-0">
          {leagueName}
        </Text>
      </Section>

      {/* Main Message */}
      <Section className="mb-8">
        <Text className="text-gray-300 leading-relaxed mb-6">
          Hey <strong className="text-cyber-accent">{recipientName}</strong>,
        </Text>
        
        <Text className="text-gray-300 leading-relaxed mb-6">
          {config.message}
        </Text>
      </Section>

      {/* Trade Details */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4 text-center">
          Trade Details
        </Text>
        
        <div className="bg-gray-900 border border-cyber-primary/30 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* You Give */}
            <div>
              <div className="flex items-center mb-4">
                <Text className="text-lg font-semibold text-white mb-0">
                  {type === 'proposed' ? 'You Give:' : 'You Gave:'}
                </Text>
                <span className="ml-2 text-red-400">📤</span>
              </div>
              <div className="space-y-2">
                {tradeDetails.giving.map((player, index) => {
                  const [name, position = '', team = ''] = player.split(' - ');
                  return (
                    <CyberPlayerCard
                      key={index}
                      name={name}
                      position={position}
                      team={team}
                    />
                  );
                })}
              </div>
            </div>

            {/* You Receive */}
            <div>
              <div className="flex items-center mb-4">
                <Text className="text-lg font-semibold text-white mb-0">
                  {type === 'proposed' ? 'You Receive:' : 'You Received:'}
                </Text>
                <span className="ml-2 text-green-400">📥</span>
              </div>
              <div className="space-y-2">
                {tradeDetails.receiving.map((player, index) => {
                  const [name, position = '', team = ''] = player.split(' - ');
                  return (
                    <CyberPlayerCard
                      key={index}
                      name={name}
                      position={position}
                      team={team}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Action Section */}
      {type === 'proposed' && (
        <Section className="mb-8">
          <div className="bg-gradient-to-r from-cyber-primary/20 to-cyber-accent/20 border border-cyber-primary/50 rounded-lg p-6 text-center">
            <Text className="text-lg font-semibold text-white mb-4">
              ⏰ Trade Awaiting Your Response
            </Text>
            <Text className="text-gray-300 mb-6">
              This trade proposal is waiting for your decision. Review the details and 
              make your choice before the deadline.
            </Text>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <CyberButton href={tradeUrl} variant="default">
                ✅ Accept Trade
              </CyberButton>
              <CyberButton href={tradeUrl} variant="secondary">
                ❌ Reject Trade
              </CyberButton>
            </div>
          </div>
        </Section>
      )}

      {type === 'accepted' && (
        <Section className="mb-8">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-6 text-center">
            <Text className="text-lg font-semibold text-white mb-4">
              🎉 Trade Successfully Completed!
            </Text>
            <Text className="text-gray-300 mb-6">
              The trade has been processed and the players have been moved to their new teams. 
              Good luck with your new roster!
            </Text>
            
            <CyberButton href={tradeUrl} variant="default">
              📊 View Updated Roster
            </CyberButton>
          </div>
        </Section>
      )}

      {type === 'rejected' && (
        <Section className="mb-8">
          <div className="bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/50 rounded-lg p-6 text-center">
            <Text className="text-lg font-semibold text-white mb-4">
              Trade Not Accepted
            </Text>
            <Text className="text-gray-300 mb-6">
              No worries! Keep exploring trade opportunities or try negotiating different terms.
            </Text>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <CyberButton href={`${process.env.NEXTAUTH_URL}/trades`} variant="default">
                🔄 Propose New Trade
              </CyberButton>
              <CyberButton href={tradeUrl} variant="secondary">
                📈 Trade Analyzer
              </CyberButton>
            </div>
          </div>
        </Section>
      )}

      <Hr className="border-gray-700 my-6" />

      {/* Oracle Insights */}
      <Section className="mb-6">
        <Text className="text-lg font-semibold text-cyber-accent mb-4 text-center">
          🤖 Oracle Insights
        </Text>
        
        <div className="bg-gray-900 border border-cyber-accent/30 rounded-lg p-4">
          <Text className="text-sm text-gray-300 italic">
            {type === 'proposed' && 
              `Based on current projections, this trade could impact your team's performance. ` +
              `Use our Trade Analyzer to get detailed insights before making your decision.`
            }
            {type === 'accepted' && 
              `Congratulations on completing this trade! Our AI predicts this move could ` +
              `strengthen your roster for the upcoming weeks.`
            }
            {type === 'rejected' && 
              `Don't give up! Our Oracle has identified several other trade opportunities ` +
              `that might interest you. Check out the Trade Center for suggestions.`
            }
          </Text>
        </div>
      </Section>

      {/* Footer Action */}
      <Section className="text-center">
        <CyberButton href={tradeUrl} variant="accent">
          {config.action}
        </CyberButton>
      </Section>
    </BaseEmailTemplate>
  );
}