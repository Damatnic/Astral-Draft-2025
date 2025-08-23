import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseEmailTemplate, CyberButton, CyberStatsCard, CyberPlayerCard } from './BaseEmailTemplate';

interface DraftResultsEmailProps {
  userFirstName: string;
  leagueName: string;
  teamName: string;
  draftedPlayers: Array<{
    name: string;
    position: string;
    team: string;
    round: number;
  }>;
  teamGrade?: string;
  leagueUrl: string;
  unsubscribeUrl: string;
}

export function DraftResultsEmail({
  userFirstName,
  leagueName,
  teamName,
  draftedPlayers,
  teamGrade,
  leagueUrl,
  unsubscribeUrl,
}: DraftResultsEmailProps) {
  const previewText = `Draft complete! See your ${teamName} roster and results from ${leagueName}.`;

  // Calculate position breakdown
  const positionCounts = draftedPlayers.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get key picks (first 5 rounds)
  const keyPicks = draftedPlayers.filter(p => p.round <= 5).sort((a, b) => a.round - b.round);

  return (
    <BaseEmailTemplate previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      {/* Header */}
      <Section className="text-center mb-8">
        <Text className="text-4xl mb-4">🏆</Text>
        <Text className="text-3xl font-bold text-cyber-accent mb-2">
          Draft Complete!
        </Text>
        <Text className="text-xl text-white mb-2">
          {teamName}
        </Text>
        <Text className="text-lg text-gray-300 mb-0">
          {leagueName}
        </Text>
      </Section>

      {/* Draft Grade */}
      {teamGrade && (
        <Section className="mb-8">
          <div className="bg-gradient-to-r from-cyber-primary/20 to-cyber-accent/20 border border-cyber-primary rounded-lg p-6 text-center">
            <Text className="text-lg font-semibold text-white mb-2">
              🎯 Oracle Draft Grade
            </Text>
            <Text className="text-5xl font-bold text-cyber-accent mb-2 font-mono">
              {teamGrade}
            </Text>
            <Text className="text-sm text-gray-300 mb-0">
              Based on value, team construction, and projections
            </Text>
          </div>
        </Section>
      )}

      {/* Main Message */}
      <Section className="mb-8">
        <Text className="text-gray-300 leading-relaxed mb-4">
          Congratulations <strong className="text-cyber-accent">{userFirstName}</strong>!
        </Text>
        
        <Text className="text-gray-300 leading-relaxed mb-6">
          Your <strong className="text-cyber-primary">{leagueName}</strong> draft is complete! 
          Here's a summary of your <strong className="text-cyber-accent">{teamName}</strong> roster 
          and how you performed in the draft.
        </Text>
      </Section>

      {/* Draft Stats */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4 text-center">
          Draft Summary
        </Text>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <CyberStatsCard
            icon="👥"
            title="Total Picks"
            value={draftedPlayers.length}
            subtitle="Players drafted"
          />
          <CyberStatsCard
            icon="🏃‍♂️"
            title="RBs"
            value={positionCounts.RB || 0}
            subtitle="Running backs"
          />
          <CyberStatsCard
            icon="🙌"
            title="WRs"
            value={positionCounts.WR || 0}
            subtitle="Wide receivers"
          />
          <CyberStatsCard
            icon="🎯"
            title="QBs"
            value={positionCounts.QB || 0}
            subtitle="Quarterbacks"
          />
        </div>
      </Section>

      {/* Key Picks */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          🌟 Your Key Picks (Rounds 1-5)
        </Text>
        
        <div className="bg-gray-900 border border-cyber-primary/30 rounded-lg p-6">
          <div className="space-y-3">
            {keyPicks.map((player, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-4">
                  <div className="bg-cyber-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {player.round}
                  </div>
                  <div>
                    <Text className="font-semibold text-white text-sm mb-0">
                      {player.name}
                    </Text>
                    <Text className="text-xs text-gray-400 mb-0">
                      {player.position} - {player.team}
                    </Text>
                  </div>
                </div>
                <Text className="text-xs text-cyber-accent font-mono">
                  Round {player.round}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Position Breakdown */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          📊 Roster Construction
        </Text>
        
        <div className="bg-gray-900 border border-cyber-primary/30 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(positionCounts).map(([position, count]) => (
              <div key={position} className="text-center">
                <Text className="text-2xl font-bold text-cyber-accent mb-1">
                  {count}
                </Text>
                <Text className="text-sm text-white font-semibold mb-0">
                  {position}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Oracle Analysis */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-cyber-accent mb-4 text-center">
          🤖 Oracle Draft Analysis
        </Text>
        
        <div className="bg-gray-900 border border-cyber-accent/30 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <Text className="font-semibold text-cyber-accent mb-2">
                ✅ Strengths
              </Text>
              <Text className="text-sm text-gray-300">
                • Strong early-round selections with high ceiling players<br />
                • Good positional balance across your starting lineup<br />
                • Identified several potential breakout candidates in later rounds
              </Text>
            </div>
            
            <div>
              <Text className="font-semibold text-yellow-400 mb-2">
                ⚠️ Watch Points
              </Text>
              <Text className="text-sm text-gray-300">
                • Consider monitoring the waiver wire for depth at certain positions<br />
                • Keep an eye on injury reports for your key players<br />
                • Look for trade opportunities to optimize your lineup
              </Text>
            </div>
            
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">
                🎯 Season Outlook
              </Text>
              <Text className="text-sm text-gray-300">
                Based on your draft, you're projected to be competitive in your league. 
                Your core players give you a solid foundation to build upon throughout the season.
              </Text>
            </div>
          </div>
        </div>
      </Section>

      {/* Action Buttons */}
      <Section className="mb-8">
        <div className="text-center">
          <Text className="text-lg font-semibold text-white mb-4">
            What's Next? 🚀
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <CyberButton href={leagueUrl} variant="default">
              📊 View Full Roster
            </CyberButton>
            <CyberButton 
              href={`${process.env.NEXTAUTH_URL}/trades`}
              variant="secondary"
            >
              🔄 Explore Trades
            </CyberButton>
            <CyberButton 
              href={`${process.env.NEXTAUTH_URL}/waivers`}
              variant="accent"
            >
              📝 Waiver Wire
            </CyberButton>
          </div>
        </div>
      </Section>

      <Hr className="border-gray-700 my-6" />

      {/* Season Prep */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          🏈 Get Ready for Week 1
        </Text>
        
        <div className="bg-gray-800 border border-cyber-primary/30 rounded-lg p-6">
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">1.</span>
              <div>
                <Text className="font-semibold text-white mb-1">Set Your Starting Lineup</Text>
                <Text className="text-sm mb-0">
                  Review projections and set your Week 1 lineup. Our Oracle will help with start/sit decisions.
                </Text>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">2.</span>
              <div>
                <Text className="font-semibold text-white mb-1">Monitor Injury Reports</Text>
                <Text className="text-sm mb-0">
                  Stay updated on player health status leading up to game day.
                </Text>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">3.</span>
              <div>
                <Text className="font-semibold text-white mb-1">Plan Waiver Claims</Text>
                <Text className="text-sm mb-0">
                  Keep an eye on emerging players and handcuffs for your key positions.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Complete Roster */}
      <Section className="mb-6">
        <Text className="text-lg font-semibold text-white mb-4">
          📋 Complete Draft Results
        </Text>
        
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="space-y-2">
            {draftedPlayers.sort((a, b) => a.round - b.round).map((player, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 w-8">R{player.round}</span>
                  <span className="text-white font-medium">{player.name}</span>
                  <span className="text-gray-400">{player.position} - {player.team}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Final Message */}
      <Section className="text-center">
        <Text className="text-gray-300 mb-4">
          Great job in the draft! Now it's time to manage your team to a championship. 
          Let's make this season legendary!
        </Text>
        
        <Text className="text-sm text-gray-400 italic">
          Good luck this season,<br />
          The Astral Draft Team
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
}