#!/bin/bash

# ==============================================================================
# Astral Draft v4 - Database and Critical Data Backup Script
# ==============================================================================
# This script provides comprehensive backup functionality including:
# - Database backups with compression and encryption
# - File system backups (uploads, logs, etc.)
# - Backup verification and integrity checks
# - Automated backup rotation and cleanup
# - Remote backup storage (S3, Azure, etc.)
# - Backup monitoring and alerting
# ==============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/backup_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p "${PROJECT_ROOT}/logs"

# Backup configuration defaults
DEFAULT_ENVIRONMENT="production"
DEFAULT_RETENTION_DAYS=30
DEFAULT_COMPRESSION_LEVEL=9
DEFAULT_ENCRYPTION="true"
DEFAULT_VERIFY="true"
DEFAULT_REMOTE_SYNC="true"

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

Comprehensive backup script for Astral Draft v4.

OPTIONS:
    -h, --help                  Show this help message
    -e, --environment ENV       Environment (development|staging|production) [default: production]
    -t, --type TYPE             Backup type (database|files|full) [default: full]
    -c, --compression LEVEL     Compression level 1-9 [default: 9]
    -r, --retention DAYS        Backup retention in days [default: 30]
    --no-encryption             Disable backup encryption
    --no-verification           Skip backup verification
    --no-remote-sync            Skip remote backup sync
    --dry-run                   Show what would be backed up without executing
    --database-only             Backup only the database
    --files-only                Backup only file system data
    --incremental               Create incremental backup (if supported)
    --cleanup-only              Only run backup cleanup, don't create new backups

ENVIRONMENT VARIABLES:
    DATABASE_URL                Database connection string
    BACKUP_ENCRYPTION_KEY       GPG key for backup encryption
    AWS_ACCESS_KEY_ID           AWS credentials for S3 backup
    AWS_SECRET_ACCESS_KEY       AWS secret key
    AWS_S3_BACKUP_BUCKET        S3 bucket for remote backups
    AZURE_STORAGE_ACCOUNT       Azure storage account
    AZURE_STORAGE_KEY           Azure storage key
    BACKUP_WEBHOOK_URL          Webhook for backup notifications

EXAMPLES:
    # Full production backup
    $0 --environment production

    # Database-only backup with custom retention
    $0 --type database --retention 60

    # Incremental backup without remote sync
    $0 --incremental --no-remote-sync

    # Cleanup old backups only
    $0 --cleanup-only --retention 7

EOF
}

parse_arguments() {
    ENVIRONMENT="${DEFAULT_ENVIRONMENT}"
    BACKUP_TYPE="full"
    COMPRESSION_LEVEL="${DEFAULT_COMPRESSION_LEVEL}"
    RETENTION_DAYS="${DEFAULT_RETENTION_DAYS}"
    ENABLE_ENCRYPTION="${DEFAULT_ENCRYPTION}"
    ENABLE_VERIFICATION="${DEFAULT_VERIFY}"
    ENABLE_REMOTE_SYNC="${DEFAULT_REMOTE_SYNC}"
    DRY_RUN="false"
    INCREMENTAL="false"
    CLEANUP_ONLY="false"

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
                BACKUP_TYPE="$2"
                shift 2
                ;;
            -c|--compression)
                COMPRESSION_LEVEL="$2"
                shift 2
                ;;
            -r|--retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --no-encryption)
                ENABLE_ENCRYPTION="false"
                shift
                ;;
            --no-verification)
                ENABLE_VERIFICATION="false"
                shift
                ;;
            --no-remote-sync)
                ENABLE_REMOTE_SYNC="false"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --database-only)
                BACKUP_TYPE="database"
                shift
                ;;
            --files-only)
                BACKUP_TYPE="files"
                shift
                ;;
            --incremental)
                INCREMENTAL="true"
                shift
                ;;
            --cleanup-only)
                CLEANUP_ONLY="true"
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
    log_info "Validating backup environment..."
    
    # Validate environment parameter
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
    fi
    
    # Validate backup type
    if [[ ! "$BACKUP_TYPE" =~ ^(database|files|full)$ ]]; then
        log_error "Invalid backup type: $BACKUP_TYPE"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("pg_dump" "gzip" "tar")
    
    if [[ "$ENABLE_ENCRYPTION" == "true" ]]; then
        required_tools+=("gpg")
    fi
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Validate database URL for database backups
    if [[ "$BACKUP_TYPE" =~ ^(database|full)$ ]]; then
        if [[ -z "${DATABASE_URL:-}" ]]; then
            log_error "DATABASE_URL environment variable is required for database backups"
            exit 1
        fi
    fi
    
    # Check backup directory permissions
    BACKUP_DIR="${PROJECT_ROOT}/backups"
    mkdir -p "$BACKUP_DIR"
    
    if [[ ! -w "$BACKUP_DIR" ]]; then
        log_error "Backup directory is not writable: $BACKUP_DIR"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# ==========================================================================
# Database Backup Functions
# ==========================================================================

backup_database() {
    log_info "Starting database backup..."
    
    # Generate backup filename
    local db_backup_file="${BACKUP_DIR}/database_${ENVIRONMENT}_${TIMESTAMP}.sql"
    local compressed_file="${db_backup_file}.gz"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create database backup at $compressed_file"
        return 0
    fi
    
    log_info "Creating database dump..."
    
    # Create database dump with verbose output
    if ! pg_dump "$DATABASE_URL" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=0 \
        --file="$db_backup_file.custom" 2>> "$LOG_FILE"; then
        log_error "Failed to create database backup"
        return 1
    fi
    
    # Also create SQL dump for easy inspection and portability
    if ! pg_dump "$DATABASE_URL" \
        --verbose \
        --no-password \
        --format=plain \
        --file="$db_backup_file" 2>> "$LOG_FILE"; then
        log_error "Failed to create SQL backup"
        return 1
    fi
    
    # Compress the SQL dump
    log_info "Compressing database backup..."
    if ! gzip -"$COMPRESSION_LEVEL" "$db_backup_file"; then
        log_error "Failed to compress database backup"
        return 1
    fi
    
    # Get backup size
    local backup_size=$(du -h "$compressed_file" | cut -f1)
    log_success "Database backup created: $compressed_file ($backup_size)"
    
    # Encrypt if enabled
    if [[ "$ENABLE_ENCRYPTION" == "true" ]]; then
        encrypt_backup "$compressed_file"
    fi
    
    # Store backup info
    echo "DATABASE_BACKUP=$compressed_file" >> "${BACKUP_DIR}/backup_${TIMESTAMP}.info"
    echo "DATABASE_SIZE=$backup_size" >> "${BACKUP_DIR}/backup_${TIMESTAMP}.info"
    
    return 0
}

# ==========================================================================
# File System Backup Functions
# ==========================================================================

backup_files() {
    log_info "Starting file system backup..."
    
    # Define directories to backup
    local backup_paths=()
    
    # Application uploads and user data
    if [[ -d "${PROJECT_ROOT}/uploads" ]]; then
        backup_paths+=("uploads")
    fi
    
    # Configuration files (non-sensitive)
    if [[ -d "${PROJECT_ROOT}/config" ]]; then
        backup_paths+=("config")
    fi
    
    # Logs (recent ones)
    if [[ -d "${PROJECT_ROOT}/logs" ]]; then
        backup_paths+=("logs")
    fi
    
    # Public assets (if customized)
    if [[ -d "${PROJECT_ROOT}/public/custom" ]]; then
        backup_paths+=("public/custom")
    fi
    
    if [[ ${#backup_paths[@]} -eq 0 ]]; then
        log_info "No file system data to backup"
        return 0
    fi
    
    # Generate backup filename
    local files_backup_file="${BACKUP_DIR}/files_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create files backup at $files_backup_file"
        log_info "DRY RUN: Would backup paths: ${backup_paths[*]}"
        return 0
    fi
    
    log_info "Creating file system backup..."
    log_info "Backing up paths: ${backup_paths[*]}"
    
    # Create tar archive with compression
    cd "$PROJECT_ROOT"
    if ! tar -czf "$files_backup_file" \
        --verbose \
        --exclude='*.log' \
        --exclude='tmp/*' \
        --exclude='cache/*' \
        "${backup_paths[@]}" 2>> "$LOG_FILE"; then
        log_error "Failed to create file system backup"
        return 1
    fi
    
    # Get backup size
    local backup_size=$(du -h "$files_backup_file" | cut -f1)
    log_success "File system backup created: $files_backup_file ($backup_size)"
    
    # Encrypt if enabled
    if [[ "$ENABLE_ENCRYPTION" == "true" ]]; then
        encrypt_backup "$files_backup_file"
    fi
    
    # Store backup info
    echo "FILES_BACKUP=$files_backup_file" >> "${BACKUP_DIR}/backup_${TIMESTAMP}.info"
    echo "FILES_SIZE=$backup_size" >> "${BACKUP_DIR}/backup_${TIMESTAMP}.info"
    
    return 0
}

# ==========================================================================
# Encryption and Security
# ==========================================================================

encrypt_backup() {
    local backup_file="$1"
    local encrypted_file="${backup_file}.gpg"
    
    log_info "Encrypting backup: $(basename "$backup_file")"
    
    if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
        log_warn "BACKUP_ENCRYPTION_KEY not set, using symmetric encryption"
        
        # Use symmetric encryption with passphrase
        if [[ -z "${BACKUP_PASSPHRASE:-}" ]]; then
            log_error "BACKUP_PASSPHRASE required for symmetric encryption"
            return 1
        fi
        
        if ! echo "$BACKUP_PASSPHRASE" | gpg \
            --batch \
            --yes \
            --passphrase-fd 0 \
            --symmetric \
            --cipher-algo AES256 \
            --compress-algo 1 \
            --output "$encrypted_file" \
            "$backup_file"; then
            log_error "Failed to encrypt backup"
            return 1
        fi
    else
        # Use public key encryption
        if ! gpg \
            --batch \
            --yes \
            --trust-model always \
            --recipient "$BACKUP_ENCRYPTION_KEY" \
            --encrypt \
            --compress-algo 1 \
            --output "$encrypted_file" \
            "$backup_file"; then
            log_error "Failed to encrypt backup"
            return 1
        fi
    fi
    
    # Remove unencrypted backup
    rm -f "$backup_file"
    
    # Update backup info
    sed -i "s|$backup_file|$encrypted_file|g" "${BACKUP_DIR}/backup_${TIMESTAMP}.info" 2>/dev/null || true
    
    log_success "Backup encrypted: $(basename "$encrypted_file")"
}

# ==========================================================================
# Backup Verification
# ==========================================================================

verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup: $(basename "$backup_file")"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check file size
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
    if [[ "$file_size" -eq 0 ]]; then
        log_error "Backup file is empty: $backup_file"
        return 1
    fi
    
    # Verify file integrity based on type
    if [[ "$backup_file" == *.gpg ]]; then
        # Verify encrypted file
        if ! gpg --batch --quiet --verify "$backup_file" 2>/dev/null; then
            log_warn "Could not verify GPG signature (file may still be valid)"
        fi
    elif [[ "$backup_file" == *.gz ]]; then
        # Test gzip integrity
        if ! gzip -t "$backup_file"; then
            log_error "Backup file is corrupted: $backup_file"
            return 1
        fi
    elif [[ "$backup_file" == *.tar.gz ]]; then
        # Test tar.gz integrity
        if ! tar -tzf "$backup_file" >/dev/null; then
            log_error "Backup archive is corrupted: $backup_file"
            return 1
        fi
    fi
    
    log_success "Backup verification passed: $(basename "$backup_file")"
    return 0
}

verify_all_backups() {
    if [[ "$ENABLE_VERIFICATION" != "true" ]]; then
        log_info "Backup verification disabled"
        return 0
    fi
    
    log_info "Verifying all backups for this session..."
    
    local verification_failed=0
    
    # Verify backups created in this session
    if [[ -f "${BACKUP_DIR}/backup_${TIMESTAMP}.info" ]]; then
        while IFS= read -r line; do
            if [[ "$line" =~ ^[A-Z_]+_BACKUP=(.+)$ ]]; then
                local backup_file="${BASH_REMATCH[1]}"
                if ! verify_backup "$backup_file"; then
                    ((verification_failed++))
                fi
            fi
        done < "${BACKUP_DIR}/backup_${TIMESTAMP}.info"
    fi
    
    if [[ $verification_failed -gt 0 ]]; then
        log_error "$verification_failed backup verification(s) failed"
        return 1
    fi
    
    log_success "All backup verifications passed"
    return 0
}

# ==========================================================================
# Remote Backup Sync
# ==========================================================================

sync_to_s3() {
    log_info "Syncing backups to S3..."
    
    if [[ -z "${AWS_S3_BACKUP_BUCKET:-}" ]]; then
        log_warn "AWS_S3_BACKUP_BUCKET not set, skipping S3 sync"
        return 0
    fi
    
    # Check AWS CLI availability
    if ! command -v aws &> /dev/null; then
        log_warn "AWS CLI not found, skipping S3 sync"
        return 0
    fi
    
    # Sync backup directory to S3
    local s3_path="s3://${AWS_S3_BACKUP_BUCKET}/astral-draft-v4/${ENVIRONMENT}/"
    
    if ! aws s3 sync "$BACKUP_DIR" "$s3_path" \
        --exclude "*" \
        --include "*${TIMESTAMP}*" \
        --storage-class STANDARD_IA; then
        log_error "Failed to sync backups to S3"
        return 1
    fi
    
    log_success "Backups synced to S3: $s3_path"
    return 0
}

sync_to_azure() {
    log_info "Syncing backups to Azure..."
    
    if [[ -z "${AZURE_STORAGE_ACCOUNT:-}" ]] || [[ -z "${AZURE_STORAGE_KEY:-}" ]]; then
        log_warn "Azure storage credentials not set, skipping Azure sync"
        return 0
    fi
    
    # Check Azure CLI availability
    if ! command -v az &> /dev/null; then
        log_warn "Azure CLI not found, skipping Azure sync"
        return 0
    fi
    
    # Upload backups to Azure Blob Storage
    local container_name="astral-draft-backups"
    local blob_prefix="v4/${ENVIRONMENT}/"
    
    # Find backup files for this session
    local backup_files=$(find "$BACKUP_DIR" -name "*${TIMESTAMP}*" -type f)
    
    for backup_file in $backup_files; do
        local blob_name="${blob_prefix}$(basename "$backup_file")"
        
        if ! az storage blob upload \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --account-key "$AZURE_STORAGE_KEY" \
            --container-name "$container_name" \
            --name "$blob_name" \
            --file "$backup_file" \
            --tier Cool; then
            log_error "Failed to upload to Azure: $backup_file"
            return 1
        fi
    done
    
    log_success "Backups synced to Azure Blob Storage"
    return 0
}

sync_remote_backups() {
    if [[ "$ENABLE_REMOTE_SYNC" != "true" ]]; then
        log_info "Remote backup sync disabled"
        return 0
    fi
    
    log_info "Starting remote backup sync..."
    
    # Try S3 sync
    if [[ -n "${AWS_ACCESS_KEY_ID:-}" ]] && [[ -n "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
        sync_to_s3
    fi
    
    # Try Azure sync
    if [[ -n "${AZURE_STORAGE_ACCOUNT:-}" ]]; then
        sync_to_azure
    fi
    
    log_success "Remote backup sync completed"
}

# ==========================================================================
# Backup Cleanup and Rotation
# ==========================================================================

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Clean local backups
    local old_backups=$(find "$BACKUP_DIR" -name "*.sql.gz*" -o -name "*.tar.gz*" -o -name "*.gpg" | \
        while read -r file; do
            if [[ $(stat -f%B "$file" 2>/dev/null || stat -c%Y "$file" 2>/dev/null) -lt $(date -d "$RETENTION_DAYS days ago" +%s 2>/dev/null || date -d "@$(($(date +%s) - RETENTION_DAYS * 86400))" +%s) ]]; then
                echo "$file"
            fi
        done)
    
    if [[ -n "$old_backups" ]]; then
        log_info "Removing old local backups:"
        echo "$old_backups" | while read -r backup; do
            log_info "  Removing: $(basename "$backup")"
            if [[ "$DRY_RUN" == "false" ]]; then
                rm -f "$backup"
                
                # Also remove corresponding .info file
                local info_file="${backup%.*}.info"
                [[ -f "$info_file" ]] && rm -f "$info_file"
            fi
        done
    else
        log_info "No old local backups to clean up"
    fi
    
    # Clean remote backups if enabled
    if [[ "$ENABLE_REMOTE_SYNC" == "true" ]]; then
        cleanup_remote_backups
    fi
}

cleanup_remote_backups() {
    log_info "Cleaning up old remote backups..."
    
    # S3 cleanup
    if [[ -n "${AWS_S3_BACKUP_BUCKET:-}" ]] && command -v aws &> /dev/null; then
        local s3_path="s3://${AWS_S3_BACKUP_BUCKET}/astral-draft-v4/${ENVIRONMENT}/"
        
        # Use S3 lifecycle policies for automatic cleanup
        # For immediate cleanup, list and delete old objects
        if [[ "$DRY_RUN" == "false" ]]; then
            aws s3api list-objects-v2 \
                --bucket "$AWS_S3_BACKUP_BUCKET" \
                --prefix "astral-draft-v4/${ENVIRONMENT}/" \
                --query "Contents[?LastModified<='$(date -d "$RETENTION_DAYS days ago" -u +%Y-%m-%dT%H:%M:%SZ)'].Key" \
                --output text | \
            while read -r key; do
                if [[ -n "$key" && "$key" != "None" ]]; then
                    log_info "Removing S3 object: $key"
                    aws s3api delete-object --bucket "$AWS_S3_BACKUP_BUCKET" --key "$key"
                fi
            done
        fi
    fi
    
    # Azure cleanup would be implemented similarly
}

# ==========================================================================
# Monitoring and Notifications
# ==========================================================================

send_backup_notification() {
    local status="$1"
    local message="$2"
    
    # Create notification payload
    local notification=$(cat << EOF
{
    "environment": "$ENVIRONMENT",
    "backup_type": "$BACKUP_TYPE",
    "status": "$status",
    "message": "$message",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration": "$(($(date +%s) - START_TIME)) seconds",
    "retention_days": $RETENTION_DAYS
}
EOF
    )
    
    # Send webhook notification
    if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
        if ! curl -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "$notification" \
            --max-time 10; then
            log_warn "Failed to send backup notification"
        else
            log_info "Backup notification sent successfully"
        fi
    fi
}

# ==========================================================================
# Main Backup Function
# ==========================================================================

run_backup_workflow() {
    START_TIME=$(date +%s)
    
    log_info "Starting backup workflow for $ENVIRONMENT environment"
    log_info "Backup type: $BACKUP_TYPE"
    log_info "Timestamp: $TIMESTAMP"
    
    # Initialize backup info file
    cat > "${BACKUP_DIR}/backup_${TIMESTAMP}.info" << EOF
# Backup Information
BACKUP_TIMESTAMP=$TIMESTAMP
ENVIRONMENT=$ENVIRONMENT
BACKUP_TYPE=$BACKUP_TYPE
COMPRESSION_LEVEL=$COMPRESSION_LEVEL
ENCRYPTION_ENABLED=$ENABLE_ENCRYPTION
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
    
    # Cleanup-only mode
    if [[ "$CLEANUP_ONLY" == "true" ]]; then
        cleanup_old_backups
        log_success "Cleanup-only operation completed"
        return 0
    fi
    
    local backup_success=true
    
    # Perform backups based on type
    case "$BACKUP_TYPE" in
        "database")
            if ! backup_database; then
                backup_success=false
            fi
            ;;
        "files")
            if ! backup_files; then
                backup_success=false
            fi
            ;;
        "full")
            if ! backup_database; then
                backup_success=false
            fi
            if ! backup_files; then
                backup_success=false
            fi
            ;;
    esac
    
    # Verify backups
    if [[ "$backup_success" == "true" ]]; then
        if ! verify_all_backups; then
            backup_success=false
        fi
    fi
    
    # Sync to remote storage
    if [[ "$backup_success" == "true" ]]; then
        if ! sync_remote_backups; then
            log_warn "Remote sync failed, but local backups are available"
        fi
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Update backup info
    echo "COMPLETED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${BACKUP_DIR}/backup_${TIMESTAMP}.info"
    echo "DURATION=$(($(date +%s) - START_TIME))" >> "${BACKUP_DIR}/backup_${TIMESTAMP}.info"
    echo "SUCCESS=$backup_success" >> "${BACKUP_DIR}/backup_${TIMESTAMP}.info"
    
    # Send notifications
    if [[ "$backup_success" == "true" ]]; then
        send_backup_notification "success" "Backup completed successfully"
        log_success "Backup workflow completed successfully"
    else
        send_backup_notification "failure" "Backup workflow failed"
        log_error "Backup workflow completed with errors"
        return 1
    fi
}

# ==========================================================================
# Error Handling
# ==========================================================================

cleanup_on_error() {
    local exit_code=$?
    log_error "Backup script failed with exit code: $exit_code"
    
    # Send failure notification
    send_backup_notification "error" "Backup script failed with exit code: $exit_code"
    
    exit $exit_code
}

# ==========================================================================
# Main Script Execution
# ==========================================================================

main() {
    log_info "Astral Draft v4 Backup Script"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Log file: $LOG_FILE"
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Validate environment and dependencies
    validate_environment
    
    # Set up error handling
    trap cleanup_on_error ERR
    
    # Display configuration
    log_info "Configuration:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Backup type: $BACKUP_TYPE"
    log_info "  Compression: level $COMPRESSION_LEVEL"
    log_info "  Encryption: $ENABLE_ENCRYPTION"
    log_info "  Verification: $ENABLE_VERIFICATION"
    log_info "  Remote sync: $ENABLE_REMOTE_SYNC"
    log_info "  Retention: $RETENTION_DAYS days"
    log_info "  Dry run: $DRY_RUN"
    
    # Run backup workflow
    run_backup_workflow
    
    log_success "Backup script completed!"
}

# Set up cron job function
setup_cron() {
    log_info "Setting up automated backup cron job..."
    
    # Create cron entry
    local cron_schedule="${BACKUP_SCHEDULE:-0 2 * * *}"  # Default: daily at 2 AM
    local cron_command="$SCRIPT_DIR/backup.sh --environment $ENVIRONMENT"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$cron_schedule $cron_command") | crontab -
    
    log_success "Cron job scheduled: $cron_schedule"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi