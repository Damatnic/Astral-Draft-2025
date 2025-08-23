import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseEmailTemplate, CyberButton, CyberStatsCard, CyberPlayerCard } from './BaseEmailTemplate';

interface WaiverResultsEmailProps {
  userFirstName: string;
  leagueName: string;
  claims: Array<{
    playerName: string;
    position: string;
    team: string;
    status: 'successful' | 'failed';
    reason?: string;
  }>;
  nextWaiverDate: string;
  leagueUrl: string;
  unsubscribeUrl: string;
}

export function WaiverResultsEmail({
  userFirstName,
  leagueName,
  claims,
  nextWaiverDate,
  leagueUrl,
  unsubscribeUrl,
}: WaiverResultsEmailProps) {
  const successfulClaims = claims.filter(claim => claim.status === 'successful');
  const failedClaims = claims.filter(claim => claim.status === 'failed');
  
  const previewText = `Waiver results: ${successfulClaims.length} successful, ${failedClaims.length} failed claims in ${leagueName}.`;

  return (
    <BaseEmailTemplate previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      {/* Header */}
      <Section className="text-center mb-8">
        <Text className="text-4xl mb-4">📝</Text>
        <Text className="text-3xl font-bold text-cyber-accent mb-2">
          Waiver Results
        </Text>
        <Text className="text-xl text-white mb-2">
          {leagueName}
        </Text>
        <Text className="text-lg text-gray-300 mb-0">
          Your claims have been processed
        </Text>
      </Section>

      {/* Results Summary */}
      <Section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CyberStatsCard
            icon="✅"
            title="Successful"
            value={successfulClaims.length}
            subtitle="Claims acquired"
          />
          <CyberStatsCard
            icon="❌"
            title="Failed"
            value={failedClaims.length}
            subtitle="Claims missed"
          />
        </div>
      </Section>

      {/* Main Message */}
      <Section className="mb-8">
        <Text className="text-gray-300 leading-relaxed mb-4">
          Hey <strong className="text-cyber-accent">{userFirstName}</strong>,
        </Text>
        
        <Text className="text-gray-300 leading-relaxed mb-6">
          The waiver wire has processed for <strong className="text-cyber-primary">{leagueName}</strong>! 
          Here are the results of your claims from this week's waiver period.
        </Text>
      </Section>

      {/* Successful Claims */}
      {successfulClaims.length > 0 && (
        <Section className="mb-8">
          <Text className="text-xl font-bold text-green-400 mb-4">
            ✅ Successful Claims
          </Text>
          
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <Text className="text-green-300 mb-4">
              Congratulations! You successfully claimed the following players:
            </Text>
            
            <div className="space-y-3">
              {successfulClaims.map((claim, index) => (
                <div key={index} className="bg-gray-800 border border-green-500/50 rounded-lg p-3">
                  <CyberPlayerCard
                    name={claim.playerName}
                    position={claim.position}
                    team={claim.team}
                    status="active"
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Failed Claims */}
      {failedClaims.length > 0 && (
        <Section className="mb-8">
          <Text className="text-xl font-bold text-red-400 mb-4">
            ❌ Failed Claims
          </Text>
          
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <Text className="text-red-300 mb-4">
              These claims were not successful:
            </Text>
            
            <div className="space-y-3">
              {failedClaims.map((claim, index) => (
                <div key={index} className="bg-gray-800 border border-red-500/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <CyberPlayerCard
                      name={claim.playerName}
                      position={claim.position}
                      team={claim.team}
                    />
                  </div>
                  {claim.reason && (
                    <Text className="text-xs text-red-300 mt-2 italic">
                      Reason: {claim.reason}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* No Claims */}
      {claims.length === 0 && (
        <Section className="mb-8">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 text-center">
            <Text className="text-gray-400 mb-4">
              You didn't have any waiver claims this week.
            </Text>
            <Text className="text-sm text-gray-500">
              Keep an eye on the waiver wire for emerging talent and injury replacements!
            </Text>
          </div>
        </Section>
      )}

      {/* Next Waiver Period */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-cyber-accent mb-4">
          📅 Next Waiver Period
        </Text>
        
        <div className="bg-gray-900 border border-cyber-primary/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <Text className="font-semibold text-white mb-2">
                Next Processing Date
              </Text>
              <Text className="text-cyber-accent font-mono text-lg">
                {nextWaiverDate}
              </Text>
            </div>
            <span className="text-4xl">⏰</span>
          </div>
          
          <Text className="text-sm text-gray-300 mt-4">
            Submit your claims before the deadline to be included in the next waiver run.
          </Text>
        </div>
      </Section>

      {/* Oracle Waiver Insights */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-cyber-accent mb-4 text-center">
          🤖 Oracle Waiver Insights
        </Text>
        
        <div className="bg-gray-900 border border-cyber-accent/30 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <Text className="font-semibold text-cyber-accent mb-2">
                🔥 Hot Pickups This Week
              </Text>
              <Text className="text-sm text-gray-300">
                Based on recent performance and opportunity, these players are trending upward:
              </Text>
              <div className="mt-2 text-xs text-cyber-primary font-mono">
                • Handcuff RBs with increased touches
                • WRs with target share growth
                • Defense units with favorable matchups
              </div>
            </div>
            
            <div>
              <Text className="font-semibold text-yellow-400 mb-2">
                📈 Breakout Candidates
              </Text>
              <Text className="text-sm text-gray-300">
                Keep an eye on these players who might emerge as season-long assets:
              </Text>
              <div className="mt-2 text-xs text-cyber-primary font-mono">
                • Rookie players gaining snap percentage
                • Players in new offensive schemes
                • Injury replacements exceeding expectations
              </div>
            </div>
            
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">
                💡 Strategy Tip
              </Text>
              <Text className="text-sm text-gray-300">
                {successfulClaims.length > 0 
                  ? "Great job securing your targets! Consider your roster balance and future needs for upcoming weeks."
                  : "Don't get discouraged by missed claims. Stay active on waivers and consider adjusting your priorities based on league trends."
                }
              </Text>
            </div>
          </div>
        </div>
      </Section>

      {/* Action Buttons */}
      <Section className="mb-8">
        <div className="text-center">
          <Text className="text-lg font-semibold text-white mb-4">
            What's Next? 🎯
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <CyberButton href={`${leagueUrl}/roster`} variant="default">
              📊 View Updated Roster
            </CyberButton>
            <CyberButton 
              href={`${process.env.NEXTAUTH_URL}/waivers`}
              variant="secondary"
            >
              📝 Set New Claims
            </CyberButton>
            <CyberButton 
              href={`${process.env.NEXTAUTH_URL}/trades`}
              variant="accent"
            >
              🔄 Explore Trades
            </CyberButton>
          </div>
        </div>
      </Section>

      <Hr className="border-gray-700 my-6" />

      {/* Weekly Strategy */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          🏈 This Week's Focus
        </Text>
        
        <div className="bg-gray-800 border border-cyber-primary/30 rounded-lg p-6">
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">1.</span>
              <div>
                <Text className="font-semibold text-white mb-1">Optimize Your Lineup</Text>
                <Text className="text-sm mb-0">
                  With your new players, review your starting lineup and make any necessary adjustments.
                </Text>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">2.</span>
              <div>
                <Text className="font-semibold text-white mb-1">Monitor Snap Counts</Text>
                <Text className="text-sm mb-0">
                  Track playing time for your newly acquired players to gauge their role.
                </Text>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">3.</span>
              <div>
                <Text className="font-semibold text-white mb-1">Plan Ahead</Text>
                <Text className="text-sm mb-0">
                  Look at upcoming matchups and bye weeks to identify future waiver targets.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Waiver Tips */}
      <Section className="mb-6">
        <Text className="text-lg font-semibold text-cyber-accent mb-4">
          💡 Pro Waiver Tips
        </Text>
        
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">Timing</Text>
              <Text className="mb-0">Submit claims early in the week to maximize your chances</Text>
            </div>
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">Priority</Text>
              <Text className="mb-0">Order your claims by importance, not just player ranking</Text>
            </div>
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">Research</Text>
              <Text className="mb-0">Check snap counts and target share trends before claiming</Text>
            </div>
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">Patience</Text>
              <Text className="mb-0">Sometimes waiting a week can help you get players for free</Text>
            </div>
          </div>
        </div>
      </Section>

      {/* Final Message */}
      <Section className="text-center">
        <Text className="text-gray-300 mb-4">
          {successfulClaims.length > 0 
            ? "Congratulations on your successful claims! Stay active on the waiver wire to keep improving your roster."
            : "Keep your head up and stay active! The waiver wire is a marathon, not a sprint."
          }
        </Text>
        
        <Text className="text-sm text-gray-400 italic">
          Good luck this week,<br />
          The Astral Draft Team
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
}