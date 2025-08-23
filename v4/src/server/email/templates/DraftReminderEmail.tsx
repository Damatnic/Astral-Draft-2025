import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseEmailTemplate, CyberButton, CyberStatsCard } from './BaseEmailTemplate';

interface DraftReminderEmailProps {
  userFirstName: string;
  leagueName: string;
  draftDateTime: string;
  draftUrl: string;
  timeUntilDraft: string;
  unsubscribeUrl: string;
}

export function DraftReminderEmail({
  userFirstName,
  leagueName,
  draftDateTime,
  draftUrl,
  timeUntilDraft,
  unsubscribeUrl,
}: DraftReminderEmailProps) {
  const previewText = `Draft starting soon! ${leagueName} draft begins in ${timeUntilDraft}.`;

  return (
    <BaseEmailTemplate previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      {/* Header */}
      <Section className="text-center mb-8">
        <Text className="text-4xl mb-4">⏰</Text>
        <Text className="text-3xl font-bold text-cyber-accent mb-2">
          Draft Starting Soon!
        </Text>
        <Text className="text-xl text-white mb-2">
          {leagueName}
        </Text>
        <Text className="text-lg text-gray-300 mb-0">
          Get ready to build your championship team
        </Text>
      </Section>

      {/* Countdown */}
      <Section className="mb-8">
        <div className="bg-gradient-to-r from-cyber-primary/20 to-cyber-accent/20 border border-cyber-primary rounded-lg p-6 text-center">
          <Text className="text-lg font-semibold text-white mb-2">
            Draft Countdown
          </Text>
          <Text className="text-3xl font-bold text-cyber-accent mb-2 font-mono">
            {timeUntilDraft}
          </Text>
          <Text className="text-sm text-gray-300 mb-0">
            Until your draft begins
          </Text>
        </div>
      </Section>

      {/* Main Message */}
      <Section className="mb-8">
        <Text className="text-gray-300 leading-relaxed mb-4">
          Hey <strong className="text-cyber-accent">{userFirstName}</strong>,
        </Text>
        
        <Text className="text-gray-300 leading-relaxed mb-4">
          Your <strong className="text-cyber-primary">{leagueName}</strong> draft is starting soon! 
          Make sure you're ready to dominate with our AI-powered draft assistance.
        </Text>

        <Text className="text-gray-300 leading-relaxed mb-6">
          <strong>Draft Date & Time:</strong><br />
          <span className="text-cyber-accent font-mono text-lg">{draftDateTime}</span>
        </Text>
      </Section>

      {/* Draft Stats */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4 text-center">
          Your Draft Edge
        </Text>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <CyberStatsCard
            icon="🎯"
            title="AI Recommendations"
            value="Live"
            subtitle="Real-time suggestions"
          />
          <CyberStatsCard
            icon="📊"
            title="Player Rankings"
            value="Updated"
            subtitle="Latest projections"
          />
          <CyberStatsCard
            icon="⚡"
            title="Draft Speed"
            value="30s"
            subtitle="Average pick time"
          />
        </div>
      </Section>

      {/* Pre-Draft Checklist */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          Pre-Draft Checklist ✅
        </Text>
        
        <div className="bg-gray-900 border border-cyber-primary/30 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-cyber-accent text-xl">📋</span>
              <div>
                <Text className="font-semibold text-white mb-1">Review Your Rankings</Text>
                <Text className="text-sm text-gray-300 mb-0">
                  Check and customize your player rankings based on the latest updates.
                </Text>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-cyber-accent text-xl">🎯</span>
              <div>
                <Text className="font-semibold text-white mb-1">Set Your Strategy</Text>
                <Text className="text-sm text-gray-300 mb-0">
                  Choose your draft strategy: Zero RB, Robust RB, or Balanced approach.
                </Text>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-cyber-accent text-xl">🔍</span>
              <div>
                <Text className="font-semibold text-white mb-1">Check Sleepers & Busts</Text>
                <Text className="text-sm text-gray-300 mb-0">
                  Review our Oracle's latest sleeper picks and potential busts.
                </Text>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-cyber-accent text-xl">🌐</span>
              <div>
                <Text className="font-semibold text-white mb-1">Test Your Connection</Text>
                <Text className="text-sm text-gray-300 mb-0">
                  Ensure you have a stable internet connection for the draft.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Draft Tools */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4 text-center">
          🚀 Astral Draft Tools at Your Disposal
        </Text>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 border border-cyber-accent/30 rounded-lg p-4">
            <Text className="text-lg font-semibold text-cyber-accent mb-2">
              🤖 AI Draft Coach
            </Text>
            <Text className="text-sm text-gray-300 mb-3">
              Get real-time pick suggestions based on your team needs and league settings.
            </Text>
            <div className="text-xs text-cyber-primary font-mono">
              • Position scarcity analysis
              • Value-based drafting
              • Injury risk assessment
            </div>
          </div>
          
          <div className="bg-gray-800 border border-cyber-accent/30 rounded-lg p-4">
            <Text className="text-lg font-semibold text-cyber-accent mb-2">
              📈 Live Trade Analyzer
            </Text>
            <Text className="text-sm text-gray-300 mb-3">
              Instantly evaluate trade opportunities during the draft.
            </Text>
            <div className="text-xs text-cyber-primary font-mono">
              • Fair trade calculator
              • Team need analysis
              • Future week projections
            </div>
          </div>
        </div>
      </Section>

      {/* Action Buttons */}
      <Section className="mb-8">
        <div className="text-center">
          <Text className="text-lg font-semibold text-white mb-4">
            Ready to Draft? 🏆
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <CyberButton href={draftUrl} variant="default">
              🚀 Join Draft Room
            </CyberButton>
            <CyberButton 
              href={`${process.env.NEXTAUTH_URL}/draft/prep`}
              variant="secondary"
            >
              📋 Draft Prep Center
            </CyberButton>
          </div>
          
          <Text className="text-sm text-gray-400">
            We recommend joining the draft room 5-10 minutes early to ensure everything is working properly.
          </Text>
        </div>
      </Section>

      <Hr className="border-gray-700 my-6" />

      {/* Oracle Prediction */}
      <Section className="mb-6">
        <Text className="text-lg font-semibold text-cyber-accent mb-4 text-center">
          🤖 Oracle Prediction
        </Text>
        
        <div className="bg-gray-900 border border-cyber-accent/30 rounded-lg p-4 text-center">
          <Text className="text-sm text-gray-300 italic">
            "Based on your draft position and league settings, I predict you'll have 
            excellent opportunities to draft a top-tier RB in round 1 and a WR1 in round 2. 
            Keep an eye on value picks in the middle rounds - that's where championships are won!"
          </Text>
          <Text className="text-xs text-cyber-accent mt-2 font-mono">
            - The Oracle AI
          </Text>
        </div>
      </Section>

      {/* Mobile App Reminder */}
      <Section className="text-center">
        <Text className="text-sm text-gray-400 mb-4">
          💡 <strong>Pro Tip:</strong> Download our mobile app for draft notifications 
          and the ability to draft on-the-go if needed.
        </Text>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CyberButton 
            href={`${process.env.NEXTAUTH_URL}/mobile-app`}
            variant="accent"
          >
            📱 Get Mobile App
          </CyberButton>
        </div>
      </Section>
    </BaseEmailTemplate>
  );
}