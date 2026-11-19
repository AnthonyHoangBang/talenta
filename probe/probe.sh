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
T=$(date -u +%F); Y=$(date -u -d '-7 day' +%F)
probe vnd_stocks "https://api-finfo.vndirect.com.vn/v4/stocks?q=type:STOCK~status:LISTED&fields=code,companyName,companyNameEng,shortName,floor,industryName,listedDate&size=3"
probe vnd_stocks_count "https://api-finfo.vndirect.com.vn/v4/stocks?q=type:STOCK~status:LISTED~floor:HOSE,HNX,UPCOM&size=1"
probe vnd_prices_bulk_day "https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=date:gte:$Y&size=3"
probe vnd_prices_floor "https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=floor:UPCOM~date:gte:$Y&size=2"
probe vnd_events_div "https://api-finfo.vndirect.com.vn/v4/events?q=code:FPT~type:DIVIDEND,STOCKDIV&sort=effectiveDate:desc&size=4"
probe vnd_events_any "https://api-finfo.vndirect.com.vn/v4/events?q=code:REE&sort=effectiveDate:desc&size=4"
probe vnd_rights "https://api-finfo.vndirect.com.vn/v4/rights?q=code:FPT&size=3"
probe vnd_industry "https://api-finfo.vndirect.com.vn/v4/industry_classification?q=industryLevel:1&size=3"
probe vps_all_hose "https://bgapidatafeed.vps.com.vn/getlistckindex/hose"
probe vps_all_hnx "https://bgapidatafeed.vps.com.vn/getlistckindex/hnx"
probe vps_index_hnx "https://bgapidatafeed.vps.com.vn/getlistindexdetail/02,03,10,11"
probe sjc "https://sjc.com.vn/GoldPrice/Services/PriceService.ashx" -X POST
probe btmc "http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v"
probe pnj "https://edge-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00"
probe doji "http://giavang.doji.vn/api/giavang/?api_key=258fbd2a72ce8481089d88c678e9fe4f"
probe mihong "https://www.mihong.vn/api/v1/gold/prices/current"
probe giavang_org "https://giavang.org/"
probe webgia "https://webgia.com/gia-vang/sjc/"
probe coingecko "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=vnd,usd"
probe binance "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
probe binance_vision "https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT"
probe fmarket_filter "https://api.fmarket.vn/res/products/filter" -X POST -H "Content-Type: application/json" --data '{"types":["NEW_FUND","TRADING_FUND"],"issuerIds":[],"sortOrder":"DESC","sortField":"navTo6Months","page":1,"pageSize":3,"isIpo":false,"fundAssetTypes":[],"bondRemainPeriods":[],"searchField":"","isBuyByReward":false,"thirdAppIds":[]}'
probe vcb_fx "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx"
probe er_api "https://open.er-api.com/v6/latest/USD"
