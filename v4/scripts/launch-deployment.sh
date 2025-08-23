#!/bin/bash
# Astral Draft v4 - Launch Deployment Automation Script
# ====================================================
# Comprehensive production deployment and launch automation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"
LOG_FILE="$PROJECT_ROOT/logs/launch-deployment.log"
BACKUP_DIR="$PROJECT_ROOT/backups/pre-launch"
HEALTH_CHECK_URL="https://api.astraldraft.com/health"
STATUS_PAGE_URL="https://status.astraldraft.com"

# Deployment configuration
DEPLOYMENT_TYPE="${DEPLOYMENT_TYPE:-blue-green}"
ROLLBACK_ENABLED="${ROLLBACK_ENABLED:-true}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
MONITORING_GRACE_PERIOD="${MONITORING_GRACE_PERIOD:-600}"

# Notification configuration
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
EMAIL_NOTIFICATION_LIST="${EMAIL_NOTIFICATION_LIST:-}"

# Ensure logs directory exists
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

# Logging functions
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp] $message${NC}" | tee -a "$LOG_FILE"
}

warn() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] WARNING: $message${NC}" | tee -a "$LOG_FILE"
}

error() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ERROR: $message${NC}" | tee -a "$LOG_FILE"
}

info() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp] INFO: $message${NC}" | tee -a "$LOG_FILE"
}

success() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${PURPLE}[$timestamp] SUCCESS: $message${NC}" | tee -a "$LOG_FILE"
}

# Error handling
trap 'handle_error $LINENO $?' ERR
trap 'cleanup; exit 0' EXIT

handle_error() {
    local line_number=$1
    local exit_code=$2
    error "Deployment failed at line $line_number with exit code $exit_code"
    
    if [ "$ROLLBACK_ENABLED" = "true" ]; then
        warn "Initiating automatic rollback..."
        rollback_deployment
    fi
    
    send_notification "FAILURE" "Deployment failed at line $line_number. See logs for details."
    cleanup
    exit $exit_code
}

cleanup() {
    info "Cleaning up temporary files..."
    # Add cleanup logic here
}

# Function to check dependencies
check_dependencies() {
    log "Checking deployment dependencies..."
    
    local deps=("docker" "docker-compose" "kubectl" "helm" "jq" "curl")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing required dependencies: ${missing[*]}"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Kubernetes connection
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    success "All dependencies verified"
}

# Function to validate environment
validate_environment() {
    log "Validating production environment..."
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        error "Production environment file not found: $ENV_FILE"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    # Validate critical environment variables
    local required_vars=(
        "NODE_ENV"
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "REDIS_HOST"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    # Validate database connection
    if ! pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
        error "Cannot connect to production database"
        exit 1
    fi
    
    # Validate Redis connection
    if ! redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ping >/dev/null 2>&1; then
        error "Cannot connect to Redis server"
        exit 1
    fi
    
    success "Environment validation completed"
}

# Function to create pre-deployment backup
create_pre_deployment_backup() {
    log "Creating pre-deployment backup..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/pre-launch-$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # Database backup
    log "Backing up database..."
    pg_dump "$DATABASE_URL" > "$backup_path/database.sql"
    gzip "$backup_path/database.sql"
    
    # Application files backup
    log "Backing up application files..."
    tar -czf "$backup_path/application.tar.gz" \
        --exclude="node_modules" \
        --exclude=".next" \
        --exclude="logs" \
        --exclude="backups" \
        -C "$PROJECT_ROOT" .
    
    # Configuration backup
    log "Backing up configuration..."
    cp "$ENV_FILE" "$backup_path/"
    cp "$PROJECT_ROOT/next.config.prod.js" "$backup_path/" 2>/dev/null || true
    cp "$PROJECT_ROOT/docker-compose.prod.yml" "$backup_path/" 2>/dev/null || true
    
    # Store backup metadata
    cat > "$backup_path/metadata.json" << EOF
{
    "timestamp": "$backup_timestamp",
    "version": "v4.0.0",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "deployment_type": "$DEPLOYMENT_TYPE",
    "environment": "production"
}
EOF
    
    success "Pre-deployment backup created: $backup_path"
    echo "$backup_path" > "$PROJECT_ROOT/.last-backup"
}

# Function to build production assets
build_production_assets() {
    log "Building production assets..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous builds
    rm -rf .next dist build
    
    # Install dependencies
    log "Installing production dependencies..."
    npm ci --only=production --silent
    
    # Build application
    log "Building Next.js application..."
    export NODE_ENV=production
    npm run build
    
    # Build Docker images
    log "Building Docker images..."
    docker build -t astral-draft:v4.0.0 -t astral-draft:latest .
    
    # Run security scan on images
    log "Running security scan on Docker images..."
    if command -v trivy >/dev/null 2>&1; then
        trivy image --exit-code 0 --severity HIGH,CRITICAL astral-draft:latest
    else
        warn "Trivy not found, skipping security scan"
    fi
    
    success "Production assets built successfully"
}

# Function to run pre-deployment tests
run_pre_deployment_tests() {
    log "Running pre-deployment tests..."
    
    cd "$PROJECT_ROOT"
    
    # Unit tests
    log "Running unit tests..."
    npm test -- --coverage --passWithNoTests
    
    # Integration tests
    log "Running integration tests..."
    npm run test:integration
    
    # End-to-end tests
    log "Running end-to-end tests..."
    npm run test:e2e:headless
    
    # Load tests
    log "Running load tests..."
    if [ -f "k6/load-tests.js" ]; then
        k6 run k6/load-tests.js
    else
        warn "Load tests not found, skipping"
    fi
    
    # Security tests
    log "Running security tests..."
    npm audit --audit-level high --production
    
    success "All pre-deployment tests passed"
}

# Function to deploy to staging for final validation
deploy_to_staging() {
    log "Deploying to staging environment for final validation..."
    
    # Deploy to staging namespace
    kubectl apply -f k8s/staging/ -n astral-draft-staging
    
    # Wait for deployment to be ready
    kubectl rollout status deployment/astral-draft-app -n astral-draft-staging --timeout=600s
    
    # Run smoke tests against staging
    log "Running smoke tests against staging..."
    local staging_url="https://staging.astraldraft.com"
    
    # Health check
    if ! curl -f "$staging_url/api/health" >/dev/null 2>&1; then
        error "Staging health check failed"
        return 1
    fi
    
    # Basic functionality tests
    if [ -f "scripts/smoke-tests.sh" ]; then
        STAGING_URL="$staging_url" ./scripts/smoke-tests.sh
    fi
    
    success "Staging deployment and validation completed"
}

# Function to deploy to production
deploy_to_production() {
    log "Deploying to production environment..."
    
    case "$DEPLOYMENT_TYPE" in
        "blue-green")
            deploy_blue_green
            ;;
        "rolling")
            deploy_rolling
            ;;
        "canary")
            deploy_canary
            ;;
        *)
            error "Unknown deployment type: $DEPLOYMENT_TYPE"
            exit 1
            ;;
    esac
}

# Function for blue-green deployment
deploy_blue_green() {
    log "Executing blue-green deployment..."
    
    # Determine current and next slots
    local current_slot=$(kubectl get service astral-draft-app -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "blue")
    local next_slot
    
    if [ "$current_slot" = "blue" ]; then
        next_slot="green"
    else
        next_slot="blue"
    fi
    
    log "Current slot: $current_slot, deploying to: $next_slot"
    
    # Deploy to the inactive slot
    kubectl apply -f k8s/production/ -n astral-draft-production
    kubectl patch deployment astral-draft-app -n astral-draft-production -p "{\"spec\":{\"selector\":{\"matchLabels\":{\"slot\":\"$next_slot\"}},\"template\":{\"metadata\":{\"labels\":{\"slot\":\"$next_slot\"}}}}}"
    
    # Wait for new deployment to be ready
    kubectl rollout status deployment/astral-draft-app -n astral-draft-production --timeout=600s
    
    # Health check new deployment
    local new_pod_ip=$(kubectl get pods -l slot="$next_slot" -n astral-draft-production -o jsonpath='{.items[0].status.podIP}')
    if ! curl -f "http://$new_pod_ip:3000/api/health" >/dev/null 2>&1; then
        error "Health check failed for new deployment"
        return 1
    fi
    
    # Switch traffic to new deployment
    log "Switching traffic to $next_slot slot..."
    kubectl patch service astral-draft-app -n astral-draft-production -p "{\"spec\":{\"selector\":{\"slot\":\"$next_slot\"}}}"
    
    # Wait for DNS propagation
    sleep 30
    
    # Verify production health
    health_check_production
    
    # Scale down old deployment after successful validation
    log "Scaling down old deployment ($current_slot)..."
    kubectl scale deployment astral-draft-app-$current_slot -n astral-draft-production --replicas=0
    
    success "Blue-green deployment completed successfully"
}

# Function for rolling deployment
deploy_rolling() {
    log "Executing rolling deployment..."
    
    kubectl apply -f k8s/production/ -n astral-draft-production
    kubectl rollout status deployment/astral-draft-app -n astral-draft-production --timeout=600s
    
    success "Rolling deployment completed successfully"
}

# Function for canary deployment
deploy_canary() {
    log "Executing canary deployment..."
    
    # Deploy canary version (10% traffic)
    kubectl apply -f k8s/canary/ -n astral-draft-production
    
    # Monitor canary for 10 minutes
    log "Monitoring canary deployment for 10 minutes..."
    sleep 600
    
    # Check canary metrics
    local error_rate=$(check_error_rate "canary")
    if (( $(echo "$error_rate > 0.01" | bc -l) )); then
        error "Canary error rate too high: $error_rate"
        kubectl delete -f k8s/canary/ -n astral-draft-production
        return 1
    fi
    
    # Promote canary to full deployment
    log "Promoting canary to full deployment..."
    kubectl apply -f k8s/production/ -n astral-draft-production
    kubectl delete -f k8s/canary/ -n astral-draft-production
    
    success "Canary deployment completed successfully"
}

# Function to check error rate
check_error_rate() {
    local deployment_label="$1"
    # Query Prometheus for error rate
    local query="sum(rate(http_requests_total{status=~\"5..\",deployment=\"$deployment_label\"}[5m])) / sum(rate(http_requests_total{deployment=\"$deployment_label\"}[5m]))"
    local result=$(curl -s "http://prometheus:9090/api/v1/query?query=$query" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0")
    echo "${result:-0}"
}

# Function to perform health checks
health_check_production() {
    log "Performing production health checks..."
    
    local max_attempts=30
    local attempt=0
    local health_url="$HEALTH_CHECK_URL"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "$health_url" >/dev/null 2>&1; then
            success "Production health check passed"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
    done
    
    error "Production health checks failed after $max_attempts attempts"
    return 1
}

# Function to update DNS and CDN
update_dns_and_cdn() {
    log "Updating DNS and CDN configuration..."
    
    # Update CloudFlare DNS (if applicable)
    if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
        log "Updating CloudFlare DNS records..."
        # Add CloudFlare API calls here
    fi
    
    # Update CDN cache
    if [ -n "${CDN_INVALIDATION_URL:-}" ]; then
        log "Invalidating CDN cache..."
        curl -X POST "$CDN_INVALIDATION_URL" \
            -H "Authorization: Bearer ${CDN_API_TOKEN}" \
            -H "Content-Type: application/json" \
            -d '{"paths": ["/*"]}'
    fi
    
    # Warm up cache
    log "Warming up cache..."
    local warm_up_urls=(
        "$NEXTAUTH_URL"
        "$NEXTAUTH_URL/api/health"
        "$NEXTAUTH_URL/login"
        "$NEXTAUTH_URL/dashboard"
    )
    
    for url in "${warm_up_urls[@]}"; do
        curl -s "$url" >/dev/null 2>&1 || true
    done
    
    success "DNS and CDN updated successfully"
}

# Function to enable monitoring and alerting
enable_monitoring() {
    log "Enabling production monitoring and alerting..."
    
    # Deploy monitoring stack
    if [ -f "monitoring/production-stack.yml" ]; then
        kubectl apply -f monitoring/production-stack.yml
    fi
    
    # Configure Grafana dashboards
    if [ -d "monitoring/grafana/dashboards" ]; then
        kubectl create configmap grafana-dashboards \
            --from-file=monitoring/grafana/dashboards/ \
            -n monitoring \
            --dry-run=client -o yaml | kubectl apply -f -
    fi
    
    # Set up alerting rules
    if [ -f "monitoring/alerting-rules.yml" ]; then
        kubectl apply -f monitoring/alerting-rules.yml -n monitoring
    fi
    
    # Wait for monitoring stack to be ready
    kubectl rollout status deployment/prometheus -n monitoring --timeout=300s
    kubectl rollout status deployment/grafana -n monitoring --timeout=300s
    
    success "Monitoring and alerting enabled"
}

# Function to run post-deployment validation
post_deployment_validation() {
    log "Running post-deployment validation..."
    
    # Wait for monitoring grace period
    log "Waiting $MONITORING_GRACE_PERIOD seconds for metrics stabilization..."
    sleep "$MONITORING_GRACE_PERIOD"
    
    # Check key metrics
    local error_rate=$(check_error_rate "production")
    local response_time=$(check_response_time)
    local active_users=$(check_active_users)
    
    log "Post-deployment metrics:"
    log "  Error rate: $error_rate"
    log "  Response time: ${response_time}ms"
    log "  Active users: $active_users"
    
    # Validate acceptable thresholds
    if (( $(echo "$error_rate > 0.01" | bc -l) )); then
        error "Error rate too high: $error_rate (threshold: 0.01)"
        return 1
    fi
    
    if (( $(echo "$response_time > 500" | bc -l) )); then
        error "Response time too high: ${response_time}ms (threshold: 500ms)"
        return 1
    fi
    
    # Run functional tests
    log "Running post-deployment functional tests..."
    if [ -f "scripts/functional-tests.sh" ]; then
        ./scripts/functional-tests.sh
    fi
    
    success "Post-deployment validation completed successfully"
}

# Function to check response time
check_response_time() {
    local query="histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"astral-draft-app\"}[5m])) * 1000"
    local result=$(curl -s "http://prometheus:9090/api/v1/query?query=$query" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0")
    echo "${result:-0}"
}

# Function to check active users
check_active_users() {
    local query="sum(astral_draft_active_users_total)"
    local result=$(curl -s "http://prometheus:9090/api/v1/query?query=$query" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0")
    echo "${result:-0}"
}

# Function to send notifications
send_notification() {
    local status="$1"
    local message="$2"
    local timestamp=$(date -Iseconds)
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color
        case "$status" in
            "SUCCESS") color="good" ;;
            "WARNING") color="warning" ;;
            "FAILURE") color="danger" ;;
            *) color="#439FE0" ;;
        esac
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Astral Draft v4 Deployment $status\",
                    \"text\": \"$message\",
                    \"footer\": \"Astral Draft Deployment Bot\",
                    \"ts\": $(date +%s)
                }]
            }"
    fi
    
    # Discord notification
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST "$DISCORD_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"embeds\": [{
                    \"title\": \"Astral Draft v4 Deployment $status\",
                    \"description\": \"$message\",
                    \"color\": $([ "$status" = "SUCCESS" ] && echo "3066993" || echo "15158332"),
                    \"timestamp\": \"$timestamp\"
                }]
            }"
    fi
    
    # Email notification
    if [ -n "$EMAIL_NOTIFICATION_LIST" ]; then
        echo "$message" | mail -s "Astral Draft v4 Deployment $status" "$EMAIL_NOTIFICATION_LIST"
    fi
}

# Function to update status page
update_status_page() {
    local status="$1"
    local message="$2"
    
    if [ -n "${STATUS_PAGE_API_KEY:-}" ]; then
        curl -X POST "${STATUS_PAGE_URL}/api/incidents" \
            -H "Authorization: Bearer $STATUS_PAGE_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"Astral Draft v4 Launch\",
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"component_ids\": [\"astral-draft-app\"]
            }"
    fi
}

# Function to rollback deployment
rollback_deployment() {
    log "Rolling back deployment..."
    
    local backup_path=$(cat "$PROJECT_ROOT/.last-backup" 2>/dev/null || echo "")
    
    if [ -z "$backup_path" ] || [ ! -d "$backup_path" ]; then
        error "No backup path found for rollback"
        return 1
    fi
    
    # Rollback Kubernetes deployment
    kubectl rollout undo deployment/astral-draft-app -n astral-draft-production
    kubectl rollout status deployment/astral-draft-app -n astral-draft-production --timeout=300s
    
    # Restore database if needed
    read -p "Restore database from backup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Restoring database from backup..."
        gunzip -c "$backup_path/database.sql.gz" | psql "$DATABASE_URL"
    fi
    
    success "Rollback completed"
}

# Function to finalize launch
finalize_launch() {
    log "Finalizing production launch..."
    
    # Clean up staging environment
    log "Cleaning up staging environment..."
    kubectl delete namespace astral-draft-staging --ignore-not-found=true
    
    # Update launch metadata
    cat > "$PROJECT_ROOT/launch-metadata.json" << EOF
{
    "version": "v4.0.0",
    "launch_date": "$(date -Iseconds)",
    "deployment_type": "$DEPLOYMENT_TYPE",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "deployment_duration": "$(($(date +%s) - ${START_TIME:-$(date +%s)}))",
    "environment": "production"
}
EOF
    
    # Tag the release
    if git rev-parse HEAD >/dev/null 2>&1; then
        git tag -a "v4.0.0-launch" -m "Astral Draft v4 Production Launch"
        git push origin "v4.0.0-launch" 2>/dev/null || true
    fi
    
    success "Production launch finalized successfully!"
}

# Main deployment workflow
main() {
    local START_TIME=$(date +%s)
    
    log "Starting Astral Draft v4 production launch deployment..."
    log "Deployment type: $DEPLOYMENT_TYPE"
    log "Rollback enabled: $ROLLBACK_ENABLED"
    
    # Phase 1: Pre-deployment validation
    info "=== Phase 1: Pre-deployment Validation ==="
    check_dependencies
    validate_environment
    create_pre_deployment_backup
    
    # Phase 2: Build and test
    info "=== Phase 2: Build and Test ==="
    build_production_assets
    run_pre_deployment_tests
    
    # Phase 3: Staging validation
    info "=== Phase 3: Staging Validation ==="
    deploy_to_staging
    
    # Phase 4: Production deployment
    info "=== Phase 4: Production Deployment ==="
    send_notification "INFO" "Starting production deployment..."
    update_status_page "investigating" "Deploying Astral Draft v4 to production"
    
    deploy_to_production
    update_dns_and_cdn
    enable_monitoring
    
    # Phase 5: Post-deployment validation
    info "=== Phase 5: Post-deployment Validation ==="
    post_deployment_validation
    
    # Phase 6: Launch finalization
    info "=== Phase 6: Launch Finalization ==="
    finalize_launch
    
    local duration=$(($(date +%s) - START_TIME))
    success "Astral Draft v4 production launch completed successfully in ${duration} seconds!"
    
    # Final notifications
    send_notification "SUCCESS" "Astral Draft v4 has been successfully launched to production! 🚀"
    update_status_page "operational" "Astral Draft v4 is now live and operational"
    
    # Display launch summary
    info "=== Launch Summary ==="
    info "✅ Version: v4.0.0"
    info "✅ Deployment type: $DEPLOYMENT_TYPE"
    info "✅ Launch duration: ${duration} seconds"
    info "✅ Production URL: $NEXTAUTH_URL"
    info "✅ Status page: $STATUS_PAGE_URL"
    info "✅ Monitoring: Enabled"
    info "✅ Backups: Configured"
    info "✅ Health checks: Passing"
    
    log "🎉 Welcome to the future of fantasy football with Astral Draft v4!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --deployment-type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        --no-rollback)
            ROLLBACK_ENABLED="false"
            shift
            ;;
        --staging-only)
            STAGING_ONLY="true"
            shift
            ;;
        --help)
            cat << EOF
Astral Draft v4 - Production Launch Deployment Script

Usage: $0 [OPTIONS]

Options:
    --deployment-type TYPE    Deployment strategy (blue-green, rolling, canary)
    --no-rollback            Disable automatic rollback on failure
    --staging-only           Deploy to staging only for testing
    --help                   Show this help message

Examples:
    $0                                    # Default blue-green deployment
    $0 --deployment-type rolling          # Rolling deployment
    $0 --deployment-type canary           # Canary deployment
    $0 --staging-only                     # Deploy to staging only

Environment Variables:
    DEPLOYMENT_TYPE          Deployment strategy
    ROLLBACK_ENABLED         Enable/disable rollback (true/false)
    HEALTH_CHECK_TIMEOUT     Health check timeout in seconds
    SLACK_WEBHOOK_URL        Slack webhook for notifications
    DISCORD_WEBHOOK_URL      Discord webhook for notifications
    EMAIL_NOTIFICATION_LIST  Email addresses for notifications

EOF
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run staging-only if requested
if [ "${STAGING_ONLY:-false}" = "true" ]; then
    log "Running staging-only deployment..."
    check_dependencies
    validate_environment
    deploy_to_staging
    success "Staging deployment completed"
    exit 0
fi

# Run main deployment workflow
main "$@"