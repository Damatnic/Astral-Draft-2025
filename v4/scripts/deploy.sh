#!/bin/bash

# ==============================================================================
# Astral Draft v4 - Blue-Green Deployment Script
# ==============================================================================
# This script implements a zero-downtime blue-green deployment strategy for
# the Astral Draft v4 application with comprehensive health checks and rollback
# capabilities.
# ==============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/deploy_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p "${PROJECT_ROOT}/logs"

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO: $*"
}

log_warn() {
    log "WARN: $*"
}

log_error() {
    log "ERROR: $*"
}

log_success() {
    log "SUCCESS: $*"
}

# Default configuration
DEFAULT_ENVIRONMENT="staging"
DEFAULT_STRATEGY="blue-green"
DEFAULT_HEALTH_ENDPOINT="/api/health"
DEFAULT_TIMEOUT=300
DEFAULT_REGISTRY="ghcr.io/astral-draft"

# Configuration variables
ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
DEPLOYMENT_STRATEGY="${DEPLOYMENT_STRATEGY:-$DEFAULT_STRATEGY}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-$DEFAULT_REGISTRY}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-$DEFAULT_HEALTH_ENDPOINT}"
DEPLOYMENT_TIMEOUT="${DEPLOYMENT_TIMEOUT:-$DEFAULT_TIMEOUT}"
FORCE_DEPLOY="${FORCE_DEPLOY:-false}"
DRY_RUN="${DRY_RUN:-false}"

# Blue-green deployment state
CURRENT_SLOT=""
TARGET_SLOT=""
COMPOSE_FILE=""

# ==============================================================================
# Helper Functions
# ==============================================================================

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Astral Draft v4 using blue-green deployment strategy.

OPTIONS:
    -h, --help                  Show this help message
    -e, --environment ENV       Target environment (staging|production) [default: staging]
    -i, --image TAG             Docker image tag to deploy [default: latest]
    -s, --strategy STRATEGY     Deployment strategy (blue-green|rolling) [default: blue-green]
    -r, --registry REGISTRY     Docker registry [default: ghcr.io/astral-draft]
    -t, --timeout SECONDS       Health check timeout [default: 300]
    -f, --force                 Force deployment even if health checks fail
    -d, --dry-run               Show what would be deployed without executing
    --health-endpoint PATH      Health check endpoint [default: /api/health]

ENVIRONMENT VARIABLES:
    DATABASE_URL                Production database connection string
    REDIS_URL                   Redis connection string
    NEXTAUTH_SECRET            NextAuth.js secret key
    NEXTAUTH_URL               Application URL
    AZURE_CREDENTIALS          Azure deployment credentials

EXAMPLES:
    # Deploy to staging
    $0 --environment staging --image v1.2.3

    # Deploy to production with custom timeout
    $0 --environment production --image latest --timeout 600

    # Dry run deployment
    $0 --environment production --image v1.2.3 --dry-run

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -i|--image)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -s|--strategy)
                DEPLOYMENT_STRATEGY="$2"
                shift 2
                ;;
            -r|--registry)
                REGISTRY="$2"
                shift 2
                ;;
            -t|--timeout)
                DEPLOYMENT_TIMEOUT="$2"
                shift 2
                ;;
            -f|--force)
                FORCE_DEPLOY="true"
                shift
                ;;
            -d|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            --health-endpoint)
                HEALTH_ENDPOINT="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

validate_environment() {
    log_info "Validating deployment environment..."
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
        exit 1
    fi
    
    # Validate strategy
    if [[ ! "$DEPLOYMENT_STRATEGY" =~ ^(blue-green|rolling)$ ]]; then
        log_error "Invalid deployment strategy: $DEPLOYMENT_STRATEGY"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("docker" "docker-compose" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Validate environment variables for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local required_vars=("DATABASE_URL" "REDIS_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
        for var in "${required_vars[@]}"; do
            if [[ -z "${!var:-}" ]]; then
                log_error "Required environment variable not set: $var"
                exit 1
            fi
        done
    fi
    
    log_success "Environment validation passed"
}

setup_deployment_config() {
    log_info "Setting up deployment configuration..."
    
    # Set compose file based on environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Verify compose file exists
    if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # Set image name
    export IMAGE_NAME="${REGISTRY}/astral-draft-v4:${IMAGE_TAG}"
    
    log_info "Configuration:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Strategy: $DEPLOYMENT_STRATEGY"
    log_info "  Image: $IMAGE_NAME"
    log_info "  Compose file: $COMPOSE_FILE"
    log_info "  Health endpoint: $HEALTH_ENDPOINT"
    log_info "  Timeout: ${DEPLOYMENT_TIMEOUT}s"
}

get_current_deployment_slot() {
    log_info "Determining current deployment slot..."
    
    # Check which slot is currently active
    if docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps app-blue | grep -q "Up"; then
        CURRENT_SLOT="blue"
        TARGET_SLOT="green"
    elif docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps app-green | grep -q "Up"; then
        CURRENT_SLOT="green"
        TARGET_SLOT="blue"
    else
        # No active deployment, start with blue
        CURRENT_SLOT=""
        TARGET_SLOT="blue"
    fi
    
    log_info "Current slot: ${CURRENT_SLOT:-none}"
    log_info "Target slot: $TARGET_SLOT"
}

pull_docker_image() {
    log_info "Pulling Docker image: $IMAGE_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would pull $IMAGE_NAME"
        return 0
    fi
    
    if ! docker pull "$IMAGE_NAME"; then
        log_error "Failed to pull Docker image: $IMAGE_NAME"
        exit 1
    fi
    
    log_success "Docker image pulled successfully"
}

deploy_to_slot() {
    local slot="$1"
    log_info "Deploying to $slot slot..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy to $slot slot"
        return 0
    fi
    
    # Set environment variables for this deployment
    export IMAGE_TAG="$IMAGE_TAG"
    export DEPLOYMENT_SLOT="$slot"
    
    # Deploy to target slot
    cd "$PROJECT_ROOT"
    if [[ "$ENVIRONMENT" == "production" && "$slot" == "green" ]]; then
        # Enable green profile for production
        docker-compose -f "$COMPOSE_FILE" --profile green-deployment up -d "app-$slot"
    else
        docker-compose -f "$COMPOSE_FILE" up -d "app-$slot"
    fi
    
    log_success "Deployment to $slot slot initiated"
}

wait_for_health_check() {
    local slot="$1"
    local max_attempts=$((DEPLOYMENT_TIMEOUT / 10))
    local attempt=0
    
    log_info "Waiting for health check on $slot slot..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would wait for health check on $slot slot"
        return 0
    fi
    
    # Get container port mapping
    local container_name="astral-draft-v4-app-$slot"
    local port=$(docker port "$container_name" 3000 2>/dev/null | cut -d: -f2)
    
    if [[ -z "$port" ]]; then
        log_error "Could not determine port for container: $container_name"
        return 1
    fi
    
    local health_url="http://localhost:${port}${HEALTH_ENDPOINT}"
    
    while [[ $attempt -lt $max_attempts ]]; do
        log_info "Health check attempt $((attempt + 1))/$max_attempts for $slot slot"
        
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            log_success "Health check passed for $slot slot"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed for $slot slot after $max_attempts attempts"
    
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        log_warn "Forcing deployment despite health check failure"
        return 0
    fi
    
    return 1
}

run_smoke_tests() {
    local slot="$1"
    log_info "Running smoke tests on $slot slot..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would run smoke tests on $slot slot"
        return 0
    fi
    
    # Get container port mapping
    local container_name="astral-draft-v4-app-$slot"
    local port=$(docker port "$container_name" 3000 2>/dev/null | cut -d: -f2)
    local base_url="http://localhost:${port}"
    
    # Basic smoke tests
    local endpoints=("/api/health" "/api/auth/session" "/")
    local failed_tests=0
    
    for endpoint in "${endpoints[@]}"; do
        log_info "Testing endpoint: $endpoint"
        if ! curl -f -s "${base_url}${endpoint}" > /dev/null; then
            log_error "Smoke test failed for endpoint: $endpoint"
            ((failed_tests++))
        fi
    done
    
    if [[ $failed_tests -gt 0 ]]; then
        log_error "Smoke tests failed: $failed_tests/$((${#endpoints[@]}))"
        return 1
    fi
    
    log_success "All smoke tests passed for $slot slot"
    return 0
}

switch_traffic() {
    local new_slot="$1"
    log_info "Switching traffic to $new_slot slot..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would switch traffic to $new_slot slot"
        return 0
    fi
    
    # Update load balancer configuration
    # This would typically update nginx configuration or load balancer rules
    # For now, we'll simulate this by updating environment variables
    
    cd "$PROJECT_ROOT"
    
    # Update nginx configuration to point to new slot
    if [[ -f "nginx/nginx.conf" ]]; then
        sed -i.bak "s/app-blue:3000/app-$new_slot:3000/g" nginx/nginx.conf
        sed -i.bak "s/app-green:3000/app-$new_slot:3000/g" nginx/nginx.conf
        
        # Reload nginx configuration
        docker-compose -f "$COMPOSE_FILE" exec nginx nginx -s reload
    fi
    
    log_success "Traffic switched to $new_slot slot"
}

cleanup_old_deployment() {
    local old_slot="$1"
    log_info "Cleaning up old deployment in $old_slot slot..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would cleanup $old_slot slot"
        return 0
    fi
    
    if [[ -n "$old_slot" ]]; then
        cd "$PROJECT_ROOT"
        
        # Wait a bit to ensure traffic has switched
        sleep 30
        
        # Stop old container
        docker-compose -f "$COMPOSE_FILE" stop "app-$old_slot"
        
        # Optionally remove old container
        docker-compose -f "$COMPOSE_FILE" rm -f "app-$old_slot"
        
        log_success "Cleaned up old deployment in $old_slot slot"
    fi
}

create_deployment_record() {
    log_info "Creating deployment record..."
    
    local deployment_info=$(cat << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "image_tag": "$IMAGE_TAG",
    "deployment_slot": "$TARGET_SLOT",
    "previous_slot": "$CURRENT_SLOT",
    "strategy": "$DEPLOYMENT_STRATEGY",
    "git_commit": "${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo 'unknown')}",
    "deployed_by": "${USER:-unknown}",
    "deployment_id": "${GITHUB_RUN_ID:-$TIMESTAMP}"
}
EOF
    )
    
    echo "$deployment_info" > "${PROJECT_ROOT}/logs/deployment_${TIMESTAMP}.json"
    log_info "Deployment record saved to: logs/deployment_${TIMESTAMP}.json"
}

rollback_on_failure() {
    local failed_slot="$1"
    log_error "Deployment failed, initiating rollback..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would rollback from $failed_slot slot"
        return 0
    fi
    
    # Stop failed deployment
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" stop "app-$failed_slot"
    
    # If there's a previous deployment, switch back to it
    if [[ -n "$CURRENT_SLOT" ]]; then
        log_info "Switching traffic back to $CURRENT_SLOT slot"
        switch_traffic "$CURRENT_SLOT"
    fi
    
    log_error "Rollback completed"
}

# ==============================================================================
# Main Deployment Function
# ==============================================================================

deploy_blue_green() {
    log_info "Starting blue-green deployment..."
    
    # Get current deployment state
    get_current_deployment_slot
    
    # Pull new image
    pull_docker_image
    
    # Deploy to target slot
    deploy_to_slot "$TARGET_SLOT"
    
    # Wait for application to be healthy
    if ! wait_for_health_check "$TARGET_SLOT"; then
        rollback_on_failure "$TARGET_SLOT"
        exit 1
    fi
    
    # Run smoke tests
    if ! run_smoke_tests "$TARGET_SLOT"; then
        if [[ "$FORCE_DEPLOY" != "true" ]]; then
            rollback_on_failure "$TARGET_SLOT"
            exit 1
        fi
    fi
    
    # Switch traffic to new deployment
    switch_traffic "$TARGET_SLOT"
    
    # Final health check after traffic switch
    sleep 10
    if ! wait_for_health_check "$TARGET_SLOT"; then
        log_warn "Health check failed after traffic switch"
        if [[ "$FORCE_DEPLOY" != "true" ]]; then
            rollback_on_failure "$TARGET_SLOT"
            exit 1
        fi
    fi
    
    # Clean up old deployment
    cleanup_old_deployment "$CURRENT_SLOT"
    
    # Create deployment record
    create_deployment_record
    
    log_success "Blue-green deployment completed successfully!"
    log_info "Active slot: $TARGET_SLOT"
    log_info "Image: $IMAGE_NAME"
}

# ==============================================================================
# Main Script Execution
# ==============================================================================

main() {
    log_info "Starting Astral Draft v4 deployment script"
    log_info "Timestamp: $TIMESTAMP"
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Validate environment and dependencies
    validate_environment
    
    # Setup deployment configuration
    setup_deployment_config
    
    # Execute deployment based on strategy
    case "$DEPLOYMENT_STRATEGY" in
        "blue-green")
            deploy_blue_green
            ;;
        "rolling")
            log_error "Rolling deployment strategy not yet implemented"
            exit 1
            ;;
        *)
            log_error "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
            exit 1
            ;;
    esac
    
    log_success "Deployment completed successfully!"
}

# Trap errors and cleanup
trap 'log_error "Deployment script failed at line $LINENO"' ERR

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi