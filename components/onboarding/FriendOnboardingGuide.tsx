import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

const FriendOnboardingGuide: React.FC = () => {
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Astral Draft!',
      emoji: '🎯',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Ready to Start Predicting?
            </h3>
            <p className="text-gray-600">
              You're joining an exclusive group of friends competing to outpredict the Oracle AI!
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">What You'll Learn:</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• How to login with your friend PIN</li>
              <li>• Making your first prediction</li>
              <li>• Understanding the scoring system</li>
              <li>• Using social features</li>
            </ul>
          </div>

          <div className="text-center">
            <Badge className="bg-green-100 text-green-800">
              Takes just 5 minutes to get started!
            </Badge>
          </div>
        </div>
      )
    },
    {
      id: 'login',
      title: 'Login with Your Friend PIN',
      emoji: '🔑',
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="text-3xl font-mono font-bold text-gray-800 mb-2">
              0000
            </div>
            <p className="text-gray-600">Your Friend Group PIN</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Step by Step:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <span>Find the PIN entry field on the login screen</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <span>Type exactly: <code className="bg-gray-100 px-1 rounded">0000</code></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <span>Click "Login" or press Enter</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Pro Tip:</strong> All friends use the same PIN (0000). 
              Bookmark the page for quick access!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'predictions',
      title: 'Make Your First Prediction',
      emoji: '🎯',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">The Prediction Process:</h4>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <div className="font-medium">Browse Events</div>
                  <div className="text-sm text-gray-600">Look for upcoming games or events to predict</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <div className="font-medium">Choose Your Answer</div>
                  <div className="text-sm text-gray-600">Select from available options (usually Team A vs Team B)</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <div className="font-medium">Set Confidence (1-100%)</div>
                  <div className="text-sm text-gray-600">Higher confidence = more points if correct!</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <div className="font-medium">Submit & Track</div>
                  <div className="text-sm text-gray-600">Watch your prediction and wait for results</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <h5 className="font-medium text-orange-800 mb-1">Confidence Strategy:</h5>
            <div className="text-sm text-orange-700 space-y-1">
              <div>• <strong>90-100%:</strong> Very confident (high risk, high reward)</div>
              <div>• <strong>70-80%:</strong> Pretty sure (balanced approach)</div>
              <div>• <strong>50-60%:</strong> Coin flip (safer bet)</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'scoring',
      title: 'Understanding Scoring & Competition',
      emoji: '🏆',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🏆</div>
            <h4 className="font-semibold text-gray-800">How Points Work</h4>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h5 className="font-semibold text-purple-800 mb-3">Scoring Formula:</h5>
            <div className="text-center bg-white rounded p-3 border">
              <div className="text-lg font-mono">
                Points = Confidence × Accuracy Multiplier
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <h6 className="font-medium text-green-800">If Correct ✅</h6>
              <div className="text-sm text-green-700 mt-1">
                <div>80% confidence = 80 points</div>
                <div>50% confidence = 50 points</div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h6 className="font-medium text-red-800">If Wrong ❌</h6>
              <div className="text-sm text-red-700 mt-1">
                <div>80% confidence = -40 points</div>
                <div>50% confidence = -25 points</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="font-medium text-blue-800 mb-2">Your Goals:</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <div>🎯 <strong>Beat the Oracle:</strong> Outperform the AI's predictions</div>
              <div>🏅 <strong>Climb Leaderboard:</strong> Rank higher than your friends</div>
              <div>📈 <strong>Improve Accuracy:</strong> Aim for 70%+ correct predictions</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🎯 Friend Onboarding Guide
        </h1>
        <p className="text-gray-600">
          Get started with Astral Draft in just a few minutes!
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <Card key={step.id} className="mb-6">
            <CardHeader className="text-center">
              <div className="text-4xl mb-2">{step.emoji}</div>
              <CardTitle className="text-xl">
                {index + 1}. {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step.content}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📋 Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-800 mb-1">Login Info</div>
              <div className="text-gray-600">PIN: <code className="bg-gray-200 px-1 rounded">0000</code></div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-1">Scoring Goal</div>
              <div className="text-gray-600">Beat Oracle & Friends</div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-1">Need Help?</div>
              <div className="text-gray-600">Ask friend group admin</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 bg-cyan-50 border-cyan-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            💡 Pro Tips & Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-cyan-800 mb-2">🚀 Pro Tips:</h5>
              <div className="text-sm text-cyan-700 space-y-1">
                <div>• Research before predicting - knowledge improves accuracy</div>
                <div>• Don't always use 100% confidence - manage your risk</div>
                <div>• Stay consistent - regular participation helps improve results</div>
                <div>• Learn from the Oracle - analyze when it's right vs wrong</div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-red-800 mb-2">🔧 Common Issues:</h5>
              <div className="text-sm text-red-700 space-y-1">
                <div><strong>Can't login?</strong> Double-check PIN is exactly "0000"</div>
                <div><strong>Page looks broken?</strong> Refresh your browser</div>
                <div><strong>No predictions available?</strong> Check back later for new events</div>
                <div><strong>Prediction didn't save?</strong> Make sure you clicked "Submit"</div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h5 className="font-medium text-green-800 mb-1">📱 Device Compatibility:</h5>
              <div className="text-sm text-green-700">
                ✅ Smartphones • ✅ Tablets • ✅ Computers • ✅ Any modern browser
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendOnboardingGuide;
