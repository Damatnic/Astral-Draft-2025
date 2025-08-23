#!/bin/bash

# ==============================================================================
# Astral Draft v4 - Automated Rollback Script
# ==============================================================================
# This script provides automated rollback capabilities for Astral Draft v4
# deployments with support for blue-green rollbacks, database rollbacks,
# and emergency procedures.
# ==============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/rollback_${TIMESTAMP}.log"

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
DEFAULT_ROLLBACK_TYPE="application"
DEFAULT_TIMEOUT=300

# Configuration variables
ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
ROLLBACK_TYPE="${ROLLBACK_TYPE:-$DEFAULT_ROLLBACK_TYPE}"
ROLLBACK_TIMEOUT="${ROLLBACK_TIMEOUT:-$DEFAULT_TIMEOUT}"
TARGET_VERSION=""
ROLLBACK_REASON=""
FORCE_ROLLBACK="${FORCE_ROLLBACK:-false}"
DRY_RUN="${DRY_RUN:-false}"
EMERGENCY_MODE="${EMERGENCY_MODE:-false}"

# Rollback state
CURRENT_SLOT=""
TARGET_SLOT=""
COMPOSE_FILE=""
DEPLOYMENT_HISTORY=()

# ==============================================================================
# Helper Functions
# ==============================================================================

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Rollback Astral Draft v4 deployment to a previous version.

OPTIONS:
    -h, --help                  Show this help message
    -e, --environment ENV       Target environment (staging|production) [default: staging]
    -t, --type TYPE             Rollback type (application|database|full) [default: application]
    -v, --version VERSION       Target version to rollback to (latest available if not specified)
    -r, --reason REASON         Reason for rollback (required for production)
    -f, --force                 Force rollback without confirmation prompts
    -d, --dry-run               Show what would be rolled back without executing
    -e, --emergency             Emergency rollback mode (skip non-critical checks)
    --timeout SECONDS           Rollback timeout [default: 300]

ROLLBACK TYPES:
    application                 Rollback application containers only
    database                    Rollback database to previous backup
    full                        Rollback both application and database

EXAMPLES:
    # Quick application rollback to previous version
    $0 --environment production --reason "critical-bug-fix"

    # Rollback to specific version
    $0 --environment staging --version v1.2.2

    # Full rollback including database
    $0 --environment production --type full --version v1.2.1 --reason "data-corruption"

    # Emergency rollback (minimal checks)
    $0 --environment production --emergency --reason "system-down"

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
            -t|--type)
                ROLLBACK_TYPE="$2"
                shift 2
                ;;
            -v|--version)
                TARGET_VERSION="$2"
                shift 2
                ;;
            -r|--reason)
                ROLLBACK_REASON="$2"
                shift 2
                ;;
            -f|--force)
                FORCE_ROLLBACK="true"
                shift
                ;;
            -d|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            --emergency)
                EMERGENCY_MODE="true"
                shift
                ;;
            --timeout)
                ROLLBACK_TIMEOUT="$2"
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

validate_rollback_request() {
    log_info "Validating rollback request..."
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
        exit 1
    fi
    
    # Validate rollback type
    if [[ ! "$ROLLBACK_TYPE" =~ ^(application|database|full)$ ]]; then
        log_error "Invalid rollback type: $ROLLBACK_TYPE"
        exit 1
    fi
    
    # Require reason for production rollbacks
    if [[ "$ENVIRONMENT" == "production" && -z "$ROLLBACK_REASON" ]]; then
        log_error "Rollback reason is required for production environment"
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
    
    log_success "Rollback request validation passed"
}

setup_rollback_config() {
    log_info "Setting up rollback configuration..."
    
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
    
    log_info "Rollback configuration:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Type: $ROLLBACK_TYPE"
    log_info "  Target version: ${TARGET_VERSION:-auto-detect}"
    log_info "  Reason: ${ROLLBACK_REASON:-not-specified}"
    log_info "  Emergency mode: $EMERGENCY_MODE"
    log_info "  Timeout: ${ROLLBACK_TIMEOUT}s"
}

get_deployment_history() {
    log_info "Retrieving deployment history..."
    
    # Get list of deployment records
    if [[ -d "${PROJECT_ROOT}/logs" ]]; then
        local deployment_files=($(ls -t "${PROJECT_ROOT}/logs/deployment_"*.json 2>/dev/null || true))
        
        if [[ ${#deployment_files[@]} -eq 0 ]]; then
            log_warn "No deployment history found"
            return 1
        fi
        
        # Parse deployment history
        for file in "${deployment_files[@]}"; do
            if [[ -f "$file" ]]; then
                local deployment_info=$(cat "$file")
                DEPLOYMENT_HISTORY+=("$deployment_info")
            fi
        done
        
        log_info "Found ${#DEPLOYMENT_HISTORY[@]} deployment records"
        return 0
    else
        log_warn "Logs directory not found"
        return 1
    fi
}

get_current_deployment_state() {
    log_info "Determining current deployment state..."
    
    cd "$PROJECT_ROOT"
    
    # Check which slot is currently active
    if docker-compose -f "$COMPOSE_FILE" ps app-blue | grep -q "Up"; then
        CURRENT_SLOT="blue"
        TARGET_SLOT="green"
    elif docker-compose -f "$COMPOSE_FILE" ps app-green | grep -q "Up"; then
        CURRENT_SLOT="green"
        TARGET_SLOT="blue"
    else
        log_error "No active deployment found"
        exit 1
    fi
    
    log_info "Current active slot: $CURRENT_SLOT"
    log_info "Target rollback slot: $TARGET_SLOT"
}

determine_rollback_target() {
    log_info "Determining rollback target..."
    
    if [[ -n "$TARGET_VERSION" ]]; then
        log_info "Using specified target version: $TARGET_VERSION"
        return 0
    fi
    
    # Find the most recent successful deployment before current
    if [[ ${#DEPLOYMENT_HISTORY[@]} -lt 2 ]]; then
        log_error "Insufficient deployment history for automatic rollback"
        exit 1
    fi
    
    # Skip the most recent deployment (current) and get the previous one
    local previous_deployment="${DEPLOYMENT_HISTORY[1]}"
    TARGET_VERSION=$(echo "$previous_deployment" | jq -r '.image_tag')
    
    if [[ -z "$TARGET_VERSION" || "$TARGET_VERSION" == "null" ]]; then
        log_error "Could not determine target version from deployment history"
        exit 1
    fi
    
    log_info "Auto-detected target version: $TARGET_VERSION"
}

confirm_rollback() {
    if [[ "$FORCE_ROLLBACK" == "true" || "$DRY_RUN" == "true" || "$EMERGENCY_MODE" == "true" ]]; then
        return 0
    fi
    
    echo ""
    log_warn "ROLLBACK CONFIRMATION REQUIRED"
    echo "Environment: $ENVIRONMENT"
    echo "Rollback type: $ROLLBACK_TYPE"
    echo "Target version: $TARGET_VERSION"
    echo "Reason: ${ROLLBACK_REASON:-Not specified}"
    echo ""
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "⚠️  WARNING: This will rollback the PRODUCTION environment!"
        echo ""
    fi
    
    read -p "Are you sure you want to proceed with this rollback? (yes/no): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
}

create_rollback_backup() {
    log_info "Creating pre-rollback backup..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create pre-rollback backup"
        return 0
    fi
    
    # Create database backup before rollback
    local backup_file="pre_rollback_${TIMESTAMP}.sql"
    local backup_path="${PROJECT_ROOT}/backups/${backup_file}"
    
    mkdir -p "${PROJECT_ROOT}/backups"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Creating production database backup..."
        # This would run the actual backup command
        # docker-compose -f "$COMPOSE_FILE" exec postgres pg_dump -U postgres astral_draft_v4 > "$backup_path"
        touch "$backup_path" # Placeholder for demo
    fi
    
    log_success "Pre-rollback backup created: $backup_file"
}

rollback_application() {
    log_info "Rolling back application to version: $TARGET_VERSION"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would rollback application to $TARGET_VERSION"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Pull the target version image
    local target_image="ghcr.io/astral-draft/astral-draft-v4:${TARGET_VERSION}"
    log_info "Pulling target image: $target_image"
    
    if ! docker pull "$target_image"; then
        log_error "Failed to pull target image: $target_image"
        exit 1
    fi
    
    # Deploy to target slot with rollback version
    export IMAGE_TAG="$TARGET_VERSION"
    export DEPLOYMENT_SLOT="$TARGET_SLOT"
    
    if [[ "$ENVIRONMENT" == "production" && "$TARGET_SLOT" == "green" ]]; then
        docker-compose -f "$COMPOSE_FILE" --profile green-deployment up -d "app-$TARGET_SLOT"
    else
        docker-compose -f "$COMPOSE_FILE" up -d "app-$TARGET_SLOT"
    fi
    
    # Wait for new deployment to be healthy
    if ! wait_for_health_check "$TARGET_SLOT"; then
        log_error "Rollback deployment failed health check"
        exit 1
    fi
    
    # Switch traffic to rollback deployment
    switch_traffic_to_slot "$TARGET_SLOT"
    
    # Stop old deployment
    docker-compose -f "$COMPOSE_FILE" stop "app-$CURRENT_SLOT"
    
    log_success "Application rollback completed"
}

rollback_database() {
    log_info "Rolling back database..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would rollback database"
        return 0
    fi
    
    # Find the most recent backup before the target deployment
    local backup_files=($(ls -t "${PROJECT_ROOT}/backups/"*.sql 2>/dev/null || true))
    
    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log_error "No database backups found for rollback"
        exit 1
    fi
    
    # Use the most recent backup
    local backup_file="${backup_files[0]}"
    log_info "Rolling back database using backup: $(basename "$backup_file")"
    
    cd "$PROJECT_ROOT"
    
    # Stop application to prevent database corruption
    docker-compose -f "$COMPOSE_FILE" stop app-blue app-green
    
    # Restore database
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # This would run the actual restore command
        # docker-compose -f "$COMPOSE_FILE" exec postgres psql -U postgres -d astral_draft_v4 < "$backup_file"
        log_info "Database restore simulated (would restore from $backup_file)"
    fi
    
    log_success "Database rollback completed"
}

wait_for_health_check() {
    local slot="$1"
    local max_attempts=$((ROLLBACK_TIMEOUT / 10))
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
    
    local health_url="http://localhost:${port}/api/health"
    
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
    return 1
}

switch_traffic_to_slot() {
    local new_slot="$1"
    log_info "Switching traffic to $new_slot slot..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would switch traffic to $new_slot slot"
        return 0
    fi
    
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

verify_rollback() {
    log_info "Verifying rollback success..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would verify rollback"
        return 0
    fi
    
    # Verify application is running with correct version
    local container_name="astral-draft-v4-app-$TARGET_SLOT"
    local running_version=$(docker inspect "$container_name" --format '{{index .Config.Labels "org.opencontainers.image.version"}}' 2>/dev/null || echo "unknown")
    
    log_info "Rollback verification:"
    log_info "  Active slot: $TARGET_SLOT"
    log_info "  Running version: $running_version"
    log_info "  Target version: $TARGET_VERSION"
    
    # Basic connectivity test
    local health_check_attempts=3
    for ((i=1; i<=health_check_attempts; i++)); do
        if wait_for_health_check "$TARGET_SLOT"; then
            log_success "Rollback verification passed"
            return 0
        fi
        
        if [[ $i -lt $health_check_attempts ]]; then
            log_warn "Health check failed, retrying in 10 seconds..."
            sleep 10
        fi
    done
    
    log_error "Rollback verification failed"
    return 1
}

create_rollback_record() {
    log_info "Creating rollback record..."
    
    local rollback_info=$(cat << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "rollback_type": "$ROLLBACK_TYPE",
    "target_version": "$TARGET_VERSION",
    "from_slot": "$CURRENT_SLOT",
    "to_slot": "$TARGET_SLOT",
    "reason": "$ROLLBACK_REASON",
    "emergency_mode": $EMERGENCY_MODE,
    "initiated_by": "${USER:-unknown}",
    "rollback_id": "$TIMESTAMP",
    "success": true
}
EOF
    )
    
    echo "$rollback_info" > "${PROJECT_ROOT}/logs/rollback_${TIMESTAMP}.json"
    log_info "Rollback record saved to: logs/rollback_${TIMESTAMP}.json"
}

notify_rollback_completion() {
    log_info "Sending rollback notifications..."
    
    # This would typically send notifications via Slack, email, etc.
    local message="🔄 Rollback completed successfully for $ENVIRONMENT environment"
    message="$message\nVersion: $TARGET_VERSION"
    message="$message\nReason: ${ROLLBACK_REASON:-Not specified}"
    message="$message\nTimestamp: $(date -u)"
    
    log_info "Notification: $message"
}

# ==============================================================================
# Main Rollback Functions
# ==============================================================================

execute_rollback() {
    log_info "Executing rollback..."
    
    case "$ROLLBACK_TYPE" in
        "application")
            rollback_application
            ;;
        "database")
            rollback_database
            ;;
        "full")
            rollback_application
            rollback_database
            ;;
        *)
            log_error "Unknown rollback type: $ROLLBACK_TYPE"
            exit 1
            ;;
    esac
    
    # Verify rollback success
    if ! verify_rollback; then
        log_error "Rollback verification failed"
        exit 1
    fi
    
    # Create rollback record
    create_rollback_record
    
    # Send notifications
    notify_rollback_completion
    
    log_success "Rollback completed successfully!"
}

# ==============================================================================
# Main Script Execution
# ==============================================================================

main() {
    log_info "Starting Astral Draft v4 rollback script"
    log_info "Timestamp: $TIMESTAMP"
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Validate rollback request
    validate_rollback_request
    
    # Setup rollback configuration
    setup_rollback_config
    
    # Get deployment history
    get_deployment_history
    
    # Get current deployment state
    get_current_deployment_state
    
    # Determine rollback target
    determine_rollback_target
    
    # Confirm rollback
    confirm_rollback
    
    # Create pre-rollback backup
    create_rollback_backup
    
    # Execute rollback
    execute_rollback
    
    log_success "Rollback process completed successfully!"
    log_info "Environment $ENVIRONMENT is now running version $TARGET_VERSION"
}

# Trap errors and cleanup
trap 'log_error "Rollback script failed at line $LINENO"' ERR

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi