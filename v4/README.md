# Astral Draft V4

[![CI](https://github.com/astral-projects/astral-draft-v4/actions/workflows/ci.yml/badge.svg)](https://github.com/astral-projects/astral-draft-v4/actions/workflows/ci.yml)
[![Deploy](https://github.com/astral-projects/astral-draft-v4/actions/workflows/deploy.yml/badge.svg)](https://github.com/astral-projects/astral-draft-v4/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/astral-projects/astral-draft-v4/branch/main/graph/badge.svg)](https://codecov.io/gh/astral-projects/astral-draft-v4)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC)](https://tailwindcss.com/)

> The next generation fantasy football platform built with modern web technologies

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- PostgreSQL 15 or higher
- Redis (optional, for caching)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/astral-projects/astral-draft-v4.git
   cd astral-draft-v4
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**

   ```bash
   # Start PostgreSQL (or use Docker)
   npm run docker:dev

   # Generate Prisma client and push schema
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Docker Development

```bash
# Start all services (PostgreSQL, Redis, App)
npm run docker:dev

# Stop all services
npm run docker:down
```

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Testing**: Vitest + Playwright
- **Deployment**: Docker + GitHub Actions

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                # Utility libraries and configurations
├── server/             # Server-side logic and API routes
├── styles/             # Global styles and Tailwind config
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

prisma/                 # Database schema and migrations
tests/                  # Test files
├── unit/              # Unit tests
├── e2e/               # End-to-end tests
└── fixtures/          # Test fixtures

docs/                   # Documentation
scripts/               # Build and deployment scripts
.github/               # GitHub Actions workflows
```

### Custom Breakpoints

```css
sm: 360px     /* 360-639px - Small mobile */
md: 640px     /* 640-1023px - Large mobile/small tablet */
lg: 1024px    /* 1024-1439px - Desktop */
xl: 1440px    /* 1440-1919px - Large desktop */
2xl: 1920px   /* 1920px+ - Extra large desktop */
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
npm run test:coverage
npm run test:ui
```

### End-to-End Tests

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

### Device Matrix Testing

E2E tests run across multiple devices:

- Desktop: Chrome, Firefox, Safari
- Mobile: iPhone 12, Pixel 5
- Tablet: iPad Pro, iPad Mini

## 🚀 Deployment

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

- **Database**: PostgreSQL connection string
- **Authentication**: NextAuth.js secrets and OAuth providers
- **External APIs**: Sports data, email services
- **Monitoring**: Error tracking, analytics

### Production Build

```bash
npm run build
npm run start
```

### Docker Deployment

```bash
# Build production image
docker build -t astral-draft-v4 .

# Run with docker-compose
docker-compose up -d
```

### CI/CD Pipeline

- **CI**: Type checking, linting, testing, security audit
- **CD**: Automated deployment to staging and production
- **Database**: Automated migrations
- **Monitoring**: Bundle analysis, performance tracking

## 🔐 Security Features

- **Headers**: Security headers via Next.js config
- **Authentication**: Secure session management
- **Environment**: Proper secret management
- **Dependencies**: Regular security audits
- **CSP**: Content Security Policy implementation
- **HTTPS**: Enforced in production

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📧 Email: support@astraldraft.com
- 💬 Discord: [Join our community](https://discord.gg/astraldraft)
- 📖 Documentation: [docs.astraldraft.com](https://docs.astraldraft.com)
- 🐛 Issues: [GitHub Issues](https://github.com/astral-projects/astral-draft-v4/issues)

## 🎯 Roadmap

- [ ] Real-time draft rooms
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered draft recommendations
- [ ] Social features and leagues
- [ ] Fantasy football education platform

---

Built with ❤️ by the Astral Projects team
