#!/usr/bin/env bash
#
# 備份遠端 Supabase 資料庫的 public schema（結構 + 資料）。
#
# 需求：
#   - .env 中設定 SUPABASE_DB_PASSWORD（資料庫密碼，Dashboard → Settings → Database）
#   - pg_dump 17 以上（本機由 homebrew libpq 提供）
#
# 產出：backups/<timestamp>/{schema.sql,data.sql}（backups/ 已被 gitignore）
#
set -euo pipefail

cd "$(dirname "$0")/.."

# --- pg_dump：優先用 PATH 上的，退回 homebrew libpq ---
PG_DUMP="${PG_DUMP:-}"
if [[ -z "$PG_DUMP" ]]; then
    if command -v pg_dump >/dev/null 2>&1; then
        PG_DUMP="$(command -v pg_dump)"
    elif [[ -x /opt/homebrew/opt/libpq/bin/pg_dump ]]; then
        PG_DUMP=/opt/homebrew/opt/libpq/bin/pg_dump
    else
        echo "找不到 pg_dump。請執行：brew install libpq" >&2
        exit 1
    fi
fi

# --- 連線資訊 ---
if [[ -f .env ]]; then
    set -a; source .env; set +a
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "缺少 SUPABASE_DB_PASSWORD。請在 .env 中設定資料庫密碼後再試。" >&2
    exit 1
fi

# 連線位址由 supabase link 產生；也可用 SUPABASE_DB_URL 覆寫
DB_URL="${SUPABASE_DB_URL:-$(cat supabase/.temp/pooler-url 2>/dev/null || true)}"
if [[ -z "$DB_URL" ]]; then
    echo "找不到連線位址。請先執行 npm run db:link，或在 .env 設定 SUPABASE_DB_URL。" >&2
    exit 1
fi

OUT_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

export PGPASSWORD="$SUPABASE_DB_PASSWORD"
COMMON=(--schema=public --no-owner --quote-all-identifiers "$DB_URL")

echo "備份結構 → $OUT_DIR/schema.sql"
"$PG_DUMP" --schema-only "${COMMON[@]}" > "$OUT_DIR/schema.sql"

echo "備份資料 → $OUT_DIR/data.sql"
"$PG_DUMP" --data-only --disable-triggers "${COMMON[@]}" > "$OUT_DIR/data.sql"

echo
echo "完成："
ls -lh "$OUT_DIR"
