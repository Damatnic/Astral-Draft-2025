# Astral Draft v4 Feature Inventory Report

## Executive Summary

Astral Draft is a sophisticated fantasy football application with AI-powered predictions and analytics. The current codebase represents a comprehensive fantasy sports platform with advanced features including real-time draft rooms, AI coaching, machine learning predictions (Oracle), social interactions, mobile optimization, and extensive analytics.

### Key Statistics
- **Total Views**: 50+ distinct application views
- **Component Count**: 300+ React components
- **Services**: 70+ backend services
- **API Routes**: 15+ distinct route groups
- **Database Tables**: 15+ core tables with extensive relationships
- **Mobile Components**: 20+ mobile-specific optimized components
- **Tech Stack**: React 19, TypeScript, Node.js, Express, SQLite/PostgreSQL, Vite, Tailwind CSS

---

## Complete Feature Matrix

### Core Fantasy Football Features

#### 1. League Management (P0 - Critical)
- **League Creation Wizard**: Multi-step league setup with customizable settings
- **Enhanced League Creation**: ML-powered league setup with intelligent defaults
- **League Settings Editor**: Comprehensive scoring, roster, and rule configuration
- **League Invitation System**: Email invitations with shareable links
- **Commissioner Tools**: Advanced league administration interface
- **Season Management**: Multi-season support with archival
- **League Constitution**: Customizable rules and bylaws system
- **League History**: Historical data tracking and visualization

**Acceptance Criteria**:
- Create leagues with 4-16 teams
- Configure scoring systems (Standard, PPR, Half-PPR, Custom)
- Set draft formats (Snake, Auction, Linear)
- Manage playoff brackets (4-team, 6-team)
- Handle waiver systems (FAAB, Rolling List, Daily)

#### 2. Draft System (P0 - Critical)
- **Live Draft Room**: Real-time multiplayer drafting with WebSocket support
- **Snake Draft**: Traditional serpentine draft format
- **Auction Draft**: Bidding-based player acquisition
- **Mock Draft System**: Practice drafting against AI opponents
- **Draft Preparation Center**: Research and ranking tools
- **AI Draft Coach**: Real-time pick recommendations and analysis
- **Draft Simulation Engine**: Advanced draft scenario modeling
- **Draft Commentary**: AI-generated pick analysis and narrative
- **Draft Board**: Visual draft tracking and pick history
- **Auto-Pick System**: Automated drafting for absent managers

**Acceptance Criteria**:
- Support 8-16 team drafts
- Real-time synchronization across all participants
- Draft timer with configurable durations
- Queue management and auto-pick functionality
- Draft recap and analysis generation

#### 3. Team Management (P0 - Critical)
- **Roster Management**: Starting lineup and bench management
- **Lineup Optimizer**: AI-powered optimal lineup suggestions
- **Waiver Wire**: Free agent acquisition system
- **Trade Center**: Proposal, negotiation, and analysis tools
- **Player Research**: Comprehensive player information and analytics
- **Start/Sit Tool**: Weekly lineup decision assistance
- **Injury Tracking**: Real-time injury status monitoring
- **Team Branding**: Custom logos, colors, and team identity

**Acceptance Criteria**:
- Set weekly lineups with position requirements
- Process waiver claims with priority systems
- Execute trades with league approval workflows
- Track player performance and projections

#### 4. Matchup System (P0 - Critical)
- **Weekly Matchups**: Head-to-head scoring competitions
- **Live Scoring**: Real-time score updates during games
- **Matchup Analysis**: Pre-game matchup previews and predictions
- **Playoff Bracket**: Tournament-style playoff management
- **Championship Tracking**: Championship odds and projections
- **Power Rankings**: Algorithm-based team strength rankings

**Acceptance Criteria**:
- Generate weekly schedules for entire season
- Calculate scores based on player performance
- Handle playoff seeding and bracket advancement
- Provide real-time score updates during NFL games

### Advanced Analytics & AI Features

#### 5. Oracle Prediction System (P0 - Critical)
- **AI Predictions**: Machine learning-powered performance forecasts
- **Beat the Oracle**: User vs AI prediction competition
- **Oracle Dashboard**: Comprehensive prediction analytics
- **Real-time Predictions**: Live game and player predictions
- **Oracle Leaderboard**: User accuracy tracking and rankings
- **Oracle Education**: Prediction methodology and insights
- **Oracle Rewards**: Point-based achievement system
- **Ensemble ML**: Multiple model prediction aggregation

**Acceptance Criteria**:
- Generate weekly player performance predictions
- Provide confidence intervals for predictions
- Track prediction accuracy over time
- Offer multiple prediction models (Neural Networks, Statistical, Bayesian)

#### 6. Advanced Analytics (P1 - High Priority)
- **Performance Trends**: Historical player and team analysis
- **Seasonal Trends**: Multi-season performance tracking
- **Real-time Analytics**: Live game impact analysis
- **Championship Odds**: Dynamic probability calculations
- **Player Comparison**: Head-to-head player analysis
- **Market Inefficiency Detection**: Value opportunity identification
- **Correlation Analysis**: Player performance relationships

**Acceptance Criteria**:
- Generate visualizations for all analytics
- Provide exportable reports
- Update analytics in real-time during games
- Support multi-season historical analysis

### Social & Communication Features

#### 7. Social Hub (P1 - High Priority)
- **League Chat**: Real-time messaging system
- **Trade Negotiations**: In-app trade discussion
- **Direct Messaging**: Private user communications
- **Social Feed**: Activity stream and updates
- **Rivalry Tracking**: Head-to-head rivalry narratives
- **Side Bets**: Custom wager system between users
- **League Polls**: Community voting and surveys
- **Announcements**: Commissioner communication system

**Acceptance Criteria**:
- Support real-time messaging with 100+ concurrent users
- Enable emoji reactions and mentions
- Track conversation threads
- Moderate content and prevent spam

#### 8. Content Generation (P1 - High Priority)
- **Weekly Reports**: AI-generated league summaries
- **Season Reviews**: End-of-season narrative reports
- **League Newspaper**: Custom league publication
- **Draft Stories**: Narrative draft recaps
- **Season Stories**: Ongoing season storytelling
- **Player Stories**: Individual player narratives
- **Recap Videos**: Automated video content generation

**Acceptance Criteria**:
- Generate coherent narrative content
- Include relevant statistics and highlights
- Support multiple content formats
- Enable sharing and export functionality

### Mobile & Accessibility Features

#### 9. Mobile Optimization (P1 - High Priority)
- **Mobile-First Design**: Responsive layouts for all screen sizes
- **Touch Gestures**: Swipe navigation and interactions
- **Offline Support**: PWA with offline functionality
- **Push Notifications**: Real-time mobile alerts
- **Mobile Draft Interface**: Touch-optimized drafting
- **Pull-to-Refresh**: Mobile data refresh patterns
- **Bottom Navigation**: Mobile-friendly navigation
- **Install Prompt**: PWA installation guidance

**Acceptance Criteria**:
- Support screen sizes from 320px to 2560px
- Maintain 60fps animations on mobile devices
- Work offline with data synchronization
- Send push notifications for key events

#### 10. Accessibility (P1 - High Priority)
- **Screen Reader Support**: ARIA compliance and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast Mode**: Visual accessibility options
- **Text Scaling**: Adjustable font sizes
- **Reduced Motion**: Animation preferences
- **Focus Management**: Logical tab order and focus indicators
- **Color Contrast**: WCAG 2.1 AA compliance

**Acceptance Criteria**:
- Pass WCAG 2.1 AA accessibility standards
- Support screen readers (NVDA, JAWS, VoiceOver)
- Enable full keyboard navigation
- Provide accessibility preferences

### Administrative Features

#### 11. Commissioner Tools (P1 - High Priority)
- **League Settings Management**: Real-time setting adjustments
- **Member Management**: User invitation and removal
- **Transaction Oversight**: Trade and waiver oversight
- **Scoring Adjustments**: Manual score corrections
- **Schedule Management**: Custom schedule creation
- **Payout Management**: Prize distribution tracking
- **Award Assignment**: Custom achievement system
- **Poll Creation**: League voting systems

**Acceptance Criteria**:
- Support all league configuration changes
- Enable mid-season rule adjustments
- Track all administrative actions
- Provide audit trails for decisions

#### 12. Financial Management (P2 - Medium Priority)
- **Finance Tracker**: League dues and payout tracking
- **Payment Integration**: Stripe integration for payments
- **Keeper Selection**: Multi-season player retention
- **FAAB Management**: Auction budget tracking
- **Due Tracking**: Payment status monitoring
- **Payout Distribution**: Automated prize distribution

**Acceptance Criteria**:
- Process secure payments via Stripe
- Track all financial transactions
- Generate financial reports
- Handle refunds and disputes

### Data & Integration Features

#### 13. Real-time Data (P0 - Critical)
- **Live NFL Data**: Real-time game scores and statistics
- **Player Status Updates**: Injury and status tracking
- **Weather Integration**: Game weather conditions
- **News Integration**: Player news and updates
- **Odds Integration**: Betting lines and game odds
- **Social Media Integration**: Player social updates

**Acceptance Criteria**:
- Update data within 30 seconds of real events
- Support multiple data providers
- Handle API failures gracefully
- Cache data for performance

#### 14. Performance & Monitoring (P1 - High Priority)
- **Performance Monitoring**: Application performance tracking
- **Error Tracking**: Automated error reporting
- **Analytics Dashboard**: Usage and performance metrics
- **Load Testing**: Scalability validation
- **Caching System**: Multi-layer caching strategy
- **Database Optimization**: Query optimization and indexing

**Acceptance Criteria**:
- Support 1000+ concurrent users
- Maintain sub-second response times
- Achieve 99.9% uptime
- Handle traffic spikes gracefully

### Security Features

#### 15. Authentication & Security (P0 - Critical)
- **Multi-factor Authentication**: Enhanced security options
- **OAuth Integration**: Social login support
- **Session Management**: Secure session handling
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API abuse prevention
- **Input Sanitization**: XSS attack prevention
- **SQL Injection Protection**: Database security
- **Encryption**: Data encryption at rest and in transit

**Acceptance Criteria**:
- Support MFA via SMS, email, and authenticator apps
- Comply with OWASP security standards
- Encrypt all sensitive data
- Pass security audits and penetration testing

---

## Routes and Pages Catalog

### Main Application Views
1. **DASHBOARD** - Main user dashboard with league overview
2. **LEAGUE_HUB** - League-specific homepage and navigation
3. **TEAM_HUB** - Individual team management center
4. **ANALYTICS_HUB** - Comprehensive analytics dashboard
5. **REALTIME_ANALYTICS** - Live game and prediction analytics
6. **HISTORICAL_ANALYTICS** - Multi-season historical analysis

### League Management Views
7. **CREATE_LEAGUE** - Multi-step league creation wizard
8. **EDIT_LEAGUE_SETTINGS** - League configuration management
9. **LEAGUE_STANDINGS** - Current standings and records
10. **LEAGUE_STATS** - League-wide statistics and records
11. **LEAGUE_HISTORY** - Multi-season league history
12. **LEAGUE_RULES** - League constitution and rules
13. **LEAGUE_CONSTITUTION** - Formal league bylaws
14. **OPEN_LEAGUES** - Public league discovery and joining

### Draft Views
15. **DRAFT_ROOM** - Live draft interface
16. **LIVE_DRAFT_ROOM** - Enhanced real-time draft room
17. **DRAFT_PREP_CENTER** - Pre-draft research and preparation
18. **DRAFT_STORY** - Post-draft narrative and analysis

### Team Management Views
19. **EDIT_ROSTER** - Roster and lineup management
20. **WAIVER_WIRE** - Free agent acquisition
21. **START_SIT_TOOL** - Lineup optimization assistance
22. **KEEPER_SELECTION** - Multi-season player retention

### Competition Views
23. **MATCHUP** - Weekly head-to-head matchups
24. **POWER_RANKINGS** - Algorithm-based team rankings
25. **PLAYOFF_BRACKET** - Tournament bracket management
26. **CHAMPIONSHIP_ODDS** - Dynamic championship probabilities
27. **PROJECTED_STANDINGS** - Season-end projections
28. **LEADERBOARD** - Various leaderboards and rankings

### Oracle/AI Views
29. **BEAT_THE_ORACLE** - User vs AI prediction competition
30. **SEASON_CONTESTS** - Ongoing prediction contests

### Social Views
31. **MESSAGES** - Direct messaging and league chat
32. **SOCIAL_HUB** - Social activity feed
33. **LEAGUE_NEWSPAPER** - AI-generated league content

### Reporting Views
34. **WEEKLY_REPORT** - Weekly league summaries
35. **WEEKLY_RECAP_VIDEO** - Video content generation
36. **SEASON_REVIEW** - End-of-season analysis
37. **SEASON_STORY** - Narrative season recaps
38. **SEASON_ARCHIVE** - Historical season access
39. **PERFORMANCE_TRENDS** - Long-term performance analysis

### Administrative Views
40. **COMMISSIONER_TOOLS** - League administration interface
41. **SCHEDULE_MANAGEMENT** - Custom schedule creation
42. **CUSTOM_SCORING_EDITOR** - Scoring system configuration
43. **FINANCE_TRACKER** - Financial management
44. **GAMEDAY_HOST** - Live game day management

### Utility Views
45. **PROFILE** - User profile management
46. **MANAGER_PROFILE** - Public manager profiles
47. **ASSISTANT** - AI assistant interface
48. **TROPHY_ROOM** - Achievement and awards display
49. **TEAM_COMPARISON** - Head-to-head team analysis
50. **AUTH** - Authentication and login

---

## API Endpoints Documentation

### Authentication Routes (`/api/auth`)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/profile` - User profile retrieval
- `PUT /api/auth/profile` - Profile updates
- `POST /api/auth/forgot-password` - Password reset initiation
- `POST /api/auth/reset-password` - Password reset completion
- `POST /api/auth/verify-email` - Email verification

### Enhanced Authentication (`/api/enhanced-auth`)
- `POST /api/enhanced-auth/mfa/setup` - Multi-factor authentication setup
- `POST /api/enhanced-auth/mfa/verify` - MFA verification
- `GET /api/enhanced-auth/sessions` - Active session management
- `DELETE /api/enhanced-auth/sessions/:id` - Session termination

### League Management (`/api/leagues`)
- `GET /api/leagues` - User's leagues list
- `POST /api/leagues` - League creation
- `GET /api/leagues/:id` - League details
- `PUT /api/leagues/:id` - League settings update
- `DELETE /api/leagues/:id` - League deletion
- `POST /api/leagues/:id/join` - League membership
- `POST /api/leagues/:id/invite` - Member invitation
- `GET /api/leagues/:id/members` - Member list
- `PUT /api/leagues/:id/members/:userId` - Member management

### Oracle Prediction (`/api/oracle`)
- `GET /api/oracle/predictions` - Prediction retrieval
- `POST /api/oracle/predictions` - Prediction submission
- `GET /api/oracle/leaderboard` - User rankings
- `GET /api/oracle/analytics` - Prediction analytics
- `POST /api/oracle/train` - Model training data
- `GET /api/oracle/accuracy` - Model accuracy metrics

### Analytics (`/api/analytics`)
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/trends` - Trend analysis
- `GET /api/analytics/championship-odds` - Championship probabilities
- `GET /api/analytics/player-comparison` - Player comparisons
- `GET /api/analytics/market-inefficiency` - Value opportunities

### Social Features (`/api/social`)
- `GET /api/social/messages` - Message retrieval
- `POST /api/social/messages` - Message sending
- `GET /api/social/feed` - Activity feed
- `POST /api/social/reactions` - Emoji reactions
- `GET /api/social/polls` - League polls
- `POST /api/social/polls` - Poll creation

### Real-time Sync (`/api/sync`)
- `GET /api/sync/league/:id` - League data synchronization
- `POST /api/sync/draft/:id` - Draft state updates
- `GET /api/sync/scores` - Live scoring updates

### Payment (`/api/payment`)
- `POST /api/payment/create-intent` - Payment initiation
- `GET /api/payment/status/:id` - Payment status
- `POST /api/payment/refund` - Refund processing

---

## Component Inventory by Category

### Core Layout Components (15)
- `MainLayout` - Primary application layout
- `MobileLayout` - Mobile-optimized layout
- `MobileLayoutWrapper` - Mobile wrapper component
- `Header` - Application header
- `MobileNavigation` - Mobile navigation menu
- `MobileBottomNavigation` - Bottom navigation bar
- `Breadcrumbs` - Navigation breadcrumbs
- `CommandPalette` - Quick action interface
- `ErrorBoundary` - Error handling wrapper
- `SuspenseLoader` - Loading state component
- `InstallPrompt` - PWA installation prompt
- `ModernLoader` - Enhanced loading animations
- `ThemeToggle` - Dark/light mode toggle
- `VoiceCommandButton` - Voice interaction control
- `NotificationManager` - Global notification system

### Form & Input Components (12)
- `Modal` - Base modal component
- `AccessibleModal` - WCAG-compliant modal
- `CreateLeagueModal` - League creation form
- `EnhancedCreateLeagueModal` - Advanced league setup
- `MockDraftModal` - Mock draft configuration
- `SettingsModal` - User preferences
- `PreferencesModal` - Application settings
- `EditProfileModal` - Profile editing
- `EditTeamBrandingModal` - Team customization
- `CustomizeDashboardModal` - Dashboard configuration
- `AddPlayerModal` - Player addition form
- `InviteMemberModal` - Member invitation form

### Player & Team Components (25)
- `PlayerCard` - Individual player display
- `MobilePlayerCard` - Mobile-optimized player card
- `PlayerDetailModal` - Comprehensive player information
- `EnhancedPlayerDetailModal` - Advanced player analysis
- `PlayerPool` - Available players list
- `PlayerResearchInterface` - Player research tools
- `SimilarPlayersPopup` - Player comparison overlay
- `PlayerComparisonTool` - Side-by-side comparison
- `PlayerProfileView` - Full player profile
- `VisualRoster` - Graphical roster display
- `TeamColumn` - Draft board team column
- `TeamCard` - Team summary display
- `TeamBrandingCard` - Team identity display
- `LeagueTeamsList` - All teams overview
- `TeamComparisonCard` - Head-to-head comparison
- `PowerRankingCard` - Team ranking display
- `PowerRankingCardSkeleton` - Loading placeholder
- `TeamAnalyticsDashboard` - Team performance metrics
- `TeamChemistryWidget` - Team synergy analysis
- `EnhancedRosterManager` - Advanced roster tools
- `AiCoManagerWidget` - AI coaching assistance
- `DailyBriefingWidget` - Daily team insights
- `SeasonOutlookWidget` - Season predictions
- `TrophyCaseWidget` - Achievement display
- `MascotWidget` - Team mascot management

### Draft Components (18)
- `DraftRoom` - Main draft interface
- `EnhancedSnakeDraftRoom` - Advanced snake draft
- `DraftBoard` - Visual draft board
- `AuctionPanel` - Auction draft interface
- `AuctionBlock` - Current auction display
- `MyRosterPanel` - User's draft picks
- `AiCoPilotPanel` - AI draft assistance
- `DraftCompleteOverlay` - Draft completion screen
- `LiveDraftLog` - Real-time draft activity
- `TurnTimer` - Draft pick countdown
- `DraftSimulationDemo` - Practice draft interface
- `DraftSimulationInterface` - Simulation controls
- `EnhancedAiDraftCoach` - Advanced AI coaching
- `DraftPreparationInterface` - Pre-draft tools
- `MockDraftHistory` - Past mock drafts
- `MyRankingsEditor` - Custom player rankings
- `DraftGradeCard` - Post-draft analysis
- `DraftRecap` - Draft summary report

### Analytics Components (20)
- `AnalyticsPanel` - Base analytics display
- `AnalyticsComponents` - Shared analytics elements
- `AdvancedAnalyticsDashboard` - Comprehensive analytics
- `EnhancedAnalyticsDashboard` - Enhanced analytics view
- `RealTimeAnalyticsDashboard` - Live analytics
- `MLAnalyticsDashboard` - Machine learning analytics
- `OracleAnalyticsDashboard` - Oracle-specific analytics
- `AdvancedOracleAnalyticsDashboard` - Advanced Oracle analytics
- `ChampionshipOddsPreview` - Championship probability preview
- `ChampionshipProbChart` - Championship odds visualization
- `MyTeamCompositionChart` - Team makeup analysis
- `PositionalScarcityChart` - Position value visualization
- `PlayerPerformanceChart` - Individual performance trends
- `SeasonalTrendsChart` - Multi-season analysis
- `WeeklyScoreChart` - Weekly scoring patterns
- `MatchupTrendChart` - Head-to-head trends
- `MatchupTrendChartFixed` - Corrected trend analysis
- `PickTimeAnalytics` - Draft timing analysis
- `TeamNeedsAnalysis` - Roster need identification
- `CompareTray` - Comparison widget container

### Oracle/AI Components (25)
- `OraclePanel` - Main Oracle interface
- `ConversationalOracle` - Chat-based Oracle
- `OracleRealTimePredictionInterface` - Live predictions
- `OptimizedOracleRealTimePredictionInterface` - Performance-optimized predictions
- `OracleRealTimeDashboard` - Real-time Oracle dashboard
- `OraclePerformanceDashboard` - Oracle performance metrics
- `OracleLeaderboard` - Oracle competition rankings
- `OracleRewardsDashboard` - Oracle rewards system
- `OracleUserDashboard` - User-specific Oracle data
- `OracleDashboardContainer` - Oracle dashboard wrapper
- `EnhancedOracleMLDashboard` - ML-enhanced Oracle interface
- `AdvancedEnsembleMLDashboard` - Advanced ML dashboard
- `EnsembleMLWidget` - ML ensemble predictions
- `TrainingDataManager` - ML training data management
- `TrainingDataManagerNew` - Updated training interface
- `UserStatsWidget` - User Oracle statistics
- `RealtimeUpdatesWidget` - Live Oracle updates
- `PredictionCard` - Individual prediction display
- `PredictionDetail` - Detailed prediction view
- `OracleBeginnerTutorial` - Oracle education component
- `OracleArchitectureOverview` - Oracle system explanation
- `OracleCacheDashboard` - Oracle caching metrics
- `MLPredictionDashboard` - ML prediction interface
- `NotificationCenter` - Oracle notifications
- `NotificationDemo` - Notification examples

### Mobile-Specific Components (15)
- `MobileOptimizedOracleInterface` - Mobile Oracle interface
- `EnhancedMobileOracleInterface` - Advanced mobile Oracle
- `MobileOracleInterface` - Base mobile Oracle
- `MobileAnalyticsDashboard` - Mobile analytics
- `MobileDraftInterface` - Mobile draft tools
- `MobilePlayerSearch` - Mobile player search
- `MobileSearchInterface` - Mobile search interface
- `MobileGestureNavigation` - Gesture-based navigation
- `MobilePullToRefresh` - Pull-to-refresh pattern
- `MobileOfflineIndicator` - Offline status indicator
- `PWAInstallPrompt` - Progressive Web App installer
- `MobileNavMenu` - Mobile navigation menu
- `EnhancedMobileNav` - Advanced mobile navigation
- `MobileResponsiveNav` - Responsive mobile navigation
- `AccessibleMobileComponents` - Mobile accessibility components

### Social & Communication Components (15)
- `ChatPanel` - League chat interface
- `ConversationList` - Message conversations
- `MessageThread` - Individual conversation
- `TradeNegotiationChat` - Trade-specific chat
- `SocialFeed` - Activity feed display
- `SocialHub` - Social feature hub
- `SocialTab` - Social navigation tab
- `CommunityHubIntegration` - Community features
- `ReactionPicker` - Emoji reaction selector
- `TradeEventMessage` - Trade-related messages
- `TeamStoryBuilder` - Team narrative creation
- `LeagueHistoryViewer` - Historical league browser
- `RivalryWidget` - Rivalry tracking display
- `SideBetsWidget` - Side bet management
- `WeeklyPollWidget` - League polling system

### Widget & Dashboard Components (30)
- `Widget` - Base widget component
- `ActivityFeedWidget` - Activity stream
- `WhatsNextWidget` - Upcoming events
- `PerformanceMetricsWidget` - Performance tracking
- `OnTheHotSeatWidget` - Underperforming teams
- `PowerBalanceChart` - League power distribution
- `ChampionshipOddsWidget` - Championship probabilities
- `CurrentMatchupWidget` - Current week matchup
- `InjuryReportWidget` - Injury status updates
- `WaiverIntelligenceWidget` - Waiver recommendations
- `TradeBlockWidget` - Available trades
- `TradeCenterWidget` - Trade management
- `TradeWhispererWidget` - Trade suggestions
- `StartSitWidget` - Lineup recommendations
- `WatchlistWidget` - Player watchlist
- `FuturePicksWidget` - Draft pick management
- `LineupOptimizer` - Optimal lineup calculator
- `MatchupAnalysisWidget` - Matchup preview
- `WeeklyReportDisplay` - Weekly summary
- `SeasonReviewDisplay` - Season analysis
- `RecapVideoPlayer` - Video content player
- `AnnouncementsWidget` - League announcements
- `LiveEventTicker` - Real-time game events
- `InjuryDashboard` - Injury tracking
- `CrisisInterventionWidget` - Mental health support
- `AchievementsWidget` - User achievements
- `MatchupScoreboard` - Live scoring display
- `BriefingItemCard` - Daily briefing items
- `StoryHighlightCard` - Story highlights
- `NewsAndUpdatesTab` - News integration

### UI & Utility Components (35)
- `Avatar` - User avatar display
- `Badge` - Status badges
- `Card` - Base card component
- `EmptyState` - Empty data placeholder
- `LoadingSpinner` - Loading animations
- `Progress` - Progress indicators
- `Tabs` - Tab navigation
- `ShadcnTabs` - Enhanced tab component
- `Tooltip` - Hover information
- `ToggleSwitch` - Boolean input control
- `Navigation` - Primary navigation
- `Notification` - Individual notifications
- `NotificationToast` - Toast notifications
- `NotificationBell` - Notification indicator
- `TeamSwitcher` - Team selection
- `RadialChart` - Circular data visualization
- `SparklineChart` - Compact trend lines
- `StatChart` - Statistical data display
- `LazyImage` - Performance-optimized images
- `LeagueCard` - League summary card
- `NewsTicker` - Scrolling news display
- `AnimatedNumber` - Animated number transitions
- `AccessibleButton` - WCAG-compliant buttons
- `PullToRefresh` - Pull-to-refresh implementation
- `VirtualComponents` - Virtual scrolling
- `MobilePatterns` - Mobile UI patterns
- `MobilePatternsSimple` - Simplified mobile patterns
- `GroundingCitations` - AI citation display
- `InstallPrompt` - App installation prompt
- `SkeletonLoader` - Content loading placeholders
- `ModernErrorBoundary` - Enhanced error handling
- `ErrorDisplay` - Error message display
- `Counter` - Numeric counter component
- `OutputArea` - Content output display
- `OutputGrid` - Grid-based output layout

---

## State Management Patterns

### Context Providers
1. **AppContext** - Global application state management
2. **AuthContext** - Authentication state and user management
3. **ProductionAuthContext** - Production authentication
4. **SimpleAuthContext** - Basic authentication
5. **NotificationContext** - Notification state management
6. **PaymentContext** - Payment processing state

### State Structure
The application uses a centralized state management pattern with the following key state categories:

#### User State
- User profile and preferences
- Authentication status
- Theme and accessibility settings
- League memberships

#### League State
- Active league selection
- League settings and rules
- Member information
- Season and schedule data

#### Draft State
- Draft room connection status
- Pick timers and turn management
- AI recommendations
- Draft history and commentary

#### Player State
- Player pool and search
- Watchlists and notes
- Injury tracking
- Performance projections

#### Real-time State
- Live scoring updates
- Chat messages
- Notification queue
- WebSocket connections

---

## Data Models and Relationships

### Core Entities

#### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  persona: Persona;
  memberSince: number;
  badges: Badge[];
}
```

#### League
```typescript
interface League {
  id: string;
  name: string;
  settings: LeagueSettings;
  status: LeagueStatus;
  members: User[];
  teams: Team[];
  schedule: Matchup[];
  currentWeek: number;
  history: LeagueHistoryEntry[];
}
```

#### Team
```typescript
interface Team {
  id: number;
  name: string;
  owner: User;
  roster: Player[];
  record: TeamRecord;
  budget: number;
  faab: number;
  draftGrade: DraftGrade;
}
```

#### Player
```typescript
interface Player {
  id: number;
  name: string;
  position: PlayerPosition;
  team: string;
  stats: PlayerStats;
  projections: WeeklyProjections;
  injuryHistory: InjuryReport[];
}
```

### Database Schema

#### Primary Tables
1. **users** - User accounts and profiles
2. **leagues** - League configurations and settings
3. **league_members** - League membership relationships
4. **fantasy_teams** - Team information and records
5. **nfl_players** - NFL player database
6. **draft_picks** - Draft history and picks
7. **matchups** - Weekly head-to-head competitions
8. **transactions** - Trades, waivers, and moves
9. **player_stats** - Historical player statistics
10. **oracle_predictions** - AI prediction data
11. **messages** - Chat and communication
12. **notifications** - System notifications
13. **payments** - Financial transactions
14. **user_sessions** - Authentication sessions
15. **cache_entries** - Performance caching

#### Relationships
- Users → League Members (Many-to-Many)
- Leagues → Teams (One-to-Many)
- Teams → Players (Many-to-Many through Roster)
- Leagues → Matchups (One-to-Many)
- Users → Messages (One-to-Many)
- Players → Stats (One-to-Many)
- Users → Oracle Predictions (One-to-Many)

---

## Third-Party Integrations

### AI & Machine Learning
1. **Google Gemini AI** - Player analysis and content generation
   - Configuration: `VITE_GEMINI_API_KEY`
   - Usage: Oracle predictions, content generation, chat responses
   - Rate Limits: 60 requests/minute (free tier)

### Sports Data Providers
2. **Sports.io API** - Real-time NFL data and statistics
   - Configuration: `VITE_SPORTS_IO_API_KEY`
   - Usage: Live scores, player stats, injury reports
   - Rate Limits: 1,000 requests/month (free tier)

3. **ESPN API** - Fantasy projections and news (Optional)
   - Configuration: `VITE_ESPN_API_KEY`
   - Usage: Player projections, news feeds
   - Status: Partnership required

4. **NFL API** - Official NFL data (Optional)
   - Configuration: `VITE_NFL_API_KEY`
   - Usage: Official game data and statistics
   - Status: Application required

5. **The Odds API** - Betting lines and game odds (Optional)
   - Configuration: `VITE_ODDS_API_KEY`
   - Usage: Championship odds, game predictions
   - Rate Limits: 500 requests/month (free tier)

### Payment Processing
6. **Stripe** - Payment processing and financial transactions
   - Configuration: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`
   - Usage: League dues, premium features
   - Features: Subscriptions, one-time payments, refunds

### Authentication
7. **OAuth Providers** - Social authentication
   - Google OAuth
   - Facebook OAuth
   - Twitter OAuth
   - Apple OAuth (iOS)

### Communication
8. **Email Services** - Transactional emails
   - Nodemailer integration
   - SMTP configuration
   - Templates for invitations, notifications

### Infrastructure
9. **Neon Database** - PostgreSQL hosting
   - Configuration: `DATABASE_URL`
   - Features: Serverless scaling, automatic backups

10. **Netlify** - Frontend hosting and deployment
    - Configuration: Environment variables via Netlify UI
    - Features: CDN, serverless functions, form handling

### Real-time Features
11. **WebSocket Integration** - Real-time updates
    - Socket.io for draft rooms
    - Live scoring updates
    - Chat functionality

### Mobile Features
12. **PWA APIs** - Progressive Web App features
    - Push Notifications API
    - Service Worker for offline support
    - Install prompts and app-like behavior

---

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# API Keys
VITE_GEMINI_API_KEY=AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxx
VITE_SPORTS_IO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Authentication & Security
JWT_SECRET=64-character-hex-string
COOKIE_SECRET=another-64-character-hex-string
SESSION_SECRET=yet-another-64-character-hex-string

# Application
NODE_ENV=production|development
PORT=3001
VITE_API_BASE_URL=https://api.astraldraft.com
```

### Optional Variables
```bash
# Additional APIs
VITE_ESPN_API_KEY=optional-espn-key
VITE_NFL_API_KEY=optional-nfl-key
VITE_ODDS_API_KEY=optional-odds-key

# Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@astraldraft.com
SMTP_PASS=email-password

# OAuth Configuration
GOOGLE_CLIENT_ID=google-oauth-client-id
GOOGLE_CLIENT_SECRET=google-oauth-secret
FACEBOOK_APP_ID=facebook-app-id
FACEBOOK_APP_SECRET=facebook-app-secret

# Deployment
NETLIFY_SITE_ID=netlify-site-id
NETLIFY_AUTH_TOKEN=netlify-auth-token
```

### Security Configuration
```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# CORS
CORS_ORIGIN=https://astraldraft.com
CORS_CREDENTIALS=true

# SSL/Security
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
TRUST_PROXY=1
```

---

## Background Jobs and Scheduled Tasks

### Cron Jobs
1. **Score Updates** (Every 5 minutes during NFL games)
   - Fetches live NFL scores
   - Updates fantasy team scores
   - Triggers real-time notifications

2. **Player Status Updates** (Every 15 minutes)
   - Checks injury reports
   - Updates player availability
   - Sends injury alerts

3. **Oracle Predictions** (Daily at 6 AM)
   - Generates weekly predictions
   - Updates machine learning models
   - Calculates accuracy metrics

4. **Weekly Reports** (Tuesdays at 8 AM)
   - Generates league summaries
   - Creates narrative content
   - Sends email reports

5. **Database Cleanup** (Daily at 2 AM)
   - Cleans expired sessions
   - Purges old cache entries
   - Archives completed seasons

6. **Waiver Processing** (Wednesdays at 3 AM)
   - Processes waiver claims
   - Updates roster moves
   - Sends transaction notifications

7. **Backup Tasks** (Daily at 1 AM)
   - Database backups
   - File system backups
   - Backup verification

### WebSocket Services
1. **Draft Room Server** - Real-time draft updates
2. **Chat Server** - Live messaging
3. **Score Updates** - Live game scoring
4. **Notification Service** - Real-time alerts

### Queue Processing
1. **Email Queue** - Asynchronous email sending
2. **Notification Queue** - Push notification processing
3. **Analytics Queue** - Performance data processing
4. **Report Generation** - Background report creation

---

## Security Features and Authentication Flows

### Authentication Methods
1. **Email/Password** - Traditional authentication
2. **Multi-Factor Authentication** - SMS/Email/App-based 2FA
3. **OAuth Integration** - Social login providers
4. **Session Management** - Secure session handling
5. **Remember Me** - Persistent login tokens

### Security Measures
1. **Input Sanitization** - XSS prevention
2. **SQL Injection Protection** - Parameterized queries
3. **CSRF Protection** - Token-based protection
4. **Rate Limiting** - API abuse prevention
5. **Encryption** - Data encryption at rest and in transit
6. **Session Security** - Secure cookie configuration
7. **Content Security Policy** - XSS mitigation
8. **HTTPS Enforcement** - SSL/TLS encryption

### Authorization Patterns
1. **Role-Based Access Control (RBAC)**
   - Commissioner privileges
   - League member permissions
   - Admin access controls

2. **Resource-Based Permissions**
   - Team ownership verification
   - League membership validation
   - Draft participation rights

3. **API Authentication**
   - JWT token validation
   - API key verification
   - Rate limit enforcement

### Authentication Flow
1. **Login Process**
   - Credential validation
   - Session creation
   - Security event logging
   - Multi-factor verification (if enabled)

2. **Session Management**
   - Token refresh handling
   - Concurrent session limits
   - Session invalidation
   - Security monitoring

3. **Logout Process**
   - Session termination
   - Token invalidation
   - Security cleanup
   - Audit logging

---

## Mobile vs Desktop Specific Features

### Mobile-Specific Features
1. **Touch Gestures**
   - Swipe navigation between views
   - Pull-to-refresh data updates
   - Long-press context menus
   - Pinch-to-zoom on charts

2. **Mobile Navigation**
   - Bottom tab navigation
   - Hamburger menu for secondary features
   - Swipe-back gesture support
   - Touch-optimized button sizes (44px minimum)

3. **Offline Support**
   - Service Worker for offline functionality
   - Local data caching with IndexedDB
   - Offline queue for actions
   - Background sync when reconnected

4. **Push Notifications**
   - Draft pick reminders
   - Trade offer alerts
   - Game score updates
   - Injury notifications

5. **PWA Features**
   - Install prompt for home screen
   - App-like behavior when installed
   - Standalone display mode
   - Custom splash screen

6. **Mobile Performance**
   - Lazy loading for images and components
   - Virtual scrolling for large lists
   - Optimized bundle splitting
   - Touch delay elimination

7. **Mobile Accessibility**
   - Screen reader optimization
   - Voice control support
   - High contrast mode
   - Text scaling support

### Desktop-Specific Features
1. **Advanced Layouts**
   - Multi-column dashboards
   - Sidebar navigation
   - Resizable panels
   - Tabbed interfaces

2. **Keyboard Navigation**
   - Full keyboard accessibility
   - Hotkey shortcuts
   - Tab order management
   - Focus indicators

3. **Advanced Interactions**
   - Hover states and tooltips
   - Right-click context menus
   - Drag-and-drop functionality
   - Multi-select operations

4. **Data Visualization**
   - Complex charts and graphs
   - Interactive analytics
   - Detailed comparison tables
   - Advanced filtering

5. **Productivity Features**
   - Multiple window support
   - Split-screen comparisons
   - Bulk operations
   - Advanced search and filtering

### Responsive Design Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large Desktop**: 1440px+

### Feature Parity Considerations
- Core functionality available on all devices
- Mobile-optimized interfaces for complex features
- Progressive enhancement for advanced features
- Graceful degradation for older devices

---

## Performance Optimizations

### Frontend Optimizations
1. **Code Splitting** - Lazy loading of route components
2. **Tree Shaking** - Removal of unused code
3. **Bundle Analysis** - Size monitoring and optimization
4. **Image Optimization** - WebP format and lazy loading
5. **Caching Strategy** - Service Worker caching
6. **Virtual Scrolling** - Performance for large lists

### Backend Optimizations
1. **Database Indexing** - Query optimization
2. **Redis Caching** - Frequently accessed data
3. **CDN Integration** - Static asset delivery
4. **Compression** - Gzip compression for responses
5. **Connection Pooling** - Database connection optimization
6. **Query Optimization** - N+1 query prevention

### Real-time Optimizations
1. **WebSocket Connection Pooling** - Efficient connection management
2. **Message Batching** - Reduced network overhead
3. **Delta Updates** - Only send changed data
4. **Heartbeat Monitoring** - Connection health checks

---

## Testing Strategy

### Unit Testing
- Jest for component testing
- React Testing Library for UI testing
- Mock services for isolation
- Coverage requirements: 80%+

### Integration Testing
- API endpoint testing with Supertest
- Database integration tests
- WebSocket connection testing
- Third-party service mocking

### End-to-End Testing
- Playwright for browser automation
- Critical user journey testing
- Cross-browser compatibility
- Mobile device testing

### Accessibility Testing
- Automated accessibility testing with Jest-Axe
- Screen reader testing
- Keyboard navigation validation
- Color contrast verification

### Performance Testing
- Load testing with Artillery
- Database performance monitoring
- Frontend performance audits
- Real-world usage simulation

---

## Deployment Architecture

### Production Environment
- **Frontend**: Netlify with CDN distribution
- **Backend**: Docker containers with load balancing
- **Database**: Neon PostgreSQL with automatic scaling
- **Monitoring**: Performance and error tracking
- **Security**: SSL/TLS, security headers, rate limiting

### Staging Environment
- Mirror of production for testing
- Automated deployment from development branch
- Integration testing environment
- Performance benchmarking

### Development Environment
- Local development with hot reloading
- Mock services for external APIs
- Local database with test data
- Development-specific debugging tools

---

## Analytics and Monitoring

### User Analytics
- User engagement tracking
- Feature usage analytics
- Performance monitoring
- Error tracking and reporting

### Business Metrics
- League creation rates
- User retention analytics
- Feature adoption metrics
- Revenue tracking (for premium features)

### Technical Monitoring
- Application performance monitoring
- Database query performance
- API response times
- Error rates and debugging

---

This comprehensive inventory serves as the foundation for the v4 rebuild, ensuring complete feature parity and identifying opportunities for improvement and modernization.