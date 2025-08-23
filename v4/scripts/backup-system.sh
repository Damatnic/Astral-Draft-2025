#!/bin/bash
# Astral Draft v4 - Comprehensive Backup System
# =============================================
# Advanced backup and disaster recovery system

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
BACKUP_BASE_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
LOG_FILE="$PROJECT_ROOT/logs/backup.log"
ENCRYPTION_KEY_FILE="$PROJECT_ROOT/.backup-encryption-key"

# Backup configuration
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
COMPRESSION_LEVEL=${BACKUP_COMPRESSION_LEVEL:-6}
PARALLEL_JOBS=${BACKUP_PARALLEL_JOBS:-4}
MAX_BACKUP_SIZE=${MAX_BACKUP_SIZE:-10G}

# S3 Configuration (optional)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${BACKUP_AWS_REGION:-us-east-1}"

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
trap 'error "Backup script failed at line $LINENO"; cleanup; exit 1' ERR
trap 'cleanup; exit 0' EXIT

# Cleanup function
cleanup() {
    if [ -n "${TEMP_DIR:-}" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Function to check dependencies
check_dependencies() {
    local deps=("pg_dump" "gzip" "tar" "openssl")
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
    
    # Check optional dependencies
    if [ -n "$S3_BUCKET" ]; then
        if ! command -v aws >/dev/null 2>&1; then
            warn "AWS CLI not found. S3 backup disabled."
            S3_BUCKET=""
        fi
    fi
}

# Function to setup backup directories
setup_directories() {
    local dirs=(
        "$BACKUP_BASE_DIR"
        "$BACKUP_BASE_DIR/database"
        "$BACKUP_BASE_DIR/files"
        "$BACKUP_BASE_DIR/config"
        "$BACKUP_BASE_DIR/logs"
        "$BACKUP_BASE_DIR/redis"
        "$(dirname "$LOG_FILE")"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
}

# Function to generate or load encryption key
setup_encryption() {
    if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
        log "Generating new encryption key..."
        openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
        chmod 600 "$ENCRYPTION_KEY_FILE"
        log "Encryption key generated and saved to $ENCRYPTION_KEY_FILE"
    fi
    
    ENCRYPTION_KEY=$(cat "$ENCRYPTION_KEY_FILE")
}

# Function to encrypt file
encrypt_file() {
    local input_file="$1"
    local output_file="$2"
    
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
        -in "$input_file" \
        -out "$output_file" \
        -pass pass:"$ENCRYPTION_KEY"
}

# Function to decrypt file
decrypt_file() {
    local input_file="$1"
    local output_file="$2"
    
    openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 \
        -in "$input_file" \
        -out "$output_file" \
        -pass pass:"$ENCRYPTION_KEY"
}

# Function to create database backup
backup_database() {
    log "Starting database backup..."
    
    local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    local backup_file="$BACKUP_BASE_DIR/database/astral-draft-$timestamp.sql"
    local compressed_file="$backup_file.gz"
    local encrypted_file="$compressed_file.enc"
    
    # Create database dump
    log "Creating database dump..."
    pg_dump "$DATABASE_URL" \
        --verbose \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --format=plain \
        --file="$backup_file" 2>>"$LOG_FILE"
    
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        error "Database backup failed or is empty"
        return 1
    fi
    
    # Compress backup
    log "Compressing database backup..."
    gzip -"$COMPRESSION_LEVEL" "$backup_file"
    
    # Encrypt backup
    if [ "${BACKUP_ENCRYPTION_ENABLED:-true}" = "true" ]; then
        log "Encrypting database backup..."
        encrypt_file "$compressed_file" "$encrypted_file"
        rm "$compressed_file"
        backup_file="$encrypted_file"
    else
        backup_file="$compressed_file"
    fi
    
    # Verify backup
    local backup_size=$(du -h "$backup_file" | cut -f1)
    log "Database backup completed: $backup_file ($backup_size)"
    
    # Store metadata
    cat > "$backup_file.meta" << EOF
{
    "type": "database",
    "timestamp": "$timestamp",
    "size": "$(stat -c%s "$backup_file")",
    "compressed": true,
    "encrypted": ${BACKUP_ENCRYPTION_ENABLED:-true},
    "postgresql_version": "$(pg_dump --version | head -n1)",
    "checksum": "$(sha256sum "$backup_file" | cut -d' ' -f1)"
}
EOF
    
    echo "$backup_file"
}

# Function to backup Redis data
backup_redis() {
    if [ -z "${REDIS_HOST:-}" ]; then
        warn "Redis not configured, skipping Redis backup"
        return 0
    fi
    
    log "Starting Redis backup..."
    
    local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    local backup_file="$BACKUP_BASE_DIR/redis/redis-$timestamp.rdb"
    local compressed_file="$backup_file.gz"
    local encrypted_file="$compressed_file.enc"
    
    # Create Redis backup using BGSAVE
    local redis_cmd="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT:-6379}"
    if [ -n "${REDIS_PASSWORD:-}" ]; then
        redis_cmd="$redis_cmd -a $REDIS_PASSWORD"
    fi
    
    # Trigger background save
    $redis_cmd BGSAVE
    
    # Wait for save to complete
    while [ "$($redis_cmd LASTSAVE)" = "$($redis_cmd LASTSAVE)" ]; do
        sleep 1
    done
    
    # Copy RDB file
    if command -v scp >/dev/null 2>&1 && [ "$REDIS_HOST" != "localhost" ] && [ "$REDIS_HOST" != "127.0.0.1" ]; then
        scp "$REDIS_HOST:/var/lib/redis/dump.rdb" "$backup_file"
    else
        cp "/var/lib/redis/dump.rdb" "$backup_file" 2>/dev/null || {
            warn "Could not copy Redis RDB file, creating Redis data dump instead"
            $redis_cmd --rdb "$backup_file"
        }
    fi
    
    if [ -f "$backup_file" ]; then
        # Compress and encrypt
        gzip -"$COMPRESSION_LEVEL" "$backup_file"
        
        if [ "${BACKUP_ENCRYPTION_ENABLED:-true}" = "true" ]; then
            encrypt_file "$compressed_file" "$encrypted_file"
            rm "$compressed_file"
            backup_file="$encrypted_file"
        else
            backup_file="$compressed_file"
        fi
        
        log "Redis backup completed: $backup_file"
        echo "$backup_file"
    else
        warn "Redis backup failed"
    fi
}

# Function to backup application files
backup_files() {
    log "Starting application files backup..."
    
    local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    local backup_file="$BACKUP_BASE_DIR/files/app-files-$timestamp.tar.gz"
    local encrypted_file="$backup_file.enc"
    
    # Define what to backup and exclude
    local include_paths=(
        "public/uploads"
        "public/user-content"
        "storage"
        "logs"
    )
    
    local exclude_patterns=(
        "*.log"
        "*.tmp"
        "node_modules"
        ".next"
        ".git"
        "backups"
        "*.cache"
    )
    
    # Build tar command
    local tar_cmd="tar -czf $backup_file -C $PROJECT_ROOT"
    
    # Add exclude patterns
    for pattern in "${exclude_patterns[@]}"; do
        tar_cmd="$tar_cmd --exclude=$pattern"
    done
    
    # Add include paths (only those that exist)
    local existing_paths=()
    for path in "${include_paths[@]}"; do
        if [ -e "$PROJECT_ROOT/$path" ]; then
            existing_paths+=("$path")
        fi
    done
    
    if [ ${#existing_paths[@]} -eq 0 ]; then
        warn "No application files to backup"
        return 0
    fi
    
    tar_cmd="$tar_cmd ${existing_paths[*]}"
    
    # Execute backup
    eval "$tar_cmd"
    
    if [ -f "$backup_file" ]; then
        # Encrypt if enabled
        if [ "${BACKUP_ENCRYPTION_ENABLED:-true}" = "true" ]; then
            encrypt_file "$backup_file" "$encrypted_file"
            rm "$backup_file"
            backup_file="$encrypted_file"
        fi
        
        local backup_size=$(du -h "$backup_file" | cut -f1)
        log "Application files backup completed: $backup_file ($backup_size)"
        echo "$backup_file"
    else
        warn "Application files backup failed"
    fi
}

# Function to backup configuration
backup_config() {
    log "Starting configuration backup..."
    
    local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    local backup_file="$BACKUP_BASE_DIR/config/config-$timestamp.tar.gz"
    local encrypted_file="$backup_file.enc"
    
    # Configuration files to backup
    local config_files=(
        ".env.production"
        "next.config.prod.js"
        "ecosystem.config.js"
        "docker-compose.prod.yml"
        "nginx/nginx.conf"
        "nginx/sites-available/astral-draft"
        "scripts/"
        "prisma/schema.prisma"
    )
    
    # Create temporary directory for config backup
    local temp_config_dir="$TEMP_DIR/config"
    mkdir -p "$temp_config_dir"
    
    # Copy existing config files
    for file in "${config_files[@]}"; do
        if [ -e "$PROJECT_ROOT/$file" ]; then
            local dest_dir="$temp_config_dir/$(dirname "$file")"
            mkdir -p "$dest_dir"
            cp -r "$PROJECT_ROOT/$file" "$dest_dir/"
        fi
    done
    
    # Add system configuration
    if [ -d "/etc/nginx" ]; then
        mkdir -p "$temp_config_dir/system"
        cp -r /etc/nginx "$temp_config_dir/system/" 2>/dev/null || true
        cp /etc/crontab "$temp_config_dir/system/" 2>/dev/null || true
        crontab -l > "$temp_config_dir/system/user-crontab" 2>/dev/null || true
    fi
    
    # Create backup archive
    tar -czf "$backup_file" -C "$temp_config_dir" .
    
    if [ -f "$backup_file" ]; then
        # Encrypt if enabled
        if [ "${BACKUP_ENCRYPTION_ENABLED:-true}" = "true" ]; then
            encrypt_file "$backup_file" "$encrypted_file"
            rm "$backup_file"
            backup_file="$encrypted_file"
        fi
        
        log "Configuration backup completed: $backup_file"
        echo "$backup_file"
    else
        warn "Configuration backup failed"
    fi
}

# Function to upload to S3
upload_to_s3() {
    local backup_file="$1"
    local backup_type="$2"
    
    if [ -z "$S3_BUCKET" ]; then
        return 0
    fi
    
    log "Uploading backup to S3: $backup_file"
    
    local s3_path="s3://$S3_BUCKET/astral-draft/$(date +%Y/%m/%d)/$(basename "$backup_file")"
    
    aws s3 cp "$backup_file" "$s3_path" \
        --region "$AWS_REGION" \
        --storage-class STANDARD_IA \
        --metadata "backup-type=$backup_type,timestamp=$(date -Iseconds)" \
        2>>"$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log "Successfully uploaded to S3: $s3_path"
        
        # Upload metadata if exists
        if [ -f "$backup_file.meta" ]; then
            aws s3 cp "$backup_file.meta" "$s3_path.meta" --region "$AWS_REGION" 2>>"$LOG_FILE"
        fi
    else
        warn "Failed to upload to S3: $backup_file"
    fi
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"
    local backup_type="$2"
    
    log "Verifying backup integrity: $backup_file"
    
    # Check file exists and is not empty
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        error "Backup file is missing or empty: $backup_file"
        return 1
    fi
    
    # Verify file integrity based on type
    case "$backup_type" in
        "database")
            # For database backups, try to decrypt and decompress
            if [[ "$backup_file" == *.enc ]]; then
                local temp_file="$TEMP_DIR/test.gz"
                if decrypt_file "$backup_file" "$temp_file"; then
                    if gzip -t "$temp_file" 2>/dev/null; then
                        log "Database backup integrity verified"
                        rm "$temp_file"
                        return 0
                    fi
                    rm "$temp_file"
                fi
            elif [[ "$backup_file" == *.gz ]]; then
                if gzip -t "$backup_file" 2>/dev/null; then
                    log "Database backup integrity verified"
                    return 0
                fi
            fi
            ;;
        "files"|"config")
            # For tar files, verify archive integrity
            if [[ "$backup_file" == *.enc ]]; then
                local temp_file="$TEMP_DIR/test.tar.gz"
                if decrypt_file "$backup_file" "$temp_file"; then
                    if tar -tzf "$temp_file" >/dev/null 2>&1; then
                        log "Archive backup integrity verified"
                        rm "$temp_file"
                        return 0
                    fi
                    rm "$temp_file"
                fi
            elif [[ "$backup_file" == *.tar.gz ]]; then
                if tar -tzf "$backup_file" >/dev/null 2>&1; then
                    log "Archive backup integrity verified"
                    return 0
                fi
            fi
            ;;
    esac
    
    error "Backup integrity verification failed: $backup_file"
    return 1
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    local backup_dirs=(
        "$BACKUP_BASE_DIR/database"
        "$BACKUP_BASE_DIR/files"
        "$BACKUP_BASE_DIR/config"
        "$BACKUP_BASE_DIR/redis"
    )
    
    for dir in "${backup_dirs[@]}"; do
        if [ -d "$dir" ]; then
            local deleted_count=0
            while IFS= read -r -d '' file; do
                rm "$file"
                rm -f "$file.meta"
                ((deleted_count++))
            done < <(find "$dir" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
            
            if [ $deleted_count -gt 0 ]; then
                log "Deleted $deleted_count old backup files from $dir"
            fi
        fi
    done
    
    # Cleanup S3 if configured
    if [ -n "$S3_BUCKET" ]; then
        log "Cleaning up old S3 backups..."
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://$S3_BUCKET/astral-draft/" --recursive | \
            awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' | \
            while read -r key; do
                aws s3 rm "s3://$S3_BUCKET/$key" --region "$AWS_REGION" 2>>"$LOG_FILE"
            done
    fi
}

# Function to create point-in-time recovery info
create_pitr_info() {
    if [ "${PITR_ENABLED:-false}" != "true" ]; then
        return 0
    fi
    
    log "Creating point-in-time recovery information..."
    
    local pitr_file="$BACKUP_BASE_DIR/pitr-$(date +%Y-%m-%d_%H-%M-%S).json"
    
    cat > "$pitr_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "database_lsn": "$(psql "$DATABASE_URL" -t -c "SELECT pg_current_wal_lsn();" 2>/dev/null | tr -d ' ' || echo "unknown")",
    "backup_label": "astral-draft-$(date +%Y-%m-%d_%H-%M-%S)",
    "retention_until": "$(date -d "+${PITR_RETENTION_DAYS:-7} days" -Iseconds)"
}
EOF
    
    log "PITR information saved: $pitr_file"
}

# Function to send backup notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [ "${BACKUP_NOTIFICATIONS_ENABLED:-false}" != "true" ]; then
        return 0
    fi
    
    # Send email notification (if configured)
    if [ -n "${NOTIFICATION_EMAIL:-}" ]; then
        local subject="Astral Draft Backup $status"
        echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
    
    # Send webhook notification (if configured)
    if [ -n "${NOTIFICATION_WEBHOOK:-}" ]; then
        curl -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || true
    fi
}

# Main backup function
perform_backup() {
    local backup_type="${1:-full}"
    
    log "Starting $backup_type backup for Astral Draft v4..."
    
    local start_time=$(date +%s)
    local backup_files=()
    local failed_backups=()
    
    # Load environment variables
    if [ -f "$PROJECT_ROOT/.env.production" ]; then
        set -a
        source "$PROJECT_ROOT/.env.production"
        set +a
    fi
    
    # Setup
    setup_directories
    setup_encryption
    
    # Create backups based on type
    case "$backup_type" in
        "database"|"db")
            if db_file=$(backup_database); then
                backup_files+=("$db_file:database")
            else
                failed_backups+=("database")
            fi
            ;;
        "files")
            if files_backup=$(backup_files); then
                backup_files+=("$files_backup:files")
            else
                failed_backups+=("files")
            fi
            ;;
        "config")
            if config_backup=$(backup_config); then
                backup_files+=("$config_backup:config")
            else
                failed_backups+=("config")
            fi
            ;;
        "full"|*)
            # Full backup
            if db_file=$(backup_database); then
                backup_files+=("$db_file:database")
            else
                failed_backups+=("database")
            fi
            
            if redis_file=$(backup_redis); then
                backup_files+=("$redis_file:redis")
            else
                failed_backups+=("redis")
            fi
            
            if files_backup=$(backup_files); then
                backup_files+=("$files_backup:files")
            else
                failed_backups+=("files")
            fi
            
            if config_backup=$(backup_config); then
                backup_files+=("$config_backup:config")
            else
                failed_backups+=("config")
            fi
            ;;
    esac
    
    # Verify backups
    local verified_count=0
    for backup_info in "${backup_files[@]}"; do
        IFS=':' read -r backup_file backup_type <<< "$backup_info"
        if verify_backup "$backup_file" "$backup_type"; then
            ((verified_count++))
            # Upload to S3 if configured
            upload_to_s3 "$backup_file" "$backup_type"
        fi
    done
    
    # Create PITR info
    create_pitr_info
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Calculate duration and size
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local total_size=0
    
    for backup_info in "${backup_files[@]}"; do
        IFS=':' read -r backup_file _ <<< "$backup_info"
        if [ -f "$backup_file" ]; then
            local size=$(stat -c%s "$backup_file")
            total_size=$((total_size + size))
        fi
    done
    
    # Generate summary
    local summary="Backup Summary:
- Type: $backup_type
- Duration: ${duration}s
- Total Size: $(numfmt --to=iec $total_size)
- Files Created: ${#backup_files[@]}
- Files Verified: $verified_count
- Failed Backups: ${#failed_backups[@]}
"
    
    if [ ${#failed_backups[@]} -gt 0 ]; then
        summary="$summary- Failed Components: ${failed_backups[*]}
"
    fi
    
    log "$summary"
    
    # Send notification
    if [ ${#failed_backups[@]} -eq 0 ]; then
        send_notification "SUCCESS" "$summary"
        log "Backup completed successfully!"
        return 0
    else
        send_notification "PARTIAL_FAILURE" "$summary"
        warn "Backup completed with failures!"
        return 1
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    local restore_type="$2"
    local target_location="${3:-}"
    
    log "Starting restore from backup: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Decrypt if needed
    local working_file="$backup_file"
    if [[ "$backup_file" == *.enc ]]; then
        working_file="$TEMP_DIR/$(basename "${backup_file%.enc}")"
        decrypt_file "$backup_file" "$working_file"
    fi
    
    case "$restore_type" in
        "database")
            log "Restoring database from backup..."
            if [[ "$working_file" == *.gz ]]; then
                gunzip -c "$working_file" | psql "$DATABASE_URL"
            else
                psql "$DATABASE_URL" < "$working_file"
            fi
            ;;
        "files")
            log "Restoring files from backup..."
            local restore_dir="${target_location:-$PROJECT_ROOT}"
            tar -xzf "$working_file" -C "$restore_dir"
            ;;
        "config")
            log "Restoring configuration from backup..."
            local restore_dir="${target_location:-$PROJECT_ROOT}"
            tar -xzf "$working_file" -C "$restore_dir"
            ;;
        *)
            error "Unknown restore type: $restore_type"
            return 1
            ;;
    esac
    
    log "Restore completed successfully"
}

# Function to list available backups
list_backups() {
    log "Available backups:"
    
    local backup_dirs=(
        "$BACKUP_BASE_DIR/database"
        "$BACKUP_BASE_DIR/files"
        "$BACKUP_BASE_DIR/config"
        "$BACKUP_BASE_DIR/redis"
    )
    
    for dir in "${backup_dirs[@]}"; do
        if [ -d "$dir" ]; then
            local type=$(basename "$dir")
            echo "=== $type backups ==="
            find "$dir" -type f -name "*.gz" -o -name "*.enc" | sort -r | head -10 | while read -r file; do
                local size=$(du -h "$file" | cut -f1)
                local date=$(stat -c %y "$file" | cut -d' ' -f1,2 | cut -d'.' -f1)
                printf "  %-50s %8s %s\n" "$(basename "$file")" "$size" "$date"
            done
            echo
        fi
    done
}

# Main script logic
main() {
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Check dependencies
    check_dependencies
    
    case "${1:-full}" in
        "backup"|"full")
            perform_backup "full"
            ;;
        "database"|"db")
            perform_backup "database"
            ;;
        "files")
            perform_backup "files"
            ;;
        "config")
            perform_backup "config"
            ;;
        "restore")
            if [ $# -lt 3 ]; then
                error "Usage: $0 restore <backup_file> <type> [target_location]"
                exit 1
            fi
            restore_backup "$2" "$3" "${4:-}"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "help"|"-h"|"--help")
            cat << EOF
Astral Draft v4 Backup System

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    full|backup     Create full backup (default)
    database|db     Create database backup only
    files           Create files backup only
    config          Create configuration backup only
    restore <file> <type> [target]  Restore from backup
    list            List available backups
    cleanup         Clean up old backups
    help            Show this help

Examples:
    $0                              # Full backup
    $0 database                     # Database only
    $0 restore backup.sql.gz database
    $0 list                         # Show available backups

Environment Variables:
    BACKUP_RETENTION_DAYS=30        # Days to keep backups
    BACKUP_ENCRYPTION_ENABLED=true # Enable encryption
    BACKUP_S3_BUCKET=bucket-name    # S3 backup destination
    BACKUP_COMPRESSION_LEVEL=6      # Gzip compression level

EOF
            ;;
        *)
            error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"