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
probe2(){ name=$1; url=$2; shift 2
  echo "=== $name (no origin)" >> $OUT; echo "URL $url" >> $OUT
  curl -sS -m 25 -A "Mozilla/5.0" -H "Accept: application/json" "$@" -o /tmp/b.txt -w "status=%{http_code} size=%{size_download}\n" "$url" >> $OUT 2>&1
  head -c 1500 /tmp/b.txt >> $OUT 2>/dev/null; echo >> $OUT; echo >> $OUT; rm -f /tmp/b.txt; }
probe2 vnd_stocks "https://api-finfo.vndirect.com.vn/v4/stocks?q=type:STOCK~status:LISTED&size=2"
probe2 vnd_stocks_cnt "https://api-finfo.vndirect.com.vn/v4/stocks?q=type:STOCK~status:LISTED~floor:HOSE,HNX,UPCOM&fields=code,companyName,shortName,floor&size=5"
probe2 vnd_events "https://api-finfo.vndirect.com.vn/v4/events?q=code:FPT~type:DIVIDEND,STOCKDIV,KINDDIV&sort=effectiveDate:desc&size=5"
probe2 vnd_events_all "https://api-finfo.vndirect.com.vn/v4/events?q=type:DIVIDEND~effectiveDate:gte:2026-10-01&sort=effectiveDate:desc&size=3"
probe2 finfo_old_events "https://finfo-api.vndirect.com.vn/v4/events?q=code:FPT~type:DIVIDEND&size=3"
probe2 vnd_prices_upcom "https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:BSR&size=2"
probe vnd_events_origin "https://api-finfo.vndirect.com.vn/v4/events?q=code:REE&sort=effectiveDate:desc&size=3"
probe2 vps_upcom "https://bgapidatafeed.vps.com.vn/getlistckindex/upcom"
probe2 vps_quote "https://bgapidatafeed.vps.com.vn/getliststockdata/FPT,BSR,SHS"
probe2 vps_hist "https://histdatafeed.vps.com.vn/tradingview/history?symbol=SHS&resolution=D&from=$(( $(date +%s)-86400*10 ))&to=$(date +%s)"
probe2 dnse_ohlc "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=$(( $(date +%s)-86400*10 ))&to=$(date +%s)&symbol=SHS&resolution=1D"
probe dnse_ohlc_origin "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=$(( $(date +%s)-86400*10 ))&to=$(date +%s)&symbol=SHS&resolution=1D"
probe2 cafef_div "https://s.cafef.vn/Ajax/Events_RelatedNews_New.aspx?symbol=FPT&floorID=0&configID=6&PageIndex=1&PageSize=5&Type=2"
probe2 vietstock_div "https://finance.vietstock.vn/data/eventstypedata?code=FPT&eventTypeID=1&page=1&pageSize=5"
probe2 kbs_div "https://kbbuddywts.kbsec.com.vn/iis-server/investment/stock/FPT/events?l=1&p=1&s=5"
probe2 ssi_fc "https://fc-data.ssi.com.vn/api/v2/Market/Securities?market=HOSE&pageIndex=1&pageSize=2"
probe2 vndi_company "https://api-finfo.vndirect.com.vn/v4/company_profiles?q=code:SHS&size=1"
