# ASTRAL DRAFT V4 - COMPLETE PRODUCTION FIX MASTER PLAN
## Zero-Error Production Build Achievement Strategy

---

## PHASE 1: TYPE SYSTEM OVERHAUL
**Objective:** Fix all TypeScript type errors and mismatches

### Agent 1.1: Prisma Schema Alignment Agent
- [ ] Audit all Prisma model usage in codebase
- [ ] Add missing fields to User model (username, emailVerificationToken, etc.)
- [ ] Add missing fields to all other models
- [ ] Regenerate Prisma client
- [ ] Update all type imports

### Agent 1.2: tRPC Type Correction Agent
- [ ] Fix all mutation.isLoading to mutation.isPending
- [ ] Fix all query type mismatches
- [ ] Add missing tRPC endpoints (getPublicLeagues, etc.)
- [ ] Align context types with NextRequest/NextResponse

### Agent 1.3: Component Props Type Agent
- [ ] Fix all Button variant="primary" to "default"
- [ ] Fix all ref callback types
- [ ] Fix all event handler types
- [ ] Align all component prop interfaces

---

## PHASE 2: API ROUTES RECONSTRUCTION
**Objective:** Fix all API route errors

### Agent 2.1: Auth Routes Specialist
- [ ] Fix /api/auth/register route (email verification)
- [ ] Fix /api/auth/forgot-password route
- [ ] Fix /api/auth/verify-email route
- [ ] Fix /api/auth/resend-verification route
- [ ] Fix /api/auth/check-username route
- [ ] Add proper null checks for all email operations

### Agent 2.2: tRPC Context Agent
- [ ] Fix createTRPCContext type compatibility
- [ ] Add proper info field to context
- [ ] Fix NextRequest/NextApiRequest type mismatch
- [ ] Ensure all tRPC handlers work with App Router

### Agent 2.3: Email Service Agent
- [ ] Implement or stub all email functions
- [ ] Add null safety for email operations
- [ ] Fix all sendEmail function calls
- [ ] Ensure email service compatibility

---

## PHASE 3: DATABASE SCHEMA COMPLETION
**Objective:** Complete database schema and seed data

### Agent 3.1: Schema Migration Agent
- [ ] Add all missing User fields
- [ ] Add all missing relation fields
- [ ] Ensure SQLite compatibility for all types
- [ ] Run migrations successfully

### Agent 3.2: Seed Data Repair Agent
- [ ] Fix all seed.ts type errors
- [ ] Remove references to non-existent fields
- [ ] Ensure all create operations match schema
- [ ] Successfully seed database

### Agent 3.3: Database Relations Agent
- [ ] Add league.draft relations
- [ ] Add draft.picks relations
- [ ] Add all missing nested includes
- [ ] Fix all Prisma query includes

---

## PHASE 4: COMPONENT TYPE SAFETY
**Objective:** Fix all React component type errors

### Agent 4.1: Draft Components Agent
- [ ] Fix /draft/[id]/page-connected.tsx
- [ ] Fix /draft/[id]/recap/page.tsx
- [ ] Fix /draft/page.tsx
- [ ] Add proper draft data types
- [ ] Fix all draft-related queries

### Agent 4.2: League Components Agent
- [ ] Fix /leagues/page.tsx mock data types
- [ ] Fix /leagues/[id]/page.tsx
- [ ] Fix /leagues/[id]/playoffs/page.tsx
- [ ] Align League interface with Prisma model

### Agent 4.3: Form Components Agent
- [ ] Fix two-factor authentication page
- [ ] Fix all useForm hook types
- [ ] Fix all form submission handlers
- [ ] Add proper validation schemas

---

## PHASE 5: HOOK AND STATE MANAGEMENT
**Objective:** Fix all React hooks and state management

### Agent 5.1: Custom Hooks Agent
- [ ] Fix useMockDraft return types
- [ ] Fix all useEffect return values
- [ ] Fix all useState initial values
- [ ] Ensure hook dependency arrays are correct

### Agent 5.2: Data Fetching Agent
- [ ] Fix all useQuery hooks
- [ ] Fix all useMutation hooks
- [ ] Add proper loading states
- [ ] Add proper error handling

### Agent 5.3: WebSocket Integration Agent
- [ ] Fix Socket.IO client setup
- [ ] Fix all real-time event handlers
- [ ] Add proper connection management
- [ ] Fix draft room WebSocket integration

---

## PHASE 6: ROUTING AND NAVIGATION
**Objective:** Fix all routing issues

### Agent 6.1: App Router Agent
- [ ] Fix all dynamic routes
- [ ] Fix all route parameters
- [ ] Ensure all pages export correctly
- [ ] Fix metadata exports

### Agent 6.2: Navigation Agent
- [ ] Fix all router.push calls
- [ ] Fix all Link components
- [ ] Fix breadcrumb navigation
- [ ] Ensure proper route guards

### Agent 6.3: Middleware Agent
- [ ] Fix authentication middleware
- [ ] Fix rate limiting middleware
- [ ] Add proper redirects
- [ ] Ensure session handling

---

## PHASE 7: UI/UX CONSISTENCY
**Objective:** Fix all UI component issues

### Agent 7.1: Design System Agent
- [ ] Fix all Tailwind classes
- [ ] Fix all CSS modules
- [ ] Ensure consistent theming
- [ ] Fix responsive layouts

### Agent 7.2: Icon and Asset Agent
- [ ] Fix all icon imports
- [ ] Fix all image references
- [ ] Optimize asset loading
- [ ] Fix missing assets

### Agent 7.3: Animation Agent
- [ ] Fix all Framer Motion animations
- [ ] Fix all transitions
- [ ] Fix loading skeletons
- [ ] Ensure smooth interactions

---

## PHASE 8: EXTERNAL INTEGRATIONS
**Objective:** Fix all third-party integrations

### Agent 8.1: Sports API Agent
- [ ] Fix SportsIO API integration
- [ ] Add proper API error handling
- [ ] Implement data synchronization
- [ ] Cache API responses

### Agent 8.2: AI Integration Agent
- [ ] Fix Gemini AI integration
- [ ] Fix OpenAI integration (if used)
- [ ] Add proper prompt engineering
- [ ] Implement AI response handling

### Agent 8.3: Payment Integration Agent
- [ ] Fix Stripe integration (if applicable)
- [ ] Add proper webhook handling
- [ ] Implement subscription logic
- [ ] Add payment security

---

## PHASE 9: TESTING AND VALIDATION
**Objective:** Ensure all features work correctly

### Agent 9.1: Unit Testing Agent
- [ ] Add missing test files
- [ ] Fix all existing tests
- [ ] Achieve 80% code coverage
- [ ] Test all utilities

### Agent 9.2: Integration Testing Agent
- [ ] Test all API routes
- [ ] Test all database operations
- [ ] Test all tRPC procedures
- [ ] Test authentication flow

### Agent 9.3: E2E Testing Agent
- [ ] Fix Playwright configuration
- [ ] Test critical user journeys
- [ ] Test draft functionality
- [ ] Test real-time features

---

## PHASE 10: PERFORMANCE OPTIMIZATION
**Objective:** Optimize for production

### Agent 10.1: Build Optimization Agent
- [ ] Fix all build warnings
- [ ] Optimize bundle size
- [ ] Implement code splitting
- [ ] Add proper caching

### Agent 10.2: Database Optimization Agent
- [ ] Add proper indexes
- [ ] Optimize queries
- [ ] Implement connection pooling
- [ ] Add query caching

### Agent 10.3: Runtime Optimization Agent
- [ ] Fix memory leaks
- [ ] Optimize re-renders
- [ ] Implement lazy loading
- [ ] Add service workers

---

## PHASE 11: SECURITY HARDENING
**Objective:** Ensure production-ready security

### Agent 11.1: Authentication Security Agent
- [ ] Implement proper password hashing
- [ ] Add rate limiting
- [ ] Implement 2FA properly
- [ ] Add session management

### Agent 11.2: Data Security Agent
- [ ] Add input validation
- [ ] Implement CSRF protection
- [ ] Add XSS prevention
- [ ] Ensure SQL injection protection

### Agent 11.3: Infrastructure Security Agent
- [ ] Configure security headers
- [ ] Implement CORS properly
- [ ] Add API rate limiting
- [ ] Secure environment variables

---

## PHASE 12: DEPLOYMENT PREPARATION
**Objective:** Prepare for production deployment

### Agent 12.1: Environment Configuration Agent
- [ ] Fix all environment variables
- [ ] Create .env.production
- [ ] Configure for Vercel/Netlify
- [ ] Add proper secrets management

### Agent 12.2: CI/CD Pipeline Agent
- [ ] Fix GitHub Actions
- [ ] Add automated testing
- [ ] Implement deployment pipeline
- [ ] Add rollback capability

### Agent 12.3: Monitoring Setup Agent
- [ ] Add error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Implement logging
- [ ] Add uptime monitoring

---

## PHASE 13: FINAL VALIDATION
**Objective:** Ensure 100% production readiness

### Agent 13.1: Production Build Agent
- [ ] Run full production build
- [ ] Fix any remaining TypeScript errors
- [ ] Fix any remaining ESLint errors
- [ ] Ensure zero console errors

### Agent 13.2: Functionality Verification Agent
- [ ] Test user registration/login
- [ ] Test league creation
- [ ] Test draft functionality
- [ ] Test all core features

### Agent 13.3: Performance Validation Agent
- [ ] Run Lighthouse audit
- [ ] Ensure Core Web Vitals pass
- [ ] Test under load
- [ ] Verify mobile performance

---

## EXECUTION STRATEGY

### Priority Order:
1. **CRITICAL**: Phases 1-3 (Type System, API Routes, Database)
2. **HIGH**: Phases 4-6 (Components, Hooks, Routing)
3. **MEDIUM**: Phases 7-9 (UI/UX, Integrations, Testing)
4. **LOW**: Phases 10-12 (Optimization, Security, Deployment)
5. **FINAL**: Phase 13 (Validation)

### Success Metrics:
- ✅ `npm run build` completes with 0 errors
- ✅ `npm run lint` passes with 0 errors
- ✅ `npm run type-check` passes with 0 errors
- ✅ All tests pass
- ✅ Production deployment successful
- ✅ All features functional
- ✅ Performance metrics met

---

## AGENT DEPLOYMENT SCHEDULE

**Wave 1 (Immediate):** Agents 1.1-1.3, 2.1-2.3, 3.1-3.3
**Wave 2 (After Wave 1):** Agents 4.1-4.3, 5.1-5.3, 6.1-6.3
**Wave 3 (After Wave 2):** Agents 7.1-7.3, 8.1-8.3, 9.1-9.3
**Wave 4 (After Wave 3):** Agents 10.1-10.3, 11.1-11.3, 12.1-12.3
**Wave 5 (Final):** Agents 13.1-13.3

Total Agents Required: **39 Specialized Agents**

---

## ESTIMATED TIMELINE
- Wave 1: 2-3 hours
- Wave 2: 2-3 hours
- Wave 3: 3-4 hours
- Wave 4: 2-3 hours
- Wave 5: 1-2 hours

**Total Estimated Time: 10-15 hours of continuous agent work**