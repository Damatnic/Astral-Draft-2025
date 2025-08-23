# Environment Variables Documentation

## Overview

This document provides comprehensive documentation for all environment variables used in Astral Draft v4. Environment variables are used to configure the application for different environments (development, staging, production) and to store sensitive information securely.

## Quick Start

1. Copy the appropriate example file for your environment:
   ```bash
   # For production
   cp .env.production.example .env.production
   
   # For staging  
   cp .env.staging.example .env.staging
   
   # For development
   cp .env.example .env.local
   ```

2. Fill in the required values (marked as REQUIRED in comments)
3. Set up the environment variables in your deployment platform

## Security Guidelines

- **Never commit actual environment variable values to version control**
- Use strong, randomly generated secrets for all authentication keys
- Rotate secrets regularly (at least every 90 days for production)
- Use different values for each environment
- Store production secrets in a secure secret management system

## Environment Variable Categories

### Core Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | - | Application environment (development/staging/production) |
| `NEXTAUTH_URL` | ✅ | - | Base URL of the application |
| `PORT` | ❌ | 3000 | Port the application listens on |
| `HOSTNAME` | ❌ | localhost | Hostname the application binds to |

### Authentication & Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_SECRET` | ✅ | - | Secret for NextAuth.js session encryption |
| `JWT_SECRET` | ✅ | - | Secret for JWT token signing |
| `API_SECRET_KEY` | ✅ | - | Secret for internal API authentication |
| `SESSION_TIMEOUT` | ❌ | 86400 | Session timeout in seconds |
| `SECURE_COOKIES` | ❌ | true | Use secure cookies (HTTPS only) |

#### Generating Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -hex 64

# Generate API secret
openssl rand -base64 48
```

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | Primary database connection string |
| `DATABASE_READ_URL` | ❌ | - | Read replica database connection |
| `DATABASE_POOL_MIN` | ❌ | 5 | Minimum database connections |
| `DATABASE_POOL_MAX` | ❌ | 20 | Maximum database connections |

#### Database URL Format

```
postgresql://username:password@host:port/database?options
```

**Example:**
```
DATABASE_URL=postgresql://myuser:mypass@db.example.com:5432/astral_draft?sslmode=require&connection_limit=20
```

### Redis Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | ✅ | - | Redis connection string |
| `REDIS_PASSWORD` | ❌ | - | Redis authentication password |
| `CACHE_TTL` | ❌ | 3600 | Default cache TTL in seconds |

#### Redis URL Format

```
redis://[username:password@]host:port[/database]
```

**Examples:**
```
# Basic Redis
REDIS_URL=redis://localhost:6379/0

# Redis with auth
REDIS_URL=redis://:password@redis.example.com:6379/0

# Redis with username and password
REDIS_URL=redis://user:pass@redis.example.com:6379/0
```

### External APIs & Services

#### Sports Data APIs

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SPORTSIO_API_KEY` | ✅ | - | SportsData.io API key |
| `SPORTSIO_BASE_URL` | ❌ | https://api.sportsdata.io/v3/nfl | SportsData.io base URL |
| `REALTIME_SPORTS_API_KEY` | ❌ | - | Real-time sports data API key |

#### AI/ML Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ❌ | - | Google Gemini AI API key |
| `GEMINI_MODEL` | ❌ | gemini-pro | Gemini model to use |
| `ORACLE_API_KEY` | ❌ | - | Oracle prediction service API key |

### Email Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | ✅ | - | Resend email service API key |
| `FROM_EMAIL` | ✅ | - | Default sender email address |
| `SUPPORT_EMAIL` | ❌ | support@astraldraft.com | Support contact email |

#### SMTP Fallback (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | ❌ | - | SMTP server hostname |
| `SMTP_PORT` | ❌ | 587 | SMTP server port |
| `SMTP_USER` | ❌ | - | SMTP username |
| `SMTP_PASS` | ❌ | - | SMTP password |

### File Storage & CDN

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | ❌ | - | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | ❌ | - | AWS secret key for S3 |
| `AWS_REGION` | ❌ | us-east-1 | AWS region |
| `AWS_S3_BUCKET` | ❌ | - | S3 bucket name |
| `CDN_URL` | ❌ | - | CDN base URL |

### Monitoring & Observability

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | ✅ | - | Sentry error tracking DSN |
| `SENTRY_ORG` | ❌ | - | Sentry organization |
| `SENTRY_PROJECT` | ❌ | - | Sentry project name |
| `GOOGLE_ANALYTICS_ID` | ❌ | - | Google Analytics tracking ID |

### Payment Processing

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_PUBLIC_KEY` | ❌ | - | Stripe publishable key |
| `STRIPE_SECRET_KEY` | ❌ | - | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ❌ | - | Stripe webhook endpoint secret |

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_DRAFT_ROOM` | ❌ | true | Enable draft room functionality |
| `ENABLE_TRADE_ANALYZER` | ❌ | true | Enable trade analysis features |
| `ENABLE_ORACLE_PREDICTIONS` | ❌ | true | Enable AI predictions |
| `ENABLE_PREMIUM_ANALYTICS` | ❌ | true | Enable premium analytics |

## Environment-Specific Configurations

### Development Environment

- Use `.env.local` or `.env.development`
- Database: Local SQLite or PostgreSQL
- Redis: Local Redis instance
- Email: Use MailHog or similar testing tool
- File storage: Local filesystem
- Monitoring: Optional/disabled

### Staging Environment

- Use `.env.staging`
- Database: Staging PostgreSQL instance
- Redis: Staging Redis instance
- Email: Test email provider (Resend test mode)
- File storage: Staging S3 bucket
- Monitoring: Enabled with staging Sentry project

### Production Environment

- Use `.env.production`
- Database: Production PostgreSQL with read replicas
- Redis: Production Redis cluster
- Email: Production Resend configuration
- File storage: Production S3 bucket with CDN
- Monitoring: Full monitoring stack enabled

## Validation

The application validates required environment variables on startup. Missing required variables will cause the application to fail to start with descriptive error messages.

### Required Variables by Environment

#### Development
- `NODE_ENV`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`

#### Staging
- `NODE_ENV`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `RESEND_API_KEY`
- `FROM_EMAIL`

#### Production
- `NODE_ENV`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `SENTRY_DSN`
- `SPORTSIO_API_KEY`

## Secret Management

### Development

Use `.env.local` files that are excluded from version control.

### Staging/Production

Use your deployment platform's secret management:

#### Vercel
```bash
vercel env add NEXTAUTH_SECRET production
```

#### Netlify
```bash
netlify env:set NEXTAUTH_SECRET "your-secret-value"
```

#### Docker/Container Platforms
```bash
docker run -e NEXTAUTH_SECRET="your-secret-value" astral-draft
```

#### Kubernetes
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: astral-draft-secrets
type: Opaque
stringData:
  NEXTAUTH_SECRET: "your-secret-value"
```

## Troubleshooting

### Common Issues

1. **Application fails to start**
   - Check that all required environment variables are set
   - Verify database connectivity
   - Check Redis connectivity

2. **Authentication not working**
   - Verify `NEXTAUTH_SECRET` is set and consistent
   - Check `NEXTAUTH_URL` matches your domain
   - Ensure `JWT_SECRET` is set

3. **Database connection issues**
   - Verify `DATABASE_URL` format and credentials
   - Check network connectivity to database
   - Verify SSL settings

4. **Email not sending**
   - Verify `RESEND_API_KEY` is valid
   - Check `FROM_EMAIL` domain is verified
   - Ensure email templates are configured

### Environment Variable Debugging

Set `DEBUG_ENV_VARS=true` in development to log loaded environment variables (sensitive values will be masked).

## Security Checklist

- [ ] All production secrets use strong, random values
- [ ] Different secrets for each environment
- [ ] Secrets are not committed to version control
- [ ] Regular secret rotation schedule in place
- [ ] Access to production secrets is restricted
- [ ] Audit logging for secret access enabled
- [ ] Backup/recovery plan for secrets

## Migration Guide

When upgrading between versions, check for:

1. New required environment variables
2. Changed variable names or formats
3. Deprecated variables
4. Updated default values

See the [CHANGELOG.md](../CHANGELOG.md) for version-specific migration notes.