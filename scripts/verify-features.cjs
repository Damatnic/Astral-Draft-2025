#!/usr/bin/env node
/**
 * Feature Verification Script
 * Checks that all major features are properly implemented and connected
 */

const fs = require('fs');
const path = require('path');

const features = {
  'Core Features': {
    'Authentication System': [
      'components/auth/SimpleLoginInterface.tsx',
      'components/auth/ProductionLoginInterface.tsx',
      'hooks/useAuth.ts'
    ],
    'League Management': [
      'components/commissioner/LeagueManagementInterface.tsx',
      'components/commissioner/LeagueSettingsEditor.tsx',
      'hooks/useLeague.tsx'
    ],
    'Draft System': [
      'components/draft/DraftRoom.tsx',
      'components/draft/EnhancedSnakeDraftRoom.tsx',
      'components/draft/AuctionPanel.tsx'
    ],
    'Player Database': [
      'data/players.ts',
      'data/nfl-players-2025-fixed.ts'
    ],
    'Test Environment': [
      'setup-test-league.ts',
      'components/TestEnvironmentSetup.tsx'
    ]
  },
  'Analytics Features': {
    'Analytics Dashboard': [
      'components/analytics/AdvancedAnalyticsDashboard.tsx',
      'components/analytics/RealTimeAnalyticsDashboard.tsx'
    ],
    'Oracle System': [
      'components/oracle/OraclePanel.tsx',
      'components/oracle/OracleGeminiAISection.tsx'
    ],
    'Player Comparison': [
      'components/comparison/PlayerComparisonTool.tsx',
      'components/player/PlayerComparisonTab.tsx'
    ]
  },
  'Social Features': {
    'Chat System': [
      'components/chat/ChatPanel.tsx',
      'components/chat/TradeEventMessage.tsx'
    ],
    'League Hub': [
      'components/hub/AnnouncementsWidget.tsx',
      'components/hub/WeeklyPollWidget.tsx'
    ]
  },
  'Mobile Features': {
    'Mobile UI': [
      'components/mobile/MobilePlayerCard.tsx',
      'components/mobile/MobileSearchInterface.tsx'
    ],
    'PWA Support': [
      'public/manifest.json',
      'vite.config.ts'
    ]
  },
  'Trading & Transactions': {
    'Trade System': [
      'components/modals/ProposeTradeModal.tsx',
      'components/modals/TradeScenarioModal.tsx'
    ],
    'Waiver Wire': [
      'components/transactions/WaiverWire.tsx'
    ]
  }
};

console.log('🔍 Astral Draft Feature Verification\n');
console.log('=' .repeat(60));

let totalFiles = 0;
let missingFiles = 0;
let foundFiles = 0;
const missingFeatures = [];

// Check each feature category
Object.entries(features).forEach(([category, items]) => {
  console.log(`\n📁 ${category}`);
  
  Object.entries(items).forEach(([feature, files]) => {
    const results = files.map(file => {
      totalFiles++;
      const fullPath = path.join(process.cwd(), file);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        foundFiles++;
        return '✅';
      } else {
        missingFiles++;
        missingFeatures.push({ category, feature, file });
        return '❌';
      }
    });
    
    const allExist = results.every(r => r === '✅');
    const status = allExist ? '✅' : '⚠️';
    console.log(`  ${status} ${feature}: ${results.join(' ')}`);
  });
});

// Check environment setup
console.log('\n📁 Environment Configuration');
const envFiles = ['.env.local', '.env.example', '.gitignore'];
envFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check package dependencies
console.log('\n📦 Key Dependencies');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const keyDeps = [
  'react', 'vite', 'typescript', 'tailwindcss',
  'framer-motion', 'recharts', 'lucide-react',
  '@google/genai', 'socket.io-client'
];

keyDeps.forEach(dep => {
  const installed = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  console.log(`  ${installed ? '✅' : '❌'} ${dep}: ${installed || 'NOT INSTALLED'}`);
});

// Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 Summary:');
console.log(`  Total Files Checked: ${totalFiles}`);
console.log(`  Files Found: ${foundFiles} (${Math.round(foundFiles/totalFiles * 100)}%)`);
console.log(`  Files Missing: ${missingFiles} (${Math.round(missingFiles/totalFiles * 100)}%)`);

if (missingFeatures.length > 0) {
  console.log('\n⚠️  Missing Features:');
  missingFeatures.forEach(({ category, feature, file }) => {
    console.log(`  - ${category} > ${feature}: ${file}`);
  });
}

// Check if ready for production
const readyForProduction = missingFiles === 0 && fs.existsSync('.env.local');
console.log(`\n${readyForProduction ? '✅' : '❌'} ${readyForProduction ? 'Ready for deployment!' : 'Some features need attention'}`);

process.exit(missingFiles > 0 ? 1 : 0);