# Astral Draft v4 Feature Parity Mapping

## Overview

This document provides a comprehensive mapping from the existing Astral Draft codebase to the v4 Next.js implementation, ensuring 1:1 feature parity and identifying the implementation path for each component and feature.

---

## Component Migration Map

### Core Layout Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `MainLayout` | `src/components/layout/MainLayout.tsx` | ⏳ Pending | P0 | Convert to Next.js app router layout |
| `MobileLayoutWrapper` | `src/components/layout/MobileLayout.tsx` | ⏳ Pending | P0 | Preserve mobile-first approach |
| `Header` | `src/components/layout/Header.tsx` | ⏳ Pending | P0 | Update navigation for Next.js routing |
| `MobileNavigation` | `src/components/mobile/Navigation.tsx` | ⏳ Pending | P0 | Maintain touch-optimized design |
| `ErrorBoundary` | `src/components/ui/ErrorBoundary.tsx` | ⏳ Pending | P0 | Add Next.js error handling |

### Authentication Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `ModernAuthView` | `src/app/auth/page.tsx` | ⏳ Pending | P0 | Convert to Next.js page component |
| `AuthView` | `src/components/auth/AuthForm.tsx` | ⏳ Pending | P0 | Extract reusable form component |
| `ProductionLoginInterface` | `src/components/auth/ProductionLogin.tsx` | ⏳ Pending | P0 | Integrate with NextAuth.js |
| `EnhancedAuthView` | `src/components/auth/EnhancedAuth.tsx` | ⏳ Pending | P1 | Add MFA support |
| `OAuthLoginComponent` | `src/components/auth/OAuthProviders.tsx` | ⏳ Pending | P1 | NextAuth.js providers |

### Dashboard Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `ModernDashboardView` | `src/app/dashboard/page.tsx` | ⏳ Pending | P0 | Main dashboard page |
| `EnhancedDashboardView` | `src/components/dashboard/EnhancedDashboard.tsx` | ⏳ Pending | P0 | Advanced dashboard features |
| `DashboardView` | `src/components/dashboard/Dashboard.tsx` | ⏳ Pending | P0 | Base dashboard component |
| `WhatsNextWidget` | `src/components/widgets/WhatsNext.tsx` | ⏳ Pending | P1 | Action items widget |
| `ActivityFeedWidget` | `src/components/widgets/ActivityFeed.tsx` | ⏳ Pending | P1 | Recent activities |
| `PerformanceMetricsWidget` | `src/components/widgets/PerformanceMetrics.tsx` | ⏳ Pending | P1 | Performance tracking |

### League Management Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `LeagueHubView` | `src/app/league/[id]/page.tsx` | ⏳ Pending | P0 | League homepage |
| `LeagueCreationWizard` | `src/components/league/CreationWizard.tsx` | ⏳ Pending | P0 | Multi-step form |
| `CreateLeagueModal` | `src/components/modals/CreateLeague.tsx` | ⏳ Pending | P0 | Quick league creation |
| `EditLeagueSettingsView` | `src/app/league/[id]/settings/page.tsx` | ⏳ Pending | P0 | League configuration |
| `CommissionerToolsView` | `src/app/league/[id]/admin/page.tsx` | ⏳ Pending | P0 | Admin interface |
| `LeagueStandingsView` | `src/app/league/[id]/standings/page.tsx` | ⏳ Pending | P0 | Standings table |

### Draft Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `DraftRoomView` | `src/app/draft/[id]/page.tsx` | ⏳ Pending | P0 | Main draft interface |
| `LiveDraftRoomView` | `src/app/draft/[id]/live/page.tsx` | ⏳ Pending | P0 | Real-time draft room |
| `EnhancedSnakeDraftRoom` | `src/components/draft/SnakeDraft.tsx` | ⏳ Pending | P0 | Snake draft implementation |
| `DraftBoard` | `src/components/draft/DraftBoard.tsx` | ⏳ Pending | P0 | Visual draft board |
| `AuctionPanel` | `src/components/draft/AuctionPanel.tsx` | ⏳ Pending | P0 | Auction draft interface |
| `AiCoPilotPanel` | `src/components/draft/AiCoPilot.tsx` | ⏳ Pending | P1 | AI draft assistance |
| `MockDraftModal` | `src/components/modals/MockDraft.tsx` | ⏳ Pending | P1 | Practice drafts |

### Oracle/AI Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `BeatTheOracleView` | `src/app/oracle/page.tsx` | ⏳ Pending | P0 | Oracle competition page |
| `OracleAnalyticsDashboard` | `src/components/oracle/AnalyticsDashboard.tsx` | ⏳ Pending | P0 | Oracle analytics |
| `OracleRealTimePredictionInterface` | `src/components/oracle/RealTimePredictions.tsx` | ⏳ Pending | P0 | Live predictions |
| `OracleLeaderboard` | `src/components/oracle/Leaderboard.tsx` | ⏳ Pending | P0 | User rankings |
| `MLAnalyticsDashboard` | `src/components/oracle/MLAnalytics.tsx` | ⏳ Pending | P1 | ML insights |
| `EnsembleMLWidget` | `src/components/oracle/EnsembleML.tsx` | ⏳ Pending | P1 | Advanced ML models |

### Team Management Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `TeamHubView` | `src/app/team/[id]/page.tsx` | ⏳ Pending | P0 | Team homepage |
| `EditRosterView` | `src/app/team/[id]/roster/page.tsx` | ⏳ Pending | P0 | Roster management |
| `EnhancedRosterManager` | `src/components/team/RosterManager.tsx` | ⏳ Pending | P0 | Advanced roster tools |
| `LineupOptimizer` | `src/components/team/LineupOptimizer.tsx` | ⏳ Pending | P0 | Optimal lineup calculator |
| `StartSitToolView` | `src/app/tools/start-sit/page.tsx` | ⏳ Pending | P0 | Lineup decisions |
| `WaiverWireView` | `src/app/league/[id]/waivers/page.tsx` | ⏳ Pending | P0 | Free agent marketplace |

### Player Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `PlayerDetailModal` | `src/components/modals/PlayerDetail.tsx` | ⏳ Pending | P0 | Player information modal |
| `EnhancedPlayerDetailModal` | `src/components/player/EnhancedDetail.tsx` | ⏳ Pending | P0 | Advanced player analytics |
| `PlayerCard` | `src/components/player/PlayerCard.tsx` | ⏳ Pending | P0 | Player display card |
| `MobilePlayerCard` | `src/components/mobile/PlayerCard.tsx` | ⏳ Pending | P0 | Mobile-optimized card |
| `PlayerPool` | `src/components/player/PlayerPool.tsx` | ⏳ Pending | P0 | Available players list |
| `PlayerComparisonTool` | `src/components/player/ComparisonTool.tsx` | ⏳ Pending | P1 | Side-by-side comparison |

### Analytics Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `AnalyticsHubView` | `src/app/analytics/page.tsx` | ⏳ Pending | P0 | Analytics homepage |
| `RealTimeAnalyticsView` | `src/app/analytics/realtime/page.tsx` | ⏳ Pending | P0 | Live analytics |
| `PerformanceTrendsView` | `src/app/analytics/trends/page.tsx` | ⏳ Pending | P1 | Performance trends |
| `ChampionshipOddsView` | `src/app/analytics/championship/page.tsx` | ⏳ Pending | P1 | Championship probabilities |
| `PowerRankingsView` | `src/app/league/[id]/rankings/page.tsx` | ⏳ Pending | P1 | Team power rankings |

### Social Components

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `MessagesView` | `src/app/messages/page.tsx` | ⏳ Pending | P1 | Direct messages |
| `SocialHub` | `src/components/social/Hub.tsx` | ⏳ Pending | P1 | Social features center |
| `ChatPanel` | `src/components/social/ChatPanel.tsx` | ⏳ Pending | P1 | League chat |
| `TradeNegotiationChat` | `src/components/social/TradeChat.tsx` | ⏳ Pending | P1 | Trade discussions |
| `SocialFeed` | `src/components/social/Feed.tsx` | ⏳ Pending | P1 | Activity stream |

---

## API Endpoint Migration Map

### Authentication Endpoints

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `POST /api/auth/login` | `src/app/api/auth/[...nextauth]/route.ts` | ⏳ Pending | P0 | NextAuth.js integration |
| `POST /api/auth/register` | `src/app/api/auth/register/route.ts` | ⏳ Pending | P0 | User registration |
| `GET /api/auth/profile` | `src/app/api/user/profile/route.ts` | ⏳ Pending | P0 | Profile management |
| `POST /api/auth/logout` | NextAuth.js built-in | ✅ Native | P0 | Handled by NextAuth.js |

### League Management Endpoints

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `GET /api/leagues` | `src/app/api/leagues/route.ts` | ⏳ Pending | P0 | User leagues list |
| `POST /api/leagues` | `src/app/api/leagues/route.ts` | ⏳ Pending | P0 | League creation |
| `GET /api/leagues/:id` | `src/app/api/leagues/[id]/route.ts` | ⏳ Pending | P0 | League details |
| `PUT /api/leagues/:id` | `src/app/api/leagues/[id]/route.ts` | ⏳ Pending | P0 | League updates |
| `POST /api/leagues/:id/join` | `src/app/api/leagues/[id]/join/route.ts` | ⏳ Pending | P0 | League membership |

### Draft Endpoints

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `GET /api/draft/:id` | `src/app/api/draft/[id]/route.ts` | ⏳ Pending | P0 | Draft state |
| `POST /api/draft/:id/pick` | `src/app/api/draft/[id]/pick/route.ts` | ⏳ Pending | P0 | Draft picks |
| `POST /api/draft/:id/bid` | `src/app/api/draft/[id]/bid/route.ts` | ⏳ Pending | P0 | Auction bids |
| WebSocket Draft Server | Next.js WebSocket integration | ⏳ Pending | P0 | Real-time draft updates |

### Oracle Endpoints

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `GET /api/oracle/predictions` | `src/app/api/oracle/predictions/route.ts` | ⏳ Pending | P0 | Prediction retrieval |
| `POST /api/oracle/predictions` | `src/app/api/oracle/predictions/route.ts` | ⏳ Pending | P0 | Prediction submission |
| `GET /api/oracle/leaderboard` | `src/app/api/oracle/leaderboard/route.ts` | ⏳ Pending | P0 | User rankings |
| `GET /api/oracle/analytics` | `src/app/api/oracle/analytics/route.ts` | ⏳ Pending | P0 | Oracle analytics |

---

## Database Migration Map

### Schema Translation

| Current (SQLite) | New (Prisma) | Status | Priority | Notes |
|------------------|--------------|---------|----------|-------|
| `users` table | `User` model | ⏳ Pending | P0 | Core user data |
| `leagues` table | `League` model | ⏳ Pending | P0 | League configuration |
| `league_members` table | `LeagueMembership` model | ⏳ Pending | P0 | User-league relationships |
| `fantasy_teams` table | `Team` model | ⏳ Pending | P0 | Team data |
| `nfl_players` table | `Player` model | ⏳ Pending | P0 | NFL player database |
| `draft_picks` table | `DraftPick` model | ⏳ Pending | P0 | Draft history |
| `matchups` table | `Matchup` model | ⏳ Pending | P0 | Weekly matchups |
| `transactions` table | `Transaction` model | ⏳ Pending | P0 | Trades and moves |
| `oracle_predictions` table | `Prediction` model | ⏳ Pending | P0 | Oracle data |

### Data Migration Strategy

1. **Phase 1: Core Schema** (P0)
   - Users and authentication
   - Leagues and teams
   - Players and basic stats

2. **Phase 2: Game Features** (P0)
   - Draft system
   - Matchups and scoring
   - Basic transactions

3. **Phase 3: Advanced Features** (P1)
   - Oracle predictions
   - Analytics data
   - Social features

4. **Phase 4: Enhancement** (P2)
   - Performance optimizations
   - Additional indexes
   - Cleanup and archival

---

## Service Migration Map

### Core Services

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `authService.ts` | `src/lib/auth.ts` | ⏳ Pending | P0 | NextAuth.js integration |
| `leagueManagementService.ts` | `src/lib/league.ts` | ⏳ Pending | P0 | League operations |
| `draftSimulationEngine.ts` | `src/lib/draft.ts` | ⏳ Pending | P0 | Draft logic |
| `oraclePredictionService.ts` | `src/lib/oracle.ts` | ⏳ Pending | P0 | Oracle predictions |
| `realTimeDataService.ts` | `src/lib/realtime.ts` | ⏳ Pending | P0 | Live data updates |

### AI/ML Services

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `geminiService.ts` | `src/lib/ai/gemini.ts` | ⏳ Pending | P0 | Google AI integration |
| `oracleMachineLearningService.ts` | `src/lib/ai/ml.ts` | ⏳ Pending | P1 | ML predictions |
| `enhancedAnalyticsService.ts` | `src/lib/analytics.ts` | ⏳ Pending | P1 | Advanced analytics |

### Integration Services

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `productionSportsDataService.ts` | `src/lib/integrations/sports.ts` | ⏳ Pending | P0 | NFL data |
| `paymentService.ts` | `src/lib/payments/stripe.ts` | ⏳ Pending | P1 | Payment processing |
| `notificationService.ts` | `src/lib/notifications.ts` | ⏳ Pending | P1 | Push notifications |

---

## Configuration Migration

### Environment Variables

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `VITE_GEMINI_API_KEY` | `GEMINI_API_KEY` | ⏳ Pending | P0 | Remove VITE_ prefix |
| `VITE_SPORTS_IO_API_KEY` | `SPORTS_IO_API_KEY` | ⏳ Pending | P0 | Server-side only |
| `DATABASE_URL` | `DATABASE_URL` | ⏳ Pending | P0 | Prisma integration |
| `JWT_SECRET` | `NEXTAUTH_SECRET` | ⏳ Pending | P0 | NextAuth.js secret |

### Build Configuration

| Current (v3) | New (v4) | Status | Priority | Notes |
|--------------|----------|---------|----------|-------|
| `vite.config.ts` | `next.config.js` | ⏳ Pending | P0 | Next.js configuration |
| `tailwind.config.js` | `tailwind.config.ts` | ⏳ Pending | P0 | TypeScript config |
| `jest.config.js` | `vitest.config.ts` | ⏳ Pending | P0 | Vitest for testing |

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- **Priority**: P0 components only
- **Scope**: Authentication, basic layout, routing
- **Deliverables**:
  - NextAuth.js setup
  - Basic page structure
  - Core navigation
  - Database schema

### Phase 2: Core Features (Weeks 3-6)
- **Priority**: P0 league and draft features
- **Scope**: League management, draft system, team management
- **Deliverables**:
  - League creation and management
  - Draft room functionality
  - Basic team operations
  - Player database integration

### Phase 3: Oracle Integration (Weeks 7-8)
- **Priority**: P0 Oracle features
- **Scope**: Oracle predictions, basic analytics
- **Deliverables**:
  - Oracle prediction system
  - User competition interface
  - Basic analytics dashboard

### Phase 4: Enhanced Features (Weeks 9-12)
- **Priority**: P1 features
- **Scope**: Advanced analytics, social features, mobile optimization
- **Deliverables**:
  - Advanced analytics
  - Social features
  - Mobile enhancements
  - Performance optimizations

### Phase 5: Polish & Launch (Weeks 13-14)
- **Priority**: P2 features and optimization
- **Scope**: Performance, accessibility, advanced features
- **Deliverables**:
  - Performance optimization
  - Accessibility compliance
  - Advanced ML features
  - Production deployment

---

## Testing Strategy

### Component Testing
- **Framework**: Vitest + React Testing Library
- **Coverage**: 80% minimum for P0 components
- **Focus**: User interactions, accessibility, responsive design

### Integration Testing
- **Framework**: Playwright
- **Scope**: API endpoints, database operations, real-time features
- **Coverage**: All P0 API endpoints

### End-to-End Testing
- **Framework**: Playwright
- **Scope**: Critical user journeys
- **Coverage**: Draft flow, league creation, Oracle predictions

### Performance Testing
- **Tools**: Lighthouse, WebPageTest
- **Metrics**: Core Web Vitals compliance
- **Targets**: < 3s load time, > 90 performance score

---

## Quality Gates

### Feature Completion Criteria
1. ✅ **Functional Parity**: All v3 features replicated
2. ✅ **Performance**: Meets or exceeds v3 performance
3. ✅ **Accessibility**: WCAG 2.1 AA compliance
4. ✅ **Mobile**: Touch-optimized and responsive
5. ✅ **Testing**: 80% test coverage for P0 features

### Release Criteria
1. ✅ **All P0 features complete and tested**
2. ✅ **Performance benchmarks met**
3. ✅ **Security audit passed**
4. ✅ **Accessibility audit passed**
5. ✅ **Load testing completed**
6. ✅ **Data migration validated**

---

## Risk Mitigation

### High-Risk Items
1. **Real-time Features**: WebSocket integration complexity
   - *Mitigation*: Early prototype and testing
2. **Data Migration**: Complex relationships and large datasets
   - *Mitigation*: Incremental migration with rollback plan
3. **Oracle ML Models**: Complex AI/ML integration
   - *Mitigation*: Modular architecture with fallback options
4. **Mobile Performance**: Complex features on mobile devices
   - *Mitigation*: Progressive enhancement approach

### Contingency Plans
1. **Feature Rollback**: Ability to disable features without deployment
2. **Database Rollback**: Point-in-time recovery for data issues
3. **API Fallback**: Graceful degradation for external service failures
4. **Performance Fallback**: Simplified interfaces for slow connections

---

This parity map serves as the definitive guide for the v4 migration, ensuring no features are lost and providing clear implementation paths for all development work.