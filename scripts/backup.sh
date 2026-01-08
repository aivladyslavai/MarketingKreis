#!/bin/bash

# Database Backup Script v2.0
# This script creates automated backups of the PostgreSQL database with multiple strategies

set -e

echo "💾 Database Backup Script v2.0"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from environment or defaults
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_ONLY=$(date +"%Y%m%d")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
BACKUP_TYPE="${1:-full}" # full, schema, data, incremental

# Database connection details
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="${POSTGRES_DB:-appdb}"
DB_USER="${POSTGRES_USER:-app_user}"
DB_PASSWORD="${POSTGRES_PASSWORD:-password}"

# Backup directories
FULL_BACKUP_DIR="$BACKUP_DIR/full"
SCHEMA_BACKUP_DIR="$BACKUP_DIR/schema"
DATA_BACKUP_DIR="$BACKUP_DIR/data"
INCREMENTAL_BACKUP_DIR="$BACKUP_DIR/incremental"

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directories
create_directories() {
    mkdir -p "$FULL_BACKUP_DIR"
    mkdir -p "$SCHEMA_BACKUP_DIR"
    mkdir -p "$DATA_BACKUP_DIR"
    mkdir -p "$INCREMENTAL_BACKUP_DIR"
}

# Check prerequisites
check_prerequisites() {
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if PostgreSQL container is running
    if ! docker-compose ps db | grep -q "Up"; then
        print_error "PostgreSQL container is not running. Start with: docker-compose up -d db"
        exit 1
    fi

    # Test database connection
    if ! docker-compose exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        print_error "Cannot connect to database"
        exit 1
    fi

    print_status "Prerequisites check passed"
}

# Full database backup
backup_full() {
    print_header "Full Database Backup"
    
    local backup_file="$FULL_BACKUP_DIR/full_backup_$TIMESTAMP.sql"
    print_status "Creating full backup: $backup_file"
    
    # Create full backup with verbose output
    if docker-compose exec -T db pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --create \
        --clean \
        --if-exists > "$backup_file.custom"; then
        
        # Also create plain SQL backup
        docker-compose exec -T db pg_dump \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --no-password \
            --create \
            --clean \
            --if-exists > "$backup_file"
        
        # Compress SQL backup
        gzip "$backup_file"
        
        local backup_size=$(du -h "${backup_file}.gz" | cut -f1)
        local custom_size=$(du -h "${backup_file}.custom" | cut -f1)
        
        print_status "Full backup completed"
        print_status "SQL backup size: $backup_size"
        print_status "Custom backup size: $custom_size"
        
        return 0
    else
        print_error "Full backup failed"
        return 1
    fi
}

# Schema-only backup
backup_schema() {
    print_header "Schema-Only Backup"
    
    local backup_file="$SCHEMA_BACKUP_DIR/schema_backup_$TIMESTAMP.sql"
    print_status "Creating schema backup: $backup_file"
    
    if docker-compose exec -T db pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema-only \
        --no-password \
        --create \
        --clean \
        --if-exists > "$backup_file"; then
        
        gzip "$backup_file"
        local backup_size=$(du -h "${backup_file}.gz" | cut -f1)
        print_status "Schema backup completed (size: $backup_size)"
        return 0
    else
        print_error "Schema backup failed"
        return 1
    fi
}

# Data-only backup
backup_data() {
    print_header "Data-Only Backup"
    
    local backup_file="$DATA_BACKUP_DIR/data_backup_$TIMESTAMP.sql"
    print_status "Creating data backup: $backup_file"
    
    if docker-compose exec -T db pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --data-only \
        --no-password \
        --disable-triggers \
        --column-inserts > "$backup_file"; then
        
        gzip "$backup_file"
        local backup_size=$(du -h "${backup_file}.gz" | cut -f1)
        print_status "Data backup completed (size: $backup_size)"
        return 0
    else
        print_error "Data backup failed"
        return 1
    fi
}

# Incremental backup (based on pg_stat_database)
backup_incremental() {
    print_header "Incremental Backup Information"
    
    local stats_file="$INCREMENTAL_BACKUP_DIR/db_stats_$TIMESTAMP.json"
    print_status "Collecting database statistics: $stats_file"
    
    # Get database statistics
    docker-compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT json_build_object(
            'timestamp', NOW(),
            'database_size', pg_database_size('$DB_NAME'),
            'table_stats', (
                SELECT json_agg(
                    json_build_object(
                        'table_name', schemaname || '.' || tablename,
                        'row_count', n_tup_ins + n_tup_upd,
                        'size', pg_total_relation_size(schemaname||'.'||tablename),
                        'last_vacuum', last_vacuum,
                        'last_analyze', last_analyze
                    )
                )
                FROM pg_stat_user_tables
            ),
            'activity_stats', (
                SELECT json_build_object(
                    'active_connections', COUNT(*)
                )
                FROM pg_stat_activity
                WHERE state = 'active'
            )
        );
    " -t -A > "$stats_file"
    
    print_status "Database statistics collected"
    
    # For a real incremental backup, you would need WAL archiving
    print_warning "Note: True incremental backups require WAL archiving setup"
    print_status "This creates a statistics snapshot for change tracking"
}

# Cleanup old backups
cleanup_old_backups() {
    print_header "Cleaning Up Old Backups"
    
    print_status "Removing backups older than $RETENTION_DAYS days..."
    
    # Clean up each backup type
    for dir in "$FULL_BACKUP_DIR" "$SCHEMA_BACKUP_DIR" "$DATA_BACKUP_DIR" "$INCREMENTAL_BACKUP_DIR"; do
        if [ -d "$dir" ]; then
            local count_before=$(find "$dir" -name "*.gz" -o -name "*.custom" -o -name "*.json" 2>/dev/null | wc -l)
            find "$dir" -type f \( -name "*.gz" -o -name "*.custom" -o -name "*.json" \) -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
            local count_after=$(find "$dir" -name "*.gz" -o -name "*.custom" -o -name "*.json" 2>/dev/null | wc -l)
            local cleaned=$((count_before - count_after))
            
            if [ $cleaned -gt 0 ]; then
                print_status "Cleaned $cleaned old backups from $(basename "$dir")"
            fi
        fi
    done
}

# Show backup summary
show_backup_summary() {
    print_header "Backup Summary"
    
    echo "📁 Backup Directory Structure:"
    echo "  $BACKUP_DIR/"
    echo "  ├── full/         (Complete database backups)"
    echo "  ├── schema/       (Schema-only backups)"
    echo "  ├── data/         (Data-only backups)"
    echo "  └── incremental/  (Statistics and change tracking)"
    echo ""
    
    # Show recent backups
    echo "📊 Recent Backups:"
    for dir in "$FULL_BACKUP_DIR" "$SCHEMA_BACKUP_DIR" "$DATA_BACKUP_DIR" "$INCREMENTAL_BACKUP_DIR"; do
        if [ -d "$dir" ]; then
            local type=$(basename "$dir")
            echo "  $type:"
            find "$dir" -type f \( -name "*.gz" -o -name "*.custom" -o -name "*.json" \) -exec ls -lh {} \; 2>/dev/null | awk '{print "    " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}' | sort -r | head -3
        fi
    done
    
    echo ""
    echo "💾 Total Backup Size:"
    du -sh "$BACKUP_DIR" 2>/dev/null || echo "  Unable to calculate total size"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        return 1
    fi
    
    print_status "Verifying backup integrity: $(basename "$backup_file")"
    
    # For .custom files, use pg_restore
    if [[ "$backup_file" == *.custom ]]; then
        if docker-compose exec -T db pg_restore --list "$backup_file" > /dev/null 2>&1; then
            print_status "Custom backup verification passed"
            return 0
        else
            print_error "Custom backup verification failed"
            return 1
        fi
    fi
    
    # For .sql.gz files, test decompression
    if [[ "$backup_file" == *.sql.gz ]]; then
        if zcat "$backup_file" | head -10 > /dev/null 2>&1; then
            print_status "SQL backup verification passed"
            return 0
        else
            print_error "SQL backup verification failed"
            return 1
        fi
    fi
    
    print_warning "Unknown backup format, skipping verification"
    return 0
}

# Main execution
main() {
    print_status "Starting backup process..."
    print_status "Backup type: $BACKUP_TYPE"
    print_status "Backup directory: $BACKUP_DIR"
    print_status "Retention period: $RETENTION_DAYS days"
    
    create_directories
    check_prerequisites
    
    case "$BACKUP_TYPE" in
        "full")
            backup_full
            ;;
        "schema")
            backup_schema
            ;;
        "data")
            backup_data
            ;;
        "incremental")
            backup_incremental
            ;;
        "all")
            backup_full
            backup_schema
            backup_data
            backup_incremental
            ;;
        "verify")
            if [ -n "$2" ]; then
                verify_backup "$2"
            else
                print_error "Please specify backup file to verify"
                exit 1
            fi
            ;;
        *)
            print_error "Invalid backup type: $BACKUP_TYPE"
            echo "Usage: $0 [full|schema|data|incremental|all|verify] [backup_file]"
            echo ""
            echo "Examples:"
            echo "  $0 full                    # Create full backup"
            echo "  $0 schema                  # Create schema-only backup"
            echo "  $0 data                    # Create data-only backup"
            echo "  $0 incremental             # Create incremental info"
            echo "  $0 all                     # Create all backup types"
            echo "  $0 verify backup_file.gz   # Verify backup integrity"
            exit 1
            ;;
    esac
    
    if [ "$BACKUP_TYPE" != "verify" ]; then
        cleanup_old_backups
        show_backup_summary
    fi
    
    print_status "Backup process completed successfully"
}

# Execute main function
main "$@"







