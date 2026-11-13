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
probe vps_quote "https://bgapidatafeed.vps.com.vn/getliststockdata/FPT,HPG,VCB"
probe vps_index "https://bgapidatafeed.vps.com.vn/getlistindexdetail/10"
probe vps_hist "https://histdatafeed.vps.com.vn/tradingview/history?symbol=FPT&resolution=D&from=$FROM&to=$NOW"
probe entrade_stock_D "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=$FROM&to=$NOW&symbol=FPT&resolution=1D"
probe entrade_stock_1m "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=$((NOW-86400*4))&to=$NOW&symbol=FPT&resolution=1"
probe entrade_index "https://services.entrade.com.vn/chart-api/v2/ohlcs/index?from=$FROM&to=$NOW&symbol=VNINDEX&resolution=1D"
probe vnd_dchart "https://dchart-api.vndirect.com.vn/dchart/history?symbol=FPT&resolution=D&from=$FROM&to=$NOW"
probe vnd_dchart_idx "https://dchart-api.vndirect.com.vn/dchart/history?symbol=VNINDEX&resolution=D&from=$FROM&to=$NOW"
probe vnd_finfo_prices "https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:FPT&size=3"
probe vnd_api_prices "https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:FPT&size=3"
probe vnd_api_ratios "https://api-finfo.vndirect.com.vn/v4/ratios/latest?filter=ratioCode:PRICE_TO_EARNINGS,PRICE_TO_BOOK,ROAE_TR_AVG5Q,EPS_TR,BVPS_CR&where=code:FPT&order=reportDate&fields=ratioCode,value,reportDate"
probe tcbs_bars "https://apipubaws.tcbs.com.vn/stock-insight/v2/stock/bars-long-term?resolution=D&ticker=FPT&type=stock&to=$NOW&countBack=5"
probe tcbs_overview "https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/FPT/overview"
probe ssi_iboard "https://iboard-query.ssi.com.vn/stock/FPT"
probe ssi_chart "https://iboard-api.ssi.com.vn/statistics/charts/history?resolution=1D&symbol=FPT&from=$FROM&to=$NOW"
probe yahoo "https://query1.finance.yahoo.com/v8/finance/chart/FPT.VN?range=5d&interval=1d"
