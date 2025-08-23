#!/bin/bash

# ==============================================================================
# Astral Draft v4 - Comprehensive Health Check Script
# ==============================================================================
# This script performs comprehensive health checks for Astral Draft v4
# deployments including application health, database connectivity,
# Redis availability, and external service dependencies.
# ==============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/health_check_${TIMESTAMP}.log"

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
DEFAULT_BASE_URL="http://localhost:3000"
DEFAULT_TIMEOUT=30
DEFAULT_RETRIES=3
DEFAULT_CHECK_TYPE="basic"

# Configuration variables
BASE_URL="${BASE_URL:-$DEFAULT_BASE_URL}"
TIMEOUT="${TIMEOUT:-$DEFAULT_TIMEOUT}"
RETRIES="${RETRIES:-$DEFAULT_RETRIES}"
CHECK_TYPE="${CHECK_TYPE:-$DEFAULT_CHECK_TYPE}"
ENVIRONMENT="${ENVIRONMENT:-development}"
VERBOSE="${VERBOSE:-false}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-text}"
FAIL_FAST="${FAIL_FAST:-false}"

# Health check results
declare -A CHECK_RESULTS
declare -A CHECK_DETAILS
OVERALL_STATUS="healthy"
FAILED_CHECKS=0
TOTAL_CHECKS=0

# ==============================================================================
# Helper Functions
# ==============================================================================

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] [BASE_URL]

Perform comprehensive health checks for Astral Draft v4.

ARGUMENTS:
    BASE_URL                    Base URL to check [default: $DEFAULT_BASE_URL]

OPTIONS:
    -h, --help                  Show this help message
    -t, --timeout SECONDS       Request timeout [default: $DEFAULT_TIMEOUT]
    -r, --retries COUNT         Number of retries for failed checks [default: $DEFAULT_RETRIES]
    -c, --check-type TYPE       Type of checks to run (basic|full|monitoring) [default: $DEFAULT_CHECK_TYPE]
    -e, --environment ENV       Environment being checked (development|staging|production)
    -v, --verbose               Enable verbose output
    -f, --format FORMAT         Output format (text|json|prometheus) [default: text]
    --fail-fast                 Exit on first failure
    --nagios                    Nagios-compatible output

CHECK TYPES:
    basic                       Core application endpoints
    full                        Complete health verification including dependencies
    monitoring                  Monitoring and metrics endpoints
    external                    External service dependencies

EXAMPLES:
    # Basic health check
    $0

    # Full health check for production
    $0 --check-type full --environment production https://astraldraft.com

    # Monitoring endpoints check with JSON output
    $0 --check-type monitoring --format json

    # Health check with custom timeout and retries
    $0 --timeout 60 --retries 5 https://staging.astraldraft.com

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -r|--retries)
                RETRIES="$2"
                shift 2
                ;;
            -c|--check-type)
                CHECK_TYPE="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE="true"
                shift
                ;;
            -f|--format)
                OUTPUT_FORMAT="$2"
                shift 2
                ;;
            --fail-fast)
                FAIL_FAST="true"
                shift
                ;;
            --nagios)
                OUTPUT_FORMAT="nagios"
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                BASE_URL="$1"
                shift
                ;;
        esac
    done
}

# Utility function to make HTTP requests with retries
make_request() {
    local url="$1"
    local method="${2:-GET}"
    local expected_code="${3:-200}"
    local retry_count=0
    
    while [[ $retry_count -lt $RETRIES ]]; do
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Making $method request to: $url (attempt $((retry_count + 1))/$RETRIES)"
        fi
        
        local response
        local http_code
        
        response=$(curl -s -w "%{http_code}" \
            --max-time "$TIMEOUT" \
            --connect-timeout 10 \
            -X "$method" \
            -H "User-Agent: HealthCheck/1.0" \
            -H "Accept: application/json" \
            "$url" 2>/dev/null) || true
        
        if [[ -n "$response" ]]; then
            http_code="${response: -3}"
            local body="${response%???}"
            
            if [[ "$http_code" == "$expected_code" ]]; then
                echo "$body"
                return 0
            fi
        fi
        
        ((retry_count++))
        if [[ $retry_count -lt $RETRIES ]]; then
            sleep 2
        fi
    done
    
    return 1
}

# Generic health check function
perform_check() {
    local check_name="$1"
    local check_function="$2"
    local is_critical="${3:-true}"
    
    ((TOTAL_CHECKS++))
    
    log_info "Running check: $check_name"
    
    local start_time=$(date +%s)
    local check_result="healthy"
    local check_detail=""
    
    if $check_function; then
        check_result="healthy"
        check_detail="OK"
        log_success "$check_name: PASSED"
    else
        check_result="unhealthy"
        check_detail="FAILED"
        ((FAILED_CHECKS++))
        
        if [[ "$is_critical" == "true" ]]; then
            OVERALL_STATUS="unhealthy"
            log_error "$check_name: FAILED (CRITICAL)"
            
            if [[ "$FAIL_FAST" == "true" ]]; then
                log_error "Exiting due to fail-fast mode"
                exit 1
            fi
        else
            log_warn "$check_name: FAILED (NON-CRITICAL)"
        fi
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    CHECK_RESULTS["$check_name"]="$check_result"
    CHECK_DETAILS["$check_name"]="$check_detail (${duration}s)"
}

# ==============================================================================
# Core Health Check Functions
# ==============================================================================

check_application_health() {
    local health_response
    health_response=$(make_request "${BASE_URL}/api/health" "GET" "200") || return 1
    
    # Validate health response structure
    if echo "$health_response" | jq -e '.status == "ok"' >/dev/null 2>&1; then
        return 0
    else
        log_error "Invalid health response format"
        return 1
    fi
}

check_application_readiness() {
    local ready_response
    ready_response=$(make_request "${BASE_URL}/api/ready" "GET" "200") || return 1
    
    # Validate readiness response
    if echo "$ready_response" | jq -e '.ready == true' >/dev/null 2>&1; then
        return 0
    else
        log_error "Application not ready"
        return 1
    fi
}

check_database_connectivity() {
    local db_response
    db_response=$(make_request "${BASE_URL}/api/health/database" "GET" "200") || return 1
    
    # Check database status
    if echo "$db_response" | jq -e '.database.status == "connected"' >/dev/null 2>&1; then
        return 0
    else
        log_error "Database connectivity check failed"
        return 1
    fi
}

check_redis_connectivity() {
    local redis_response
    redis_response=$(make_request "${BASE_URL}/api/health/redis" "GET" "200") || return 1
    
    # Check Redis status
    if echo "$redis_response" | jq -e '.redis.status == "connected"' >/dev/null 2>&1; then
        return 0
    else
        log_error "Redis connectivity check failed"
        return 1
    fi
}

check_authentication_service() {
    local auth_response
    auth_response=$(make_request "${BASE_URL}/api/auth/session" "GET" "200,401") || return 1
    
    # Session endpoint should respond (even if not authenticated)
    return 0
}

check_api_endpoints() {
    local endpoints=(
        "/api/health"
        "/api/ready"
        "/api/auth/session"
        "/"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! make_request "${BASE_URL}${endpoint}" "GET" >/dev/null; then
            log_error "API endpoint failed: $endpoint"
            return 1
        fi
    done
    
    return 0
}

check_static_assets() {
    # Check if static assets are being served
    if ! make_request "${BASE_URL}/favicon.ico" "GET" >/dev/null; then
        log_error "Static assets not accessible"
        return 1
    fi
    
    return 0
}

check_websocket_connectivity() {
    # Note: This is a simplified check - in practice you'd need a WebSocket client
    # For now, we'll check if the WebSocket endpoint responds to HTTP
    local ws_endpoint="${BASE_URL}/api/socket"
    
    # WebSocket endpoints typically return 400 for HTTP requests
    if make_request "$ws_endpoint" "GET" "400" >/dev/null; then
        return 0
    else
        log_error "WebSocket endpoint not responding"
        return 1
    fi
}

# ==============================================================================
# Advanced Health Check Functions
# ==============================================================================

check_external_api_dependencies() {
    # Check external sports data APIs (mock endpoints for demo)
    local external_apis=(
        "https://httpbin.org/status/200"  # Mock external API
    )
    
    for api in "${external_apis[@]}"; do
        if ! make_request "$api" "GET" "200" >/dev/null; then
            log_error "External API dependency failed: $api"
            return 1
        fi
    done
    
    return 0
}

check_ssl_certificate() {
    if [[ "$BASE_URL" =~ ^https:// ]]; then
        local domain=$(echo "$BASE_URL" | sed 's|https://||' | cut -d'/' -f1)
        
        # Check SSL certificate expiration
        local cert_info
        cert_info=$(echo | openssl s_client -servername "$domain" -connect "${domain}:443" 2>/dev/null | \
                   openssl x509 -noout -dates 2>/dev/null) || return 1
        
        local expiry_date
        expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        
        if [[ -n "$expiry_date" ]]; then
            local expiry_epoch
            expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null) || return 1
            
            local current_epoch
            current_epoch=$(date +%s)
            
            local days_until_expiry
            days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [[ $days_until_expiry -lt 30 ]]; then
                log_warn "SSL certificate expires in $days_until_expiry days"
            fi
            
            if [[ $days_until_expiry -lt 0 ]]; then
                log_error "SSL certificate has expired"
                return 1
            fi
        fi
    fi
    
    return 0
}

check_performance_metrics() {
    local metrics_response
    metrics_response=$(make_request "${BASE_URL}/api/metrics" "GET" "200") || return 1
    
    # Check basic performance metrics
    local response_time
    response_time=$(echo "$metrics_response" | jq -r '.response_time // 0')
    
    if [[ $(echo "$response_time > 1000" | bc 2>/dev/null || echo 0) -eq 1 ]]; then
        log_warn "High response time detected: ${response_time}ms"
    fi
    
    return 0
}

check_rate_limiting() {
    # Test rate limiting is working by making multiple requests
    local rate_limit_endpoint="${BASE_URL}/api/auth/session"
    local successful_requests=0
    
    for i in {1..10}; do
        if make_request "$rate_limit_endpoint" "GET" >/dev/null 2>&1; then
            ((successful_requests++))
        fi
        sleep 0.1
    done
    
    # All requests succeeding might indicate rate limiting isn't working
    if [[ $successful_requests -eq 10 ]]; then
        log_warn "Rate limiting may not be configured properly"
    fi
    
    return 0
}

# ==============================================================================
# Monitoring Health Check Functions
# ==============================================================================

check_prometheus_metrics() {
    local metrics_response
    metrics_response=$(make_request "${BASE_URL}/metrics" "GET" "200") || return 1
    
    # Validate Prometheus metrics format
    if echo "$metrics_response" | grep -q "# HELP"; then
        return 0
    else
        log_error "Prometheus metrics not in expected format"
        return 1
    fi
}

check_application_logs() {
    # Check if application is generating logs (simplified check)
    local logs_endpoint="${BASE_URL}/api/admin/logs"
    
    # This would typically check log levels and recent log activity
    # For demo purposes, we'll just check if the endpoint is accessible
    if make_request "$logs_endpoint" "GET" "200,401,403" >/dev/null; then
        return 0
    else
        log_error "Application logs endpoint not accessible"
        return 1
    fi
}

# ==============================================================================
# Check Execution Functions
# ==============================================================================

run_basic_checks() {
    log_info "Running basic health checks..."
    
    perform_check "Application Health" check_application_health true
    perform_check "Application Readiness" check_application_readiness true
    perform_check "API Endpoints" check_api_endpoints true
    perform_check "Static Assets" check_static_assets false
}

run_full_checks() {
    log_info "Running full health checks..."
    
    # Run basic checks first
    run_basic_checks
    
    # Add comprehensive checks
    perform_check "Database Connectivity" check_database_connectivity true
    perform_check "Redis Connectivity" check_redis_connectivity true
    perform_check "Authentication Service" check_authentication_service true
    perform_check "WebSocket Connectivity" check_websocket_connectivity false
    perform_check "SSL Certificate" check_ssl_certificate false
    perform_check "External Dependencies" check_external_api_dependencies false
    perform_check "Rate Limiting" check_rate_limiting false
}

run_monitoring_checks() {
    log_info "Running monitoring health checks..."
    
    perform_check "Prometheus Metrics" check_prometheus_metrics false
    perform_check "Performance Metrics" check_performance_metrics false
    perform_check "Application Logs" check_application_logs false
}

run_external_checks() {
    log_info "Running external dependency checks..."
    
    perform_check "External API Dependencies" check_external_api_dependencies false
    perform_check "SSL Certificate" check_ssl_certificate false
}

# ==============================================================================
# Output Functions
# ==============================================================================

output_text_results() {
    echo ""
    echo "=========================================="
    echo "        Health Check Results"
    echo "=========================================="
    echo "Environment: $ENVIRONMENT"
    echo "Base URL: $BASE_URL"
    echo "Timestamp: $(date -u)"
    echo "Overall Status: $OVERALL_STATUS"
    echo "Failed Checks: $FAILED_CHECKS/$TOTAL_CHECKS"
    echo ""
    
    echo "Individual Check Results:"
    echo "----------------------------------------"
    for check_name in "${!CHECK_RESULTS[@]}"; do
        local status="${CHECK_RESULTS[$check_name]}"
        local details="${CHECK_DETAILS[$check_name]}"
        local status_icon="✅"
        
        if [[ "$status" == "unhealthy" ]]; then
            status_icon="❌"
        fi
        
        printf "%-30s %s %s\n" "$check_name" "$status_icon" "$details"
    done
    
    echo ""
    
    if [[ "$OVERALL_STATUS" == "healthy" ]]; then
        echo "🎉 All critical health checks passed!"
    else
        echo "⚠️  Some health checks failed. Please review the results above."
    fi
}

output_json_results() {
    local json_output=$(cat << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "base_url": "$BASE_URL",
    "overall_status": "$OVERALL_STATUS",
    "summary": {
        "total_checks": $TOTAL_CHECKS,
        "failed_checks": $FAILED_CHECKS,
        "success_rate": $(echo "scale=2; ($TOTAL_CHECKS - $FAILED_CHECKS) * 100 / $TOTAL_CHECKS" | bc 2>/dev/null || echo "0")
    },
    "checks": {
EOF
    )
    
    local first_check=true
    for check_name in "${!CHECK_RESULTS[@]}"; do
        if [[ "$first_check" == "false" ]]; then
            json_output+=","
        fi
        first_check=false
        
        local status="${CHECK_RESULTS[$check_name]}"
        local details="${CHECK_DETAILS[$check_name]}"
        
        json_output+=$(cat << EOF

        "$check_name": {
            "status": "$status",
            "details": "$details"
        }
EOF
        )
    done
    
    json_output+=$(cat << EOF

    }
}
EOF
    )
    
    echo "$json_output"
}

output_nagios_results() {
    local nagios_status="OK"
    local nagios_code=0
    
    if [[ "$OVERALL_STATUS" == "unhealthy" ]]; then
        nagios_status="CRITICAL"
        nagios_code=2
    elif [[ $FAILED_CHECKS -gt 0 ]]; then
        nagios_status="WARNING"
        nagios_code=1
    fi
    
    echo "$nagios_status - $FAILED_CHECKS/$TOTAL_CHECKS checks failed | failed_checks=$FAILED_CHECKS;1;2;0;$TOTAL_CHECKS"
    exit $nagios_code
}

output_prometheus_results() {
    echo "# HELP astral_draft_health_check_status Health check status (1=healthy, 0=unhealthy)"
    echo "# TYPE astral_draft_health_check_status gauge"
    
    for check_name in "${!CHECK_RESULTS[@]}"; do
        local status_value="1"
        if [[ "${CHECK_RESULTS[$check_name]}" == "unhealthy" ]]; then
            status_value="0"
        fi
        
        local clean_name=$(echo "$check_name" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
        echo "astral_draft_health_check_status{check=\"$clean_name\",environment=\"$ENVIRONMENT\"} $status_value"
    done
    
    echo ""
    echo "# HELP astral_draft_health_checks_total Total number of health checks"
    echo "# TYPE astral_draft_health_checks_total counter"
    echo "astral_draft_health_checks_total{environment=\"$ENVIRONMENT\"} $TOTAL_CHECKS"
    
    echo ""
    echo "# HELP astral_draft_health_checks_failed Number of failed health checks"
    echo "# TYPE astral_draft_health_checks_failed counter"
    echo "astral_draft_health_checks_failed{environment=\"$ENVIRONMENT\"} $FAILED_CHECKS"
}

# ==============================================================================
# Main Execution Function
# ==============================================================================

main() {
    log_info "Starting Astral Draft v4 health checks"
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Validate base URL
    if ! curl -s --head "$BASE_URL" >/dev/null 2>&1; then
        log_error "Cannot reach base URL: $BASE_URL"
        exit 1
    fi
    
    log_info "Health check configuration:"
    log_info "  Base URL: $BASE_URL"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Check type: $CHECK_TYPE"
    log_info "  Timeout: ${TIMEOUT}s"
    log_info "  Retries: $RETRIES"
    log_info "  Output format: $OUTPUT_FORMAT"
    
    # Run appropriate checks based on type
    case "$CHECK_TYPE" in
        "basic")
            run_basic_checks
            ;;
        "full")
            run_full_checks
            ;;
        "monitoring")
            run_monitoring_checks
            ;;
        "external")
            run_external_checks
            ;;
        *)
            log_error "Unknown check type: $CHECK_TYPE"
            exit 1
            ;;
    esac
    
    # Output results in requested format
    case "$OUTPUT_FORMAT" in
        "text")
            output_text_results
            ;;
        "json")
            output_json_results
            ;;
        "nagios")
            output_nagios_results
            ;;
        "prometheus")
            output_prometheus_results
            ;;
        *)
            log_error "Unknown output format: $OUTPUT_FORMAT"
            exit 1
            ;;
    esac
    
    # Set exit code based on overall status
    if [[ "$OVERALL_STATUS" == "unhealthy" ]]; then
        exit 1
    else
        exit 0
    fi
}

# Trap errors
trap 'log_error "Health check script failed at line $LINENO"' ERR

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi