# Master Error Scanner Report

**Mode:** conservative
**Generated:** 2025-08-23T18:01:57.004Z
**Duration:** 13.33s

## Summary
- Files Scanned: 913
- Files Modified: 8
- Total Fixes: 8
- Errors: 0
- Warnings: 0
- TypeScript Errors: 100

## Fixes by Category
- **syntax:** 1
- **imports:** 7

## TypeScript Compiler Errors
```
App.tsx(28,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/ai/ConversationalOracle.tsx(7,27): error TS2307: Cannot find module 'react-markdown' or its corresponding type declarations.
components/analytics/AdvancedAnalyticsDashboard.tsx(7,159): error TS2307: Cannot find module 'recharts' or its corresponding type declarations.
components/analytics/AdvancedAnalyticsDashboard.tsx(8,89): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/analytics/AdvancedOracleAnalyticsDashboard.tsx(7,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/analytics/AdvancedOracleAnalyticsDashboard.tsx(12,8): error TS2307: Cannot find module 'recharts' or its corresponding type declarations.
components/analytics/AdvancedOracleAnalyticsDashboard.tsx(17,8): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/analytics/AnalyticsComponents.tsx(7,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/analytics/CompareTray.tsx(5,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/analytics/EnhancedAnalyticsDashboard.tsx(7,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/analytics/EnhancedAnalyticsDashboard.tsx(12,8): error TS2307: Cannot find module 'recharts' or its corresponding type declarations.
components/analytics/EnhancedAnalyticsDashboard.tsx(18,8): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/analytics/OracleAnalyticsDashboard.tsx(4,115): error TS2307: Cannot find module 'recharts' or its corresponding type declarations.
components/analytics/OracleAnalyticsDashboard.tsx(5,84): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/analytics/PositionalScarcityChart.tsx(4,39): error TS2307: Cannot find module '../../data/players' or its corresponding type declarations.
components/analytics/PositionalScarcityChart.tsx(18,60): error TS7006: Parameter 'p' implicitly has an 'any' type.
components/analytics/PositionalScarcityChart.tsx(19,97): error TS18048: 'p.tier' is possibly 'undefined'.
components/analytics/RealTimeAnalyticsDashboard.tsx(7,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/analytics/RealTimeAnalyticsDashboard.tsx(11,8): error TS2307: Cannot find module 'recharts' or its corresponding type declarations.
components/analytics/RealTimeAnalyticsDashboard.tsx(15,8): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/auth/EnhancedAuthView.tsx(2,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/auth/EnhancedAuthView.tsx(16,8): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/auth/oauth/OAuthLoginComponent.tsx(2,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/auth/oauth/OAuthLoginComponent.tsx(5,66): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/auth/ProductionLoginInterface.tsx(8,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/auth/ProductionLoginInterface.tsx(19,8): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/auth/SimpleLoginInterface.tsx(7,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/auth/UserSettings.tsx(7,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/auth/UserSettings.tsx(10,61): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/cache/CacheIntegrationDemo.tsx(7,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/cache/CacheIntegrationDemo.tsx(8,69): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/cache/CacheManagementDashboard.tsx(7,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/cache/CacheManagementDashboard.tsx(17,8): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/chat/TradeEventMessage.tsx(6,25): error TS2307: Cannot find module '../../data/players' or its corresponding type declarations.
components/chat/TradeEventMessage.tsx(27,43): error TS7006: Parameter 'p' implicitly has an 'any' type.
components/commissioner/AddPlayerModal.tsx(4,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/commissioner/AddPlayerModal.tsx(6,25): error TS2307: Cannot find module '../../data/players' or its corresponding type declarations.
components/commissioner/AddPlayerModal.tsx(23,39): error TS7006: Parameter 'p' implicitly has an 'any' type.
components/commissioner/AddPlayerModal.tsx(25,47): error TS7006: Parameter 'p' implicitly has an 'any' type.
components/commissioner/AddPlayerModal.tsx(40,26): error TS7006: Parameter 'e' implicitly has an 'any' type.
components/commissioner/AddPlayerModal.tsx(66,42): error TS7006: Parameter 'player' implicitly has an 'any' type.
components/commissioner/CreatePollModal.tsx(4,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/commissioner/CreatePollModal.tsx(67,26): error TS7006: Parameter 'e' implicitly has an 'any' type.
components/commissioner/EnhancedMemberManagement.tsx(7,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/commissioner/EnhancedMemberManagement.tsx(326,39): error TS7006: Parameter 'e' implicitly has an 'any' type.
components/commissioner/InviteMemberModal.tsx(2,24): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/commissioner/InviteMemberModal.tsx(42,26): error TS7006: Parameter 'e' implicitly has an 'any' type.
components/commissioner/LeagueManagementInterface.tsx(7,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
components/commissioner/LeagueManagementInterface.tsx(16,8): error TS2307: Cannot find module 'lucide-react' or its corresponding type declarations.
components/commissioner/LeagueSettingsEditor.tsx(7,41): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
... and 50 more errors
```

## Backup Information
✅ Backups saved to: .master-scanner-backup
