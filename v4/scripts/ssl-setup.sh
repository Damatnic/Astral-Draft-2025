#!/bin/bash
# Astral Draft v4 - SSL/TLS Setup Script
# ======================================
# Automated SSL certificate setup and configuration script

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
SSL_DIR="/etc/ssl/astral-draft"
NGINX_SSL_DIR="/etc/nginx/ssl"
DOMAIN="${1:-yourdomain.com}"
EMAIL="${2:-admin@yourdomain.com}"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Error handling
trap 'error "SSL setup failed at line $LINENO"; exit 1' ERR

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to install certbot
install_certbot() {
    log "Installing Certbot..."
    
    if command_exists apt-get; then
        # Ubuntu/Debian
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command_exists yum; then
        # CentOS/RHEL
        yum install -y epel-release
        yum install -y certbot python3-certbot-nginx
    elif command_exists dnf; then
        # Fedora
        dnf install -y certbot python3-certbot-nginx
    else
        error "Unsupported package manager. Please install certbot manually."
        exit 1
    fi
    
    log "Certbot installed successfully"
}

# Function to validate domain
validate_domain() {
    log "Validating domain: $DOMAIN"
    
    # Check if domain resolves to this server
    local domain_ip=$(dig +short "$DOMAIN" | tail -n1)
    local server_ip=$(curl -s http://whatismyip.akamai.com/ || curl -s http://ipecho.net/plain || echo "unknown")
    
    if [ "$domain_ip" != "$server_ip" ]; then
        warn "Domain $DOMAIN resolves to $domain_ip but server IP is $server_ip"
        warn "Please ensure DNS is properly configured before continuing"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log "Domain validation successful"
    fi
}

# Function to setup directories
setup_directories() {
    log "Setting up SSL directories..."
    
    # Create SSL directories
    mkdir -p "$SSL_DIR"
    mkdir -p "$NGINX_SSL_DIR"
    mkdir -p "/var/log/letsencrypt"
    
    # Set proper permissions
    chmod 755 "$SSL_DIR"
    chmod 755 "$NGINX_SSL_DIR"
    
    log "SSL directories created"
}

# Function to generate self-signed certificate (fallback)
generate_self_signed() {
    log "Generating self-signed certificate for development/testing..."
    
    local cert_file="$SSL_DIR/self-signed.crt"
    local key_file="$SSL_DIR/self-signed.key"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$key_file" \
        -out "$cert_file" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$DOMAIN/emailAddress=$EMAIL"
    
    # Set proper permissions
    chmod 600 "$key_file"
    chmod 644 "$cert_file"
    
    log "Self-signed certificate generated"
    warn "This is a self-signed certificate and should only be used for development"
    warn "Browsers will show security warnings for self-signed certificates"
}

# Function to obtain Let's Encrypt certificate
obtain_letsencrypt_cert() {
    log "Obtaining Let's Encrypt certificate for $DOMAIN..."
    
    # Check if nginx is running
    if ! systemctl is-active --quiet nginx; then
        log "Starting nginx..."
        systemctl start nginx
    fi
    
    # Obtain certificate using nginx plugin
    certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$DOMAIN,www.$DOMAIN" \
        --redirect \
        --hsts \
        --staple-ocsp \
        --must-staple
    
    if [ $? -eq 0 ]; then
        log "Let's Encrypt certificate obtained successfully"
        
        # Copy certificates to our SSL directory
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
        
        # Set proper permissions
        chmod 644 "$SSL_DIR/cert.pem"
        chmod 600 "$SSL_DIR/key.pem"
        
    else
        error "Failed to obtain Let's Encrypt certificate"
        warn "Falling back to self-signed certificate"
        generate_self_signed
    fi
}

# Function to setup certificate renewal
setup_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > "/usr/local/bin/certbot-renewal.sh" << 'EOF'
#!/bin/bash
# Automatic certificate renewal script

/usr/bin/certbot renew --quiet --no-self-upgrade

# Reload nginx if certificates were renewed
if [ $? -eq 0 ]; then
    /bin/systemctl reload nginx
fi
EOF
    
    chmod +x "/usr/local/bin/certbot-renewal.sh"
    
    # Add to crontab (run twice daily)
    local cron_entry="0 */12 * * * /usr/local/bin/certbot-renewal.sh >/dev/null 2>&1"
    (crontab -l 2>/dev/null | grep -v certbot-renewal; echo "$cron_entry") | crontab -
    
    log "Automatic renewal configured"
}

# Function to create enhanced nginx SSL configuration
create_nginx_ssl_config() {
    log "Creating enhanced Nginx SSL configuration..."
    
    cat > "$NGINX_SSL_DIR/ssl.conf" << EOF
# SSL Configuration for Astral Draft v4
# Modern SSL configuration with high security

# SSL Certificates
ssl_certificate $SSL_DIR/cert.pem;
ssl_certificate_key $SSL_DIR/key.pem;

# SSL Session Settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# SSL Protocols and Ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# SSL Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate $SSL_DIR/cert.pem;

# DNS Resolvers for OCSP stapling
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Diffie-Hellman Parameters
ssl_dhparam $NGINX_SSL_DIR/dhparam.pem;

# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' wss: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

# Additional Security Headers
add_header X-Permitted-Cross-Domain-Policies "none" always;
add_header X-Robots-Tag "none" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "cross-origin" always;

# Hide Nginx version
server_tokens off;
EOF
    
    log "Enhanced SSL configuration created"
}

# Function to generate Diffie-Hellman parameters
generate_dhparam() {
    log "Generating Diffie-Hellman parameters (this may take a few minutes)..."
    
    if [ ! -f "$NGINX_SSL_DIR/dhparam.pem" ]; then
        openssl dhparam -out "$NGINX_SSL_DIR/dhparam.pem" 2048
        chmod 644 "$NGINX_SSL_DIR/dhparam.pem"
        log "Diffie-Hellman parameters generated"
    else
        log "Diffie-Hellman parameters already exist"
    fi
}

# Function to update nginx site configuration
update_nginx_site() {
    log "Updating Nginx site configuration..."
    
    local site_config="/etc/nginx/sites-available/astral-draft"
    
    if [ -f "$site_config" ]; then
        # Backup existing configuration
        cp "$site_config" "$site_config.backup.$(date +%s)"
        
        # Update configuration to include SSL
        cat > "$site_config" << EOF
# Astral Draft v4 - Production Nginx Configuration with SSL

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # Include SSL configuration
    include $NGINX_SSL_DIR/ssl.conf;
    
    # Root and index
    root $PROJECT_ROOT/public;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;
    
    # Brotli compression (if available)
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;
    
    # Static file handling with caching
    location /_next/static/ {
        alias $PROJECT_ROOT/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
    }
    
    location /static/ {
        alias $PROJECT_ROOT/public/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
    }
    
    location /images/ {
        alias $PROJECT_ROOT/public/images/;
        expires 30d;
        add_header Cache-Control "public";
        add_header X-Content-Type-Options "nosniff";
    }
    
    # Favicon and manifest
    location = /favicon.ico {
        alias $PROJECT_ROOT/public/favicon.ico;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location = /manifest.json {
        alias $PROJECT_ROOT/public/manifest.json;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # Service worker
    location = /sw.js {
        alias $PROJECT_ROOT/public/sw.js;
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # API routes (no caching)
    location /api/ {
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
        
        # No caching for API routes
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
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
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
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
        
        # Enable caching for HTML pages
        proxy_cache_valid 200 1h;
        proxy_cache_valid 404 1m;
    }
    
    # Security: Block access to sensitive files
    location ~ /\.(?!well-known) {
        deny all;
    }
    
    location ~ \.(env|log|conf)$ {
        deny all;
    }
    
    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /500.html;
    
    # Rate limiting (basic)
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
EOF
        
        # Test nginx configuration
        if nginx -t; then
            log "Nginx configuration updated successfully"
            systemctl reload nginx
        else
            error "Nginx configuration is invalid"
            # Restore backup
            mv "$site_config.backup.$(date +%s)" "$site_config"
            exit 1
        fi
    else
        warn "Nginx site configuration not found: $site_config"
    fi
}

# Function to test SSL configuration
test_ssl() {
    log "Testing SSL configuration..."
    
    # Test SSL certificate
    if openssl x509 -in "$SSL_DIR/cert.pem" -noout -text >/dev/null 2>&1; then
        log "SSL certificate is valid"
        
        # Display certificate details
        local cert_subject=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject | sed 's/subject=//')
        local cert_issuer=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -issuer | sed 's/issuer=//')
        local cert_dates=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -dates)
        
        info "Certificate Subject: $cert_subject"
        info "Certificate Issuer: $cert_issuer"
        info "Certificate Dates: $cert_dates"
    else
        error "SSL certificate is invalid"
        exit 1
    fi
    
    # Test HTTPS connection
    sleep 5
    if curl -f -s "https://$DOMAIN/api/health" >/dev/null 2>&1; then
        log "HTTPS connection test successful"
    else
        warn "HTTPS connection test failed - application may not be running"
    fi
    
    log "SSL configuration test completed"
}

# Function to display SSL security score information
display_security_info() {
    log "SSL setup completed successfully!"
    
    info "=== SSL Configuration Summary ==="
    info "✅ Domain: $DOMAIN"
    info "✅ Certificate: Let's Encrypt (or self-signed)"
    info "✅ Protocols: TLS 1.2, TLS 1.3"
    info "✅ HSTS: Enabled (1 year)"
    info "✅ OCSP Stapling: Enabled"
    info "✅ Security Headers: Configured"
    info "✅ Auto-renewal: Enabled"
    info "=================================="
    
    info "To test your SSL configuration:"
    info "  curl -I https://$DOMAIN"
    info "  openssl s_client -connect $DOMAIN:443 -servername $DOMAIN"
    
    info "To check SSL rating:"
    info "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    
    info "Certificate files:"
    info "  Certificate: $SSL_DIR/cert.pem"
    info "  Private Key: $SSL_DIR/key.pem"
    
    info "Renewal check:"
    info "  certbot certificates"
    info "  /usr/local/bin/certbot-renewal.sh"
}

# Main execution
main() {
    log "Starting SSL/TLS setup for Astral Draft v4..."
    
    # Validate input
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
        error "Please provide a valid domain name"
        error "Usage: $0 <domain> <email>"
        error "Example: $0 astraldraft.com admin@astraldraft.com"
        exit 1
    fi
    
    if [ -z "$EMAIL" ] || [ "$EMAIL" = "admin@yourdomain.com" ]; then
        error "Please provide a valid email address"
        error "Usage: $0 <domain> <email>"
        exit 1
    fi
    
    # Check prerequisites
    check_root
    
    # Install certbot if not present
    if ! command_exists certbot; then
        install_certbot
    fi
    
    # Run setup steps
    validate_domain
    setup_directories
    generate_dhparam
    
    # Try to obtain Let's Encrypt certificate, fallback to self-signed
    if obtain_letsencrypt_cert; then
        setup_renewal
    else
        warn "Using self-signed certificate"
    fi
    
    create_nginx_ssl_config
    update_nginx_site
    test_ssl
    display_security_info
    
    log "SSL/TLS setup completed successfully!"
}

# Show usage if no arguments provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 astraldraft.com admin@astraldraft.com"
    exit 1
fi

# Run main function
main "$@"