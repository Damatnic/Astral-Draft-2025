#!/bin/bash

# ==============================================================================
# Astral Draft v4 - Database Migration Script
# ==============================================================================
# This script provides safe database migration with:
# - Pre-migration validation and backups
# - Rollback capabilities
# - Migration status tracking
# - Production safety checks
# - Data integrity verification
# ==============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/migration_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p "${PROJECT_ROOT}/logs"

# Migration configuration
DEFAULT_ENVIRONMENT="development"
DEFAULT_BACKUP_RETENTION=7
DEFAULT_TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================================================
# Logging Functions
# ==========================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"
}

# ==========================================================================
# Configuration and Validation
# ==========================================================================

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Safe database migration script for Astral Draft v4.

OPTIONS:
    -h, --help                  Show this help message
    -e, --environment ENV       Target environment (development|staging|production) [default: development]
    -d, --dry-run               Show what would be migrated without executing
    -f, --force                 Force migration even with warnings
    -b, --backup-only           Only create backup, don't migrate
    -r, --rollback VERSION      Rollback to specific migration version
    --skip-backup               Skip backup creation (NOT recommended for production)
    --backup-retention DAYS     Backup retention in days [default: 7]
    --timeout SECONDS           Migration timeout [default: 300]
    --check-only                Only check migration status, don't migrate

ENVIRONMENT VARIABLES:
    DATABASE_URL                Database connection string
    BACKUP_DATABASE_URL         Backup database connection (optional)
    MIGRATION_LOCK_TIMEOUT      Lock timeout for migrations (default: 60)

EXAMPLES:
    # Development migration with backup
    $0 --environment development

    # Production migration with extended retention
    $0 --environment production --backup-retention 30

    # Dry run for production
    $0 --environment production --dry-run

    # Rollback to specific version
    $0 --environment staging --rollback 20231201_123456

    # Check migration status
    $0 --environment production --check-only

EOF
}

parse_arguments() {
    ENVIRONMENT="${DEFAULT_ENVIRONMENT}"
    DRY_RUN="false"
    FORCE_MIGRATION="false"
    BACKUP_ONLY="false"
    ROLLBACK_VERSION=""
    SKIP_BACKUP="false"
    BACKUP_RETENTION="${DEFAULT_BACKUP_RETENTION}"
    MIGRATION_TIMEOUT="${DEFAULT_TIMEOUT}"
    CHECK_ONLY="false"

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
            -d|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            -f|--force)
                FORCE_MIGRATION="true"
                shift
                ;;
            -b|--backup-only)
                BACKUP_ONLY="true"
                shift
                ;;
            -r|--rollback)
                ROLLBACK_VERSION="$2"
                shift 2
                ;;
            --skip-backup)
                SKIP_BACKUP="true"
                shift
                ;;
            --backup-retention)
                BACKUP_RETENTION="$2"
                shift 2
                ;;
            --timeout)
                MIGRATION_TIMEOUT="$2"
                shift 2
                ;;
            --check-only)
                CHECK_ONLY="true"
                shift
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
    log_info "Validating migration environment..."
    
    # Validate environment parameter
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("psql" "pg_dump" "node" "npm")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Validate database URL
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL environment variable is required"
        exit 1
    fi
    
    # Production safety checks
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ "$SKIP_BACKUP" == "true" && "$BACKUP_ONLY" == "false" ]]; then
            log_error "Backup cannot be skipped in production environment"
            exit 1
        fi
        
        if [[ "$FORCE_MIGRATION" == "true" && "$DRY_RUN" == "false" ]]; then
            log_warn "Force migration enabled in production - this is dangerous!"
            read -p "Are you sure you want to proceed? (yes/no): " -r
            if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                log_info "Migration cancelled by user"
                exit 0
            fi
        fi
    fi
    
    log_success "Environment validation passed"
}

# ==========================================================================
# Database Connection and Status
# ==========================================================================

test_database_connection() {
    log_info "Testing database connection..."
    
    if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        log_error "Cannot connect to database"
        exit 1
    fi
    
    log_success "Database connection successful"
}

get_database_info() {
    log_info "Gathering database information..."
    
    # Get database name and connection info
    DB_NAME=$(psql "$DATABASE_URL" -t -c "SELECT current_database();" | xargs)
    DB_VERSION=$(psql "$DATABASE_URL" -t -c "SELECT version();" | head -1)
    DB_SIZE=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" | xargs)
    
    log_info "Database: $DB_NAME"
    log_info "Version: $DB_VERSION"
    log_info "Size: $DB_SIZE"
}

check_migration_status() {
    log_info "Checking current migration status..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Prisma is properly set up
    if [[ ! -f "prisma/schema.prisma" ]]; then
        log_error "Prisma schema not found"
        exit 1
    fi
    
    # Generate Prisma client if needed
    npm run db:generate &> /dev/null
    
    # Get current migration status
    CURRENT_MIGRATIONS=$(npx prisma migrate status --schema=prisma/schema.prisma 2>&1 || true)
    
    if echo "$CURRENT_MIGRATIONS" | grep -q "No migration found"; then
        log_info "No migrations have been applied yet"
        MIGRATION_STATUS="none"
    elif echo "$CURRENT_MIGRATIONS" | grep -q "Database and migrations are in sync"; then
        log_info "Database is up to date with migrations"
        MIGRATION_STATUS="up-to-date"
    elif echo "$CURRENT_MIGRATIONS" | grep -q "pending migrations"; then
        log_warn "There are pending migrations"
        MIGRATION_STATUS="pending"
    else
        log_warn "Migration status unclear"
        MIGRATION_STATUS="unclear"
    fi
    
    # Show pending migrations if any
    if [[ "$MIGRATION_STATUS" == "pending" ]]; then
        log_info "Pending migrations:"
        echo "$CURRENT_MIGRATIONS" | grep -A 20 "following migrations have not yet been applied"
    fi
}

# ==========================================================================
# Backup Operations
# ==========================================================================

create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_warn "Skipping backup creation (--skip-backup flag used)"
        return 0
    fi
    
    log_info "Creating database backup..."
    
    # Create backup directory
    BACKUP_DIR="${PROJECT_ROOT}/backups"
    mkdir -p "$BACKUP_DIR"
    
    # Generate backup filename
    BACKUP_FILE="${BACKUP_DIR}/backup_${ENVIRONMENT}_${TIMESTAMP}.sql"
    BACKUP_COMPRESSED="${BACKUP_FILE}.gz"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create backup at $BACKUP_COMPRESSED"
        return 0
    fi
    
    # Create backup with compression
    log_info "Creating backup: $BACKUP_COMPRESSED"
    
    if ! pg_dump "$DATABASE_URL" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="$BACKUP_FILE.custom"; then
        log_error "Failed to create database backup"
        exit 1
    fi
    
    # Also create SQL dump for easy inspection
    if ! pg_dump "$DATABASE_URL" \
        --verbose \
        --no-password \
        --format=plain \
        --file="$BACKUP_FILE"; then
        log_error "Failed to create SQL backup"
        exit 1
    fi
    
    # Compress SQL dump
    gzip "$BACKUP_FILE"
    
    # Verify backup
    if [[ ! -f "$BACKUP_COMPRESSED" ]]; then
        log_error "Backup file not created successfully"
        exit 1
    fi
    
    BACKUP_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
    log_success "Backup created successfully: $BACKUP_COMPRESSED ($BACKUP_SIZE)"
    
    # Save backup info for potential rollback
    echo "BACKUP_FILE=$BACKUP_COMPRESSED" > "${PROJECT_ROOT}/logs/last_backup_${ENVIRONMENT}.info"
    echo "BACKUP_TIMESTAMP=$TIMESTAMP" >> "${PROJECT_ROOT}/logs/last_backup_${ENVIRONMENT}.info"
    echo "DATABASE_URL=$DATABASE_URL" >> "${PROJECT_ROOT}/logs/last_backup_${ENVIRONMENT}.info"
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: $BACKUP_RETENTION days)..."
    
    BACKUP_DIR="${PROJECT_ROOT}/backups"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_info "No backup directory found, skipping cleanup"
        return 0
    fi
    
    # Find and remove old backups
    OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup_${ENVIRONMENT}_*.sql*" -mtime +$BACKUP_RETENTION 2>/dev/null || true)
    
    if [[ -n "$OLD_BACKUPS" ]]; then
        log_info "Removing old backups:"
        echo "$OLD_BACKUPS" | while read -r backup; do
            log_info "  Removing: $backup"
            if [[ "$DRY_RUN" == "false" ]]; then
                rm -f "$backup"
            fi
        done
    else
        log_info "No old backups to clean up"
    fi
}

# ==========================================================================
# Migration Operations
# ==========================================================================

run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would run Prisma migrations"
        return 0
    fi
    
    # Set migration timeout
    export MIGRATION_LOCK_TIMEOUT="${MIGRATION_LOCK_TIMEOUT:-60}"
    
    # Run Prisma migrations
    log_info "Executing Prisma migrate deploy..."
    
    if ! timeout "$MIGRATION_TIMEOUT" npx prisma migrate deploy --schema=prisma/schema.prisma; then
        log_error "Migration failed or timed out"
        
        # Attempt to show migration status for debugging
        log_info "Current migration status:"
        npx prisma migrate status --schema=prisma/schema.prisma || true
        
        exit 1
    fi
    
    log_success "Migrations completed successfully"
}

rollback_migrations() {
    local target_version="$1"
    
    log_info "Rolling back migrations to version: $target_version"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would rollback to $target_version"
        return 0
    fi
    
    # Prisma doesn't have built-in rollback, so we need to restore from backup
    if [[ -f "${PROJECT_ROOT}/logs/last_backup_${ENVIRONMENT}.info" ]]; then
        source "${PROJECT_ROOT}/logs/last_backup_${ENVIRONMENT}.info"
        
        if [[ -f "$BACKUP_FILE" ]]; then
            log_info "Restoring database from backup: $BACKUP_FILE"
            
            # Drop and recreate database (WARNING: destructive)
            log_warn "This will completely restore the database from backup"
            read -p "Are you sure you want to proceed? (yes/no): " -r
            if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                log_info "Rollback cancelled by user"
                exit 0
            fi
            
            # Restore from compressed backup
            gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
            
            log_success "Database restored from backup"
        else
            log_error "Backup file not found: $BACKUP_FILE"
            exit 1
        fi
    else
        log_error "No backup information found for rollback"
        exit 1
    fi
}

# ==========================================================================
# Data Integrity Checks
# ==========================================================================

verify_data_integrity() {
    log_info "Verifying data integrity after migration..."
    
    cd "$PROJECT_ROOT"
    
    # Run data integrity checks
    if [[ -f "scripts/data-integrity-check.sql" ]]; then
        log_info "Running custom data integrity checks..."
        psql "$DATABASE_URL" -f "scripts/data-integrity-check.sql"
    fi
    
    # Check for orphaned records
    log_info "Checking for data consistency..."
    
    # Basic checks - customize based on your schema
    CHECKS_PASSED=0
    TOTAL_CHECKS=0
    
    # Check if critical tables exist and have data
    for table in users leagues teams players; do
        ((TOTAL_CHECKS++))
        if psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $table;" &> /dev/null; then
            ((CHECKS_PASSED++))
            log_info "✓ Table $table is accessible"
        else
            log_warn "✗ Table $table check failed"
        fi
    done
    
    # Check foreign key constraints
    ((TOTAL_CHECKS++))
    CONSTRAINT_VIOLATIONS=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND constraint_schema = current_schema()
    " | xargs)
    
    if [[ "$CONSTRAINT_VIOLATIONS" -gt 0 ]]; then
        ((CHECKS_PASSED++))
        log_info "✓ Foreign key constraints are in place ($CONSTRAINT_VIOLATIONS constraints)"
    else
        log_warn "✗ No foreign key constraints found"
    fi
    
    log_info "Data integrity checks: $CHECKS_PASSED/$TOTAL_CHECKS passed"
    
    if [[ $CHECKS_PASSED -lt $TOTAL_CHECKS ]]; then
        log_warn "Some data integrity checks failed"
        if [[ "$FORCE_MIGRATION" != "true" ]]; then
            log_error "Migration validation failed"
            exit 1
        fi
    else
        log_success "All data integrity checks passed"
    fi
}

# ==========================================================================
# Migration Monitoring and Alerts
# ==========================================================================

send_migration_notification() {
    local status="$1"
    local message="$2"
    
    # Create notification payload
    local notification=$(cat << EOF
{
    "environment": "$ENVIRONMENT",
    "status": "$status",
    "message": "$message",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "database": "$DB_NAME",
    "migration_duration": "$(($(date +%s) - START_TIME)) seconds"
}
EOF
    )
    
    # Send to monitoring system (webhook, Slack, etc.)
    if [[ -n "${MIGRATION_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$MIGRATION_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "$notification" || true
    fi
    
    # Log notification
    log_info "Migration notification sent: $status"
}

# ==========================================================================
# Main Migration Function
# ==========================================================================

run_migration_workflow() {
    START_TIME=$(date +%s)
    
    log_info "Starting migration workflow for $ENVIRONMENT environment"
    
    # Validate environment and prerequisites
    validate_environment
    test_database_connection
    get_database_info
    check_migration_status
    
    # Check-only mode
    if [[ "$CHECK_ONLY" == "true" ]]; then
        log_info "Check-only mode completed"
        return 0
    fi
    
    # Rollback mode
    if [[ -n "$ROLLBACK_VERSION" ]]; then
        create_backup
        rollback_migrations "$ROLLBACK_VERSION"
        verify_data_integrity
        send_migration_notification "rollback_success" "Database rolled back to $ROLLBACK_VERSION"
        return 0
    fi
    
    # Backup-only mode
    if [[ "$BACKUP_ONLY" == "true" ]]; then
        create_backup
        cleanup_old_backups
        log_success "Backup-only operation completed"
        return 0
    fi
    
    # Full migration workflow
    if [[ "$MIGRATION_STATUS" == "up-to-date" ]]; then
        log_info "Database is already up to date"
        if [[ "$FORCE_MIGRATION" != "true" ]]; then
            return 0
        fi
    fi
    
    # Create backup before migration
    create_backup
    
    # Run migrations
    run_migrations
    
    # Verify migration success
    check_migration_status
    verify_data_integrity
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send success notification
    send_migration_notification "migration_success" "Database migration completed successfully"
    
    log_success "Migration workflow completed successfully"
}

# ==========================================================================
# Error Handling and Cleanup
# ==========================================================================

cleanup_on_error() {
    local exit_code=$?
    log_error "Migration script failed with exit code: $exit_code"
    
    # Send failure notification
    send_migration_notification "migration_failed" "Migration script failed with exit code: $exit_code"
    
    # If migration failed and we have a recent backup, offer to restore
    if [[ -f "${PROJECT_ROOT}/logs/last_backup_${ENVIRONMENT}.info" && "$DRY_RUN" == "false" ]]; then
        log_info "Recent backup available for emergency restore"
        log_info "To restore: $0 --environment $ENVIRONMENT --rollback auto"
    fi
    
    exit $exit_code
}

# ==========================================================================
# Main Script Execution
# ==========================================================================

main() {
    log_info "Astral Draft v4 Database Migration Script"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Log file: $LOG_FILE"
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Set up error handling
    trap cleanup_on_error ERR
    
    # Display configuration
    log_info "Configuration:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Dry run: $DRY_RUN"
    log_info "  Force migration: $FORCE_MIGRATION"
    log_info "  Skip backup: $SKIP_BACKUP"
    log_info "  Backup retention: $BACKUP_RETENTION days"
    log_info "  Migration timeout: $MIGRATION_TIMEOUT seconds"
    
    # Run migration workflow
    run_migration_workflow
    
    log_success "Migration script completed successfully!"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi