# Astral Draft V4 Performance Optimization Guide

## Overview

This guide outlines comprehensive performance optimization strategies implemented in Astral Draft V4, targeting Core Web Vitals metrics, mobile performance, and overall user experience. The optimizations are designed to achieve sub-4-second load times on mobile and sub-2.5-second load times on desktop.

## Performance Targets

### Core Web Vitals Goals
- **Largest Contentful Paint (LCP)**: < 2.5s (desktop), < 4.0s (mobile)
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8s (desktop), < 3.0s (mobile)
- **Time to First Byte (TTFB)**: < 600ms

### Additional Performance Metrics
- **Time to Interactive (TTI)**: < 3.8s (desktop), < 6.0s (mobile)
- **Total Blocking Time (TBT)**: < 200ms (desktop), < 600ms (mobile)
- **Speed Index**: < 3.4s (desktop), < 5.8s (mobile)

## Frontend Performance Optimizations

### 1. Code Splitting and Bundle Optimization

#### Implemented Strategies
```javascript
// next.config.js - Advanced code splitting
config.optimization.splitChunks = {
  chunks: 'all',
  cacheGroups: {
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      chunks: 'all',
      enforce: true,
    },
    ui: {
      test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
      name: 'ui',
      chunks: 'all',
      enforce: true,
    },
    oracle: {
      test: /[\\/]src[\\/](components|lib|server)[\\/].*oracle.*[\\/]/,
      name: 'oracle',
      chunks: 'all',
      enforce: true,
    },
    draft: {
      test: /[\\/]src[\\/](components|lib|server)[\\/].*draft.*[\\/]/,
      name: 'draft',
      chunks: 'all',
      enforce: true,
    },
  },
}
```

#### Benefits
- **Reduced Initial Bundle Size**: Main bundle < 250KB gzipped
- **Better Caching**: Feature-specific chunks cached independently
- **Faster Navigation**: Only load required features per page

### 2. Image Optimization Pipeline

#### WebP/AVIF Support
```javascript
// next.config.js - Image optimization
images: {
  domains: ['localhost', 'cdn.astraldraft.com'],
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

#### Lazy Loading Strategy
```typescript
// Component-level lazy loading
import { LazyImage } from '@/components/ui/LazyImage'

<LazyImage
  src="/images/player-photo.jpg"
  alt="Player photo"
  width={300}
  height={200}
  priority={false}
  placeholder="blur"
/>
```

#### Benefits
- **90% smaller images**: AVIF format with quality optimization
- **Reduced bandwidth**: Progressive loading and lazy loading
- **Better UX**: Blur placeholders prevent layout shift

### 3. Critical Resource Prioritization

#### Resource Hints Implementation
```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/api/user/session" as="fetch" crossorigin>

<!-- Prefetch likely navigation targets -->
<link rel="prefetch" href="/dashboard">
<link rel="prefetch" href="/leagues">

<!-- DNS prefetch for external resources -->
<link rel="dns-prefetch" href="//api.astraldraft.com">
<link rel="dns-prefetch" href="//cdn.astraldraft.com">
```

#### Dynamic Imports for Features
```typescript
// Lazy load expensive components
const OracleAnalytics = dynamic(() => import('@/components/oracle/OracleAnalytics'), {
  ssr: false,
  loading: () => <AnalyticsSkeletonLoader />
})

const DraftRoom = dynamic(() => import('@/components/draft/DraftRoom'), {
  ssr: false,
  loading: () => <DraftRoomSkeleton />
})
```

### 4. State Management Optimization

#### Optimized React Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.status === 404) return false
        return failureCount < 2
      },
    },
  },
})
```

#### Zustand Store Optimization
```typescript
// Selective subscriptions to prevent unnecessary re-renders
const useUserStore = create(subscribeWithSelector((set) => ({
  user: null,
  preferences: {},
  updateUser: (user) => set({ user }),
  updatePreferences: (preferences) => set({ preferences }),
})))

// Component-level selective subscription
const user = useUserStore(state => state.user)
const updateUser = useUserStore(state => state.updateUser)
```

### 5. Rendering Performance

#### Virtual Scrolling for Large Lists
```typescript
// FixedSizeList for player lists
import { FixedSizeList as List } from 'react-window'

const PlayerList = ({ players }) => (
  <List
    height={600}
    itemCount={players.length}
    itemSize={80}
    itemData={players}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <PlayerCard player={data[index]} />
      </div>
    )}
  </List>
)
```

#### Memoization Strategies
```typescript
// Component memoization
const PlayerCard = React.memo(({ player, onSelect }) => {
  return (
    <div onClick={() => onSelect(player.id)}>
      {player.name} - {player.position}
    </div>
  )
}, (prevProps, nextProps) => {
  return prevProps.player.id === nextProps.player.id
})

// Hook memoization
const usePlayerSearch = (query) => {
  return useMemo(() => {
    if (!query) return []
    return players.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [query, players])
}
```

## Backend Performance Optimizations

### 1. Database Query Optimization

#### Prisma Query Optimization
```typescript
// Efficient data fetching with select and include
const getUserLeagues = async (userId: string) => {
  return prisma.league.findMany({
    where: { 
      teams: { 
        some: { userId } 
      } 
    },
    select: {
      id: true,
      name: true,
      status: true,
      maxTeams: true,
      _count: {
        select: { teams: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20 // Pagination
  })
}
```

#### Connection Pooling
```typescript
// Database connection optimization
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pooling for better performance
  __internal: {
    engine: {
      binaryPath: './query-engine',
      enableMetrics: true
    }
  }
})
```

### 2. Caching Strategy

#### Redis Caching Implementation
```typescript
// Multi-layer caching strategy
class CacheService {
  private redis = new Redis(process.env.REDIS_URL)
  
  async get<T>(key: string, fallback: () => Promise<T>, ttl = 300): Promise<T> {
    // Try cache first
    const cached = await this.redis.get(key)
    if (cached) return JSON.parse(cached)
    
    // Fallback to data source
    const data = await fallback()
    await this.redis.setex(key, ttl, JSON.stringify(data))
    return data
  }
  
  async invalidatePattern(pattern: string) {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}

// Usage in API routes
const getPlayerStats = async (playerId: string) => {
  return cacheService.get(
    `player:${playerId}:stats`,
    () => prisma.player.findUnique({
      where: { id: playerId },
      include: { stats: true }
    }),
    600 // 10 minutes
  )
}
```

#### CDN Configuration
```typescript
// Static asset CDN configuration
const CDN_CONFIG = {
  images: {
    domains: ['cdn.astraldraft.com'],
    cacheTTL: 31536000, // 1 year
  },
  api: {
    staticResponses: ['players', 'teams', 'schedules'],
    cacheTTL: 3600, // 1 hour
  }
}
```

### 3. API Response Optimization

#### Response Compression
```typescript
// Automatic response compression
import compression from 'compression'

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    return compression.filter(req, res)
  }
}))
```

#### Efficient Data Serialization
```typescript
// Optimized JSON responses
const serializeUser = (user: User) => ({
  id: user.id,
  username: user.username,
  avatar: user.image,
  // Only include necessary fields
})

const serializeLeague = (league: League, includeSettings = false) => ({
  id: league.id,
  name: league.name,
  status: league.status,
  teamCount: league._count?.teams,
  ...(includeSettings && { settings: league.settings })
})
```

### 4. Real-time Performance

#### WebSocket Optimization
```typescript
// Efficient WebSocket connection management
class DraftWebSocketServer {
  private connections = new Map<string, WebSocket>()
  private rooms = new Map<string, Set<string>>()
  
  broadcast(roomId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(roomId)
    if (!room) return
    
    const serialized = JSON.stringify(message)
    for (const userId of room) {
      if (userId !== excludeUserId) {
        const ws = this.connections.get(userId)
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(serialized)
        }
      }
    }
  }
  
  // Heartbeat to maintain connections
  heartbeat() {
    this.connections.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      } else {
        this.removeConnection(userId)
      }
    })
  }
}
```

## Mobile Performance Optimizations

### 1. Progressive Web App Features

#### Service Worker Configuration
```javascript
// sw.js - Advanced caching strategies
const CACHE_NAME = 'astral-draft-v4-1.0.0'
const RUNTIME_CACHE = 'runtime-cache'

// Cache strategies
const cacheStrategies = {
  static: 'CacheFirst',
  api: 'StaleWhileRevalidate',
  images: 'CacheFirst',
  documents: 'NetworkFirst'
}

// Runtime caching
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone())
            }
            return networkResponse
          })
          return response || fetchPromise
        })
      })
    )
  }
})
```

#### Offline-First Architecture
```typescript
// Offline data synchronization
class OfflineManager {
  private db = new Dexie('AstralDraftOffline')
  
  constructor() {
    this.db.version(1).stores({
      actions: '++id, type, data, timestamp, synced',
      cache: '&key, data, expiry'
    })
  }
  
  async queueAction(type: string, data: any) {
    await this.db.actions.add({
      type,
      data,
      timestamp: Date.now(),
      synced: false
    })
  }
  
  async syncPendingActions() {
    const pending = await this.db.actions.where('synced').equals(false).toArray()
    
    for (const action of pending) {
      try {
        await this.executeAction(action)
        await this.db.actions.update(action.id, { synced: true })
      } catch (error) {
        console.error('Failed to sync action:', error)
      }
    }
  }
}
```

### 2. Touch and Gesture Optimization

#### Optimized Touch Handling
```typescript
// Touch-optimized component interactions
const useTouchGestures = () => {
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Prevent 300ms delay on mobile
    e.preventDefault()
  }, [])
  
  const handleSwipeGesture = useCallback((direction: 'left' | 'right') => {
    // Handle swipe with momentum
    requestAnimationFrame(() => {
      // Smooth animation
    })
  }, [])
  
  return { handleTouchStart, handleSwipeGesture }
}
```

## Monitoring and Measurement

### 1. Performance Monitoring Setup

#### Core Web Vitals Tracking
```typescript
// Real-time performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

const sendToAnalytics = (metric) => {
  fetch('/api/analytics/performance', {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { 'Content-Type': 'application/json' }
  })
}

// Track all Core Web Vitals
getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

#### Custom Performance Metrics
```typescript
// Application-specific performance tracking
const trackFeaturePerformance = (feature: string) => {
  const startTime = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - startTime
      sendToAnalytics({
        name: `feature-${feature}`,
        value: duration,
        timestamp: Date.now()
      })
    }
  }
}
```

### 2. Lighthouse CI Integration

#### Automated Performance Testing
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  pull_request:
    branches: [ main ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

## Performance Budget Enforcement

### 1. Bundle Size Monitoring
```javascript
// webpack-bundle-analyzer integration
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

if (process.env.ANALYZE === 'true') {
  config.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: '../.analyze/client.html',
      openAnalyzer: false
    })
  )
}
```

### 2. Performance Budget Configuration
```json
{
  "budgets": [
    {
      "path": "/*",
      "timings": [
        { "metric": "first-contentful-paint", "budget": 2000 },
        { "metric": "largest-contentful-paint", "budget": 4000 },
        { "metric": "cumulative-layout-shift", "budget": 0.1 },
        { "metric": "total-blocking-time", "budget": 600 }
      ],
      "resourceSizes": [
        { "resourceType": "script", "budget": 400 },
        { "resourceType": "stylesheet", "budget": 100 },
        { "resourceType": "image", "budget": 500 }
      ]
    }
  ]
}
```

## Best Practices Summary

### Development Guidelines
1. **Always measure first**: Use profiling tools before optimizing
2. **Optimize the critical path**: Focus on above-the-fold content
3. **Minimize main thread work**: Use Web Workers for expensive operations
4. **Implement lazy loading**: Only load what's needed when needed
5. **Cache strategically**: Balance freshness with performance

### Testing Requirements
1. **Performance regression testing**: Run Lighthouse CI on all PRs
2. **Real device testing**: Test on actual mobile devices
3. **Network condition simulation**: Test on slow 3G and 4G
4. **Accessibility performance**: Ensure optimizations don't hurt accessibility

### Deployment Checklist
- [ ] Bundle analysis shows no regressions
- [ ] Lighthouse scores meet targets
- [ ] Core Web Vitals pass thresholds
- [ ] Mobile performance tested
- [ ] CDN configuration verified
- [ ] Caching headers configured
- [ ] Performance monitoring enabled

---

**Last Updated**: 2024-08-20  
**Next Review**: 2024-11-20  
**Performance Target Review**: Monthly