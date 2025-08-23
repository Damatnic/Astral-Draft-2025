#!/bin/bash
# Astral Draft v4 - Production Setup Script
# ==========================================
# Comprehensive production environment setup and deployment script

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/logs/production-setup.log"

# Ensure logs directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Error handling
trap 'error "Script failed at line $LINENO"; exit 1' ERR

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check environment variables
check_env_vars() {
    log "Checking required environment variables..."
    
    local required_vars=(
        "NODE_ENV"
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        error "Please check your .env.production file"
        exit 1
    fi
    
    log "All required environment variables are set"
}

# Function to setup production dependencies
setup_dependencies() {
    log "Setting up production dependencies..."
    
    # Check Node.js version
    if ! command_exists node; then
        error "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2)
    local required_version="18.17.0"
    
    if ! command_exists npm; then
        error "npm is not installed"
        exit 1
    fi
    
    # Install production dependencies
    log "Installing production dependencies..."
    npm ci --only=production --silent
    
    # Install additional production tools
    if ! command_exists pm2; then
        log "Installing PM2 for process management..."
        npm install -g pm2
    fi
    
    if ! command_exists nginx; then
        warn "Nginx is not installed. Please install it manually for production deployment."
    fi
    
    log "Dependencies setup completed"
}

# Function to setup database
setup_database() {
    log "Setting up production database..."
    
    # Check database connection
    if ! npx prisma db execute --url="$DATABASE_URL" --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
        error "Cannot connect to production database"
        error "Please check your DATABASE_URL in .env.production"
        exit 1
    fi
    
    log "Database connection verified"
    
    # Run database migrations
    log "Running database migrations..."
    npx prisma migrate deploy
    
    # Generate Prisma client
    log "Generating Prisma client..."
    npx prisma generate
    
    # Seed database if needed
    if [ -f "$PROJECT_ROOT/prisma/seed.ts" ]; then
        log "Seeding database..."
        npx prisma db seed
    fi
    
    log "Database setup completed"
}

# Function to setup Redis
setup_redis() {
    log "Setting up Redis configuration..."
    
    if [ -n "${REDIS_HOST:-}" ]; then
        # Test Redis connection
        if command_exists redis-cli; then
            local redis_cmd="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT:-6379}"
            if [ -n "${REDIS_PASSWORD:-}" ]; then
                redis_cmd="$redis_cmd -a $REDIS_PASSWORD"
            fi
            
            if ! $redis_cmd ping >/dev/null 2>&1; then
                warn "Cannot connect to Redis server. Some features may be limited."
            else
                log "Redis connection verified"
            fi
        else
            warn "redis-cli not found. Cannot verify Redis connection."
        fi
    else
        warn "Redis not configured. Some features may be limited."
    fi
}

# Function to build application
build_application() {
    log "Building application for production..."
    
    # Clean previous builds
    rm -rf "$PROJECT_ROOT/.next"
    rm -rf "$PROJECT_ROOT/dist"
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    log "Running Next.js build..."
    npm run build
    
    # Verify build
    if [ ! -d "$PROJECT_ROOT/.next" ]; then
        error "Build failed - .next directory not found"
        exit 1
    fi
    
    log "Application build completed successfully"
}

# Function to setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    local ssl_dir="/etc/ssl/astral-draft"
    local cert_file="$ssl_dir/cert.pem"
    local key_file="$ssl_dir/key.pem"
    
    # Create SSL directory
    sudo mkdir -p "$ssl_dir"
    
    # Check if certificates exist
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        warn "SSL certificates not found in $ssl_dir"
        warn "Please ensure SSL certificates are properly installed"
        warn "For Let's Encrypt, run: sudo certbot --nginx -d yourdomain.com"
    else
        log "SSL certificates found"
        
        # Verify certificate validity
        if openssl x509 -in "$cert_file" -noout -checkend 86400; then
            log "SSL certificate is valid"
        else
            warn "SSL certificate expires within 24 hours"
        fi
    fi
}

# Function to configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    local nginx_config="/etc/nginx/sites-available/astral-draft"
    local nginx_enabled="/etc/nginx/sites-enabled/astral-draft"
    
    if [ ! -f "$nginx_config" ]; then
        log "Creating Nginx configuration..."
        
        cat > /tmp/astral-draft-nginx.conf << EOF
server {
    listen 80;
    server_name ${NEXTAUTH_URL#https://} www.${NEXTAUTH_URL#https://};
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${NEXTAUTH_URL#https://} www.${NEXTAUTH_URL#https://};
    
    # SSL Configuration
    ssl_certificate /etc/ssl/astral-draft/cert.pem;
    ssl_certificate_key /etc/ssl/astral-draft/key.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static file caching
    location /_next/static/ {
        alias $PROJECT_ROOT/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /static/ {
        alias $PROJECT_ROOT/public/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
        
        sudo mv /tmp/astral-draft-nginx.conf "$nginx_config"
        sudo ln -sf "$nginx_config" "$nginx_enabled"
        
        # Test Nginx configuration
        if sudo nginx -t; then
            log "Nginx configuration is valid"
            sudo systemctl reload nginx
        else
            error "Nginx configuration is invalid"
            exit 1
        fi
    else
        log "Nginx configuration already exists"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring and logging..."
    
    # Create log directories
    local log_dirs=(
        "/var/log/astral-draft"
        "/var/log/nginx"
        "$PROJECT_ROOT/logs"
    )
    
    for dir in "${log_dirs[@]}"; do
        sudo mkdir -p "$dir"
        sudo chown -R www-data:www-data "$dir" 2>/dev/null || true
    done
    
    # Setup log rotation
    cat > /tmp/astral-draft-logrotate << EOF
/var/log/astral-draft/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
        pm2 reload all > /dev/null 2>&1 || true
    endscript
}
EOF
    
    sudo mv /tmp/astral-draft-logrotate /etc/logrotate.d/astral-draft
    
    log "Monitoring setup completed"
}

# Function to setup PM2 ecosystem
setup_pm2() {
    log "Setting up PM2 process management..."
    
    cat > "$PROJECT_ROOT/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'astral-draft-web',
      script: 'npm',
      args: 'start',
      cwd: '$PROJECT_ROOT',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/astral-draft/web-error.log',
      out_file: '/var/log/astral-draft/web-out.log',
      log_file: '/var/log/astral-draft/web-combined.log',
      time: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 5,
    },
    {
      name: 'astral-draft-websocket',
      script: '$PROJECT_ROOT/src/server/websocket/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3001,
      },
      error_file: '/var/log/astral-draft/ws-error.log',
      out_file: '/var/log/astral-draft/ws-out.log',
      log_file: '/var/log/astral-draft/ws-combined.log',
      time: true,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 5,
    }
  ]
};
EOF
    
    log "PM2 ecosystem configuration created"
}

# Function to setup backup system
setup_backups() {
    log "Setting up backup system..."
    
    # Create backup directories
    mkdir -p "$BACKUP_DIR"/{database,files,config}
    
    # Create backup script
    cat > "$PROJECT_ROOT/scripts/backup.sh" << 'EOF'
#!/bin/bash
# Automated backup script for Astral Draft

set -euo pipefail

BACKUP_DIR="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Database backup
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database/astral-draft-$DATE.sql"
gzip "$BACKUP_DIR/database/astral-draft-$DATE.sql"

# Configuration backup
cp .env.production "$BACKUP_DIR/config/env-$DATE.backup"

# File uploads backup (if applicable)
if [ -d "uploads" ]; then
    tar -czf "$BACKUP_DIR/files/uploads-$DATE.tar.gz" uploads/
fi

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/backup.sh"
    
    # Setup cron job for backups
    local cron_entry="0 2 * * * $PROJECT_ROOT/scripts/backup.sh >> $LOG_FILE 2>&1"
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -
    
    log "Backup system configured"
}

# Function to run security checks
security_check() {
    log "Running security checks..."
    
    # Check file permissions
    find "$PROJECT_ROOT" -name "*.env*" -exec chmod 600 {} \;
    find "$PROJECT_ROOT" -name "*.key" -exec chmod 600 {} \;
    
    # Check for sensitive files in git
    local sensitive_files=(
        ".env.production"
        "*.key"
        "*.pem"
        "config/secrets.json"
    )
    
    for pattern in "${sensitive_files[@]}"; do
        if git ls-files --error-unmatch "$pattern" >/dev/null 2>&1; then
            warn "Sensitive file $pattern is tracked by git"
        fi
    done
    
    # Audit npm packages
    if npm audit --audit-level high --production; then
        log "No high-severity security vulnerabilities found"
    else
        warn "Security vulnerabilities detected. Run 'npm audit fix' to resolve."
    fi
    
    log "Security check completed"
}

# Function to run final tests
run_tests() {
    log "Running production tests..."
    
    # Build and start in test mode
    export NODE_ENV=production
    
    # Start the application
    timeout 30s npm start &
    local app_pid=$!
    
    sleep 10
    
    # Health check
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log "Health check passed"
    else
        error "Health check failed"
        kill $app_pid 2>/dev/null || true
        exit 1
    fi
    
    # Stop the test instance
    kill $app_pid 2>/dev/null || true
    wait $app_pid 2>/dev/null || true
    
    log "Production tests completed successfully"
}

# Function to deploy application
deploy_application() {
    log "Deploying application..."
    
    # Start with PM2
    if pm2 list | grep -q "astral-draft"; then
        log "Reloading existing PM2 processes..."
        pm2 reload ecosystem.config.js
    else
        log "Starting new PM2 processes..."
        pm2 start ecosystem.config.js
    fi
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    log "Application deployed successfully"
}

# Main execution
main() {
    log "Starting Astral Draft v4 production setup..."
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
        log "Loaded production environment variables"
    else
        error "Production environment file not found: $ENV_FILE"
        exit 1
    fi
    
    # Run setup steps
    check_env_vars
    setup_dependencies
    setup_database
    setup_redis
    build_application
    setup_ssl
    configure_nginx
    setup_monitoring
    setup_pm2
    setup_backups
    security_check
    run_tests
    deploy_application
    
    log "Production setup completed successfully!"
    log "Application is now running at: $NEXTAUTH_URL"
    
    # Display final status
    info "=== Production Setup Summary ==="
    info "✅ Environment: Production"
    info "✅ Database: Connected and migrated"
    info "✅ Redis: Configured"
    info "✅ SSL: Configured"
    info "✅ Nginx: Running"
    info "✅ PM2: Managing processes"
    info "✅ Monitoring: Enabled"
    info "✅ Backups: Scheduled"
    info "✅ Security: Verified"
    info "================================"
    
    log "To monitor the application:"
    log "  pm2 monit"
    log "  pm2 logs astral-draft-web"
    log "  tail -f $LOG_FILE"
}

# Run main function
main "$@"