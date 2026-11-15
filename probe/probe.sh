#!/bin/bash
# Thử các nguồn giá công khai: mã trạng thái, có cho trình duyệt gọi (CORS) không, và mẫu dữ liệu.
NOW=$(date +%s); FROM=$((NOW-86400*12)); OUT=probe/results.txt; : > $OUT
ORIGIN="https://anthonyhoangbang.github.io"
probe(){ name=$1; url=$2; shift 2
  echo "=== $name" >> $OUT; echo "URL $url" >> $OUT
  curl -sS -m 25 -H "Origin: $ORIGIN" -H "Accept: application/json" "$@" -D /tmp/h.txt -o /tmp/b.txt -w "status=%{http_code} time=%{time_total}s size=%{size_download}\n" "$url" >> $OUT 2>&1
  grep -iE "^(access-control-allow-origin|content-type|cache-control|age):" /tmp/h.txt >> $OUT 2>/dev/null
  head -c 900 /tmp/b.txt >> $OUT 2>/dev/null; echo >> $OUT; echo >> $OUT; rm -f /tmp/h.txt /tmp/b.txt; }
date -u >> $OUT
probe vnd_prices_fields "https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:FPT&size=2"
probe vnd_fin_models "https://api-finfo.vndirect.com.vn/v4/financial_models?sort=displayOrder:asc&q=codeList:FPT~modelType:2,90,102,412&size=200"
probe vnd_fin_stmt_q "https://api-finfo.vndirect.com.vn/v4/financial_statements?q=code:FPT~reportType:QUARTER~modelType:2,90,102,412~fiscalDate:gte:2024-01-01&sort=fiscalDate:desc&size=60"
probe vnd_fin_stmt_q_bank "https://api-finfo.vndirect.com.vn/v4/financial_statements?q=code:VCB~reportType:QUARTER~modelType:2,90,102,412~fiscalDate:gte:2025-01-01&sort=fiscalDate:desc&size=60"
probe vnd_ratios_q "https://api-finfo.vndirect.com.vn/v4/ratios?q=code:FPT~ratioCode:NET_PROFIT_QUARTER,NET_REVENUE_QUARTER~reportDate:gte:2024-01-01&size=50"
