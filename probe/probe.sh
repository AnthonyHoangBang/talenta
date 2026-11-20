#!/bin/bash
# Thử nguồn chỉ số thị trường (VN30, HNX-Index, UPCoM-Index).
OUT=probe/results.txt; : > $OUT; date -u >> $OUT
p(){ echo "=== $1" >> $OUT; echo "URL $2" >> $OUT; curl -sS -m 25 -A "Mozilla/5.0" -H "Origin: https://anthonyhoangbang.github.io" -D /tmp/h.txt -o /tmp/b.txt -w "status=%{http_code} size=%{size_download}\n" "$2" >> $OUT 2>&1; grep -i "^access-control-allow-origin" /tmp/h.txt >> $OUT; head -c 1500 /tmp/b.txt >> $OUT; echo >> $OUT; echo >> $OUT; }
NOW=$(date +%s); F=$((NOW-86400*8))
p vps_idx10 "https://bgapidatafeed.vps.com.vn/getlistindexdetail/10"
p vps_idx_multi "https://bgapidatafeed.vps.com.vn/getlistindexdetail/10,11,02,03"
p vps_idx_02 "https://bgapidatafeed.vps.com.vn/getlistindexdetail/02"
for s in VNINDEX VN30 HNXINDEX HNX UPCOMINDEX UPCOM HNX30; do p dnse_$s "https://services.entrade.com.vn/chart-api/v2/ohlcs/index?from=$F&to=$NOW&symbol=$s&resolution=1D"; done
p vnd_ratio_multi "https://api-finfo.vndirect.com.vn/v4/ratios/latest?filter=ratioCode:PRICE_TO_EARNINGS&where=code:SHS,BSR&order=reportDate&fields=code,ratioCode,value,reportDate"
