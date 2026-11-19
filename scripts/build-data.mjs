// Lấy giá đóng cửa thật (đã điều chỉnh) của 20 mã và VN-Index, cùng vài chỉ số doanh nghiệp.
// Nguồn công khai, không chính thức: VNDirect (api-finfo) và DNSE (entrade). Chỉ dùng cho cá nhân.
import fs from 'node:fs';
const T='FPT,HPG,VCB,MWG,REE,TCB,DGC,VNM,VIC,VHM,MSN,MBB,ACB,BID,CTG,SSI,VND,GAS,PNJ,VPB'.split(',');
const FROM='2024-11-01', UA={'user-agent':'Mozilla/5.0','accept':'application/json'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function j(url){ for(let i=0;i<4;i++){ try{ const r=await fetch(url,{headers:UA,signal:AbortSignal.timeout(20000)}); if(r.ok) return await r.json(); }catch(e){} await sleep(1500*(i+1)); } return null; }
const day=ts=>new Date((ts+7*3600)*1000).toISOString().slice(0,10);
async function entrade(kind,sym){ const to=Math.floor(Date.now()/1000), from=Math.floor(Date.parse(FROM)/1000);
  const d=await j(`https://services.entrade.com.vn/chart-api/v2/ohlcs/${kind}?from=${from}&to=${to}&symbol=${sym}&resolution=1D`);
  if(!d||!d.t||!d.t.length) return null; const m={}; d.t.forEach((t,i)=>m[day(t)]=d.c[i]); return m; }
async function vnd(sym){ const d=await j(`https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:${sym}~date:gte:${FROM}&size=800`);
  if(!d||!d.data||!d.data.length) return null; const m={}; d.data.forEach(x=>m[x.date]=x.adClose);
  m._ohlcv={}; d.data.forEach(x=>m._ohlcv[x.date]=[x.adOpen,x.adHigh,x.adLow,Math.round((x.nmVolume||0)+(x.ptVolume||0))]); return m; }
// Lợi nhuận sau thuế từng quý (tỷ đồng), tìm dòng theo tên trong mẫu báo cáo của VNDirect.
const MODELS={};
async function profitItems(sym){ const d=await j(`https://api-finfo.vndirect.com.vn/v4/financial_models?sort=displayOrder:asc&q=codeList:${sym}~modelType:2,90,102,412&size=400`);
  if(!d||!d.data) return []; const items=d.data.map(x=>({code:x.itemCode, name:String(x.itemVnName||x.itemName||x.vnName||''), type:x.modelType}));
  const pick=items.filter(x=>/lợi nhuận sau thuế/i.test(x.name) && !/chưa phân phối|thiểu số|không kiểm soát/i.test(x.name));
  if(!MODELS.logged){ MODELS.logged=1; console.log('Mau dong loi nhuan', sym, JSON.stringify(pick.slice(0,6)), 'truong:', Object.keys(d.data[0]||{}).join(',')); }
  const mom=pick.find(x=>/công ty mẹ|của cổ đông/i.test(x.name)); return mom?[mom]:pick.slice(0,1); }
async function quarters(sym){ try{ const it=await profitItems(sym); if(!it.length) return null;
  const d=await j(`https://api-finfo.vndirect.com.vn/v4/financial_statements?q=code:${sym}~reportType:QUARTER~modelType:2,90,102,412~itemCode:${it[0].code}~fiscalDate:gte:2022-01-01&sort=fiscalDate:asc&size=60`);
  if(!d||!d.data||!d.data.length) return null; const m={}; d.data.forEach(x=>m[x.fiscalDate]=x.numericValue);
  const ks=Object.keys(m).sort().slice(-12); return {item:it[0].name, q:ks.map(k=>[k, +(m[k]/1e9).toFixed(1)])}; }catch(e){ return null; } }
async function ratios(sym){ const d=await j(`https://api-finfo.vndirect.com.vn/v4/ratios/latest?filter=ratioCode:PRICE_TO_EARNINGS,PRICE_TO_BOOK,ROAE_TR_AVG5Q,EPS_TR,BVPS_CR&where=code:${sym}&order=reportDate&fields=ratioCode,value,reportDate`);
  const o={}; if(d&&d.data) d.data.forEach(x=>{ const k={PRICE_TO_EARNINGS:'pe',PRICE_TO_BOOK:'pb',ROAE_TR_AVG5Q:'roe',EPS_TR:'eps',BVPS_CR:'bvps'}[x.ratioCode]; if(k){ o[k]=x.value; if(!o.date||x.reportDate>o.date) o.date=x.reportDate; } }); return o; }
const idx=await entrade('index','VNINDEX'); if(!idx) throw new Error('Không lấy được VN-Index');
const days=Object.keys(idx).filter(d=>d>=FROM).sort();
const px={VNINDEX:days.map(d=>+idx[d].toFixed(2))}, f={}, via={VNINDEX:'DNSE'}, ohlcv={}, qp={};
for(const s of T){ let m=await vnd(s), src='VNDirect'; if(!m){ m=await entrade('stock',s); src='DNSE'; } if(!m){ console.error('Bỏ qua '+s); continue; }
  const v=Object.values(m).filter(x=>x>0), scale=v[v.length>>1]<1000?1000:1; // nguồn trả về nghìn đồng
  let last=null; const first=days.map(d=>m[d]).find(x=>x>0); if(!first){ console.error('Không có giá '+s); continue; }
  px[s]=days.map(d=>{ if(m[d]>0) last=m[d]; return Math.round((last??first)*scale); }); via[s]=src; f[s]=await ratios(s);
  if(m._ohlcv){ const o=[],h=[],l=[],v=[]; days.forEach((d,i)=>{ const r=m._ohlcv[d]; if(r&&r[0]>0){ o.push(Math.round(r[0]*scale)); h.push(Math.round(r[1]*scale)); l.push(Math.round(r[2]*scale)); v.push(r[3]); } else { o.push(px[s][i]); h.push(px[s][i]); l.push(px[s][i]); v.push(0); } }); ohlcv[s]={o,h,l,v}; }
  const q=await quarters(s); if(q) qp[s]=q; await sleep(300); }
console.log('Co nen va khoi luong:', Object.keys(ohlcv).length, 'ma; co loi nhuan quy:', Object.keys(qp).length, 'ma', qp.FPT?JSON.stringify(qp.FPT):'');
if(Object.keys(px).length<15) throw new Error('Thiếu quá nhiều mã, giữ file cũ');
const out={updated:new Date().toISOString(), source:'VNDirect và DNSE', days, px, f, via, ohlcv, qp};
// ---- Toàn bộ mã trên HOSE, HNX, UPCoM: tên, sàn, ngành, giá đóng cửa gần nhất (data/universe.js)
async function universe(){
  const st=await j('https://api-finfo.vndirect.com.vn/v4/stocks?q=type:STOCK~status:LISTED~floor:HOSE,HNX,UPCOM&fields=code,companyName,shortName,floor&size=3000');
  if(!st||!st.data||st.data.length<500) throw new Error('Không lấy được danh sách mã');
  const sec={}; const ind=await j('https://api-finfo.vndirect.com.vn/v4/industry_classification?q=industryLevel:2&size=200')||await j('https://api-finfo.vndirect.com.vn/v4/industry_classification?q=industryLevel:1&size=50');
  if(ind&&ind.data) ind.data.forEach(x=>String(x.codeList||'').split(',').forEach(c=>{ if(c&&!sec[c]) sec[c]=String(x.vietnameseName||'').trim(); }));
  const codes=st.data.map(x=>x.code).filter(c=>/^[A-Z0-9]{3}$/.test(c)), q={};
  for(let i=0;i<codes.length;i+=80){ const d=await j('https://bgapidatafeed.vps.com.vn/getliststockdata/'+codes.slice(i,i+80).join(','));
    if(Array.isArray(d)) d.forEach(x=>{ const p=Math.round(+x.lastPrice*1000)||Math.round(+x.r*1000); q[x.sym]=[p, Math.round(+x.r*1000), Math.round((+x.lot||0)*10)]; }); await sleep(150); }
  const list=st.data.filter(x=>codes.includes(x.code)).map(x=>{ const z=q[x.code]||[0,0,0]; return [x.code, String(x.shortName||x.companyName||'').trim(), x.floor, sec[x.code]||'', z[0], z[1], z[2]]; })
    .sort((a,b)=>a[0].localeCompare(b[0]));
  const U={updated:new Date().toISOString(), date:days[days.length-1], list};
  fs.writeFileSync('data/universe.js','window.TALENTA_UNIVERSE='+JSON.stringify(U)+';\n');
  console.log('Universe', list.length, 'ma, co gia', list.filter(x=>x[4]>0).length);
}
// ---- Quyền cổ tức (tiền và cổ phiếu) của mọi mã từ đầu bộ dữ liệu (data/events.js)
async function events(){ const out=[], seen=new Set();
  // Lấy theo từng quý để không chạm giới hạn số dòng mỗi lần hỏi, tới 6 tháng sau hôm nay (lịch chốt quyền sắp tới).
  const end=new Date(Date.now()+183*864e5).toISOString().slice(0,10);
  for(let s=FROM; s<end; ){ const dt=new Date(s); dt.setUTCMonth(dt.getUTCMonth()+3); const e=dt.toISOString().slice(0,10);
    for(let page=1; page<=5; page++){ const d=await j(`https://api-finfo.vndirect.com.vn/v4/events?q=type:DIVIDEND,STOCKDIV,KINDDIV~locale:VN~effectiveDate:gte:${s}~effectiveDate:lt:${e}&sort=effectiveDate:asc&size=500&page=${page}`);
      if(!d||!d.data||!d.data.length) break;
      d.data.forEach(x=>{ const k=[x.code,x.type,x.effectiveDate,x.dividend,x.ratio].join('|'); if(seen.has(k)) return; seen.add(k);
        out.push([x.code, x.type==='DIVIDEND'?'cash':'stock', x.effectiveDate||'', x.actualDate||x.expiredDate||'', +x.dividend||0, +x.ratio||0, String(x.note||'').slice(0,90)]); });
      await sleep(250); if(d.data.length<500) break; }
    s=e; }
  out.sort((a,b)=>a[2].localeCompare(b[2]));
  if(!out.length) throw new Error('Không có sự kiện cổ tức');
  fs.writeFileSync('data/events.js','window.TALENTA_EVENTS='+JSON.stringify({updated:new Date().toISOString(), list:out})+';\n'); console.log('Events', out.length); }
// ---- Giá vàng (PNJ), giá chứng chỉ quỹ mở (Fmarket), giá crypto (CoinGecko) (data/other.js)
async function others(){ const o={updated:new Date().toISOString(), gold:[], funds:[], crypto:[]};
  const g=await j('https://edge-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00'); if(g&&g.data) o.gold=g.data.map(x=>[x.masp, x.tensp, Math.round(+x.giamua*1000), Math.round(+x.giaban*1000)]);
  try{ const r=await fetch('https://api.fmarket.vn/res/products/filter',{method:'POST',headers:{...UA,'content-type':'application/json'},body:JSON.stringify({types:['NEW_FUND','TRADING_FUND'],issuerIds:[],sortOrder:'DESC',sortField:'navTo6Months',page:1,pageSize:200,isIpo:false,fundAssetTypes:[],bondRemainPeriods:[],searchField:'',isBuyByReward:false,thirdAppIds:[]}),signal:AbortSignal.timeout(20000)});
    const d=await r.json(); o.funds=((d.data&&d.data.rows)||[]).map(x=>[x.code||x.shortName, String(x.name||'').trim(), Math.round(+x.nav||0), (x.productNavChange&&x.productNavChange.updateAt)?new Date(x.productNavChange.updateAt).toISOString().slice(0,10):'', (x.dataFundAssetType&&x.dataFundAssetType.name)||'']).filter(x=>x[2]>0); }catch(e){ console.error('Fmarket', e.message); }
  const c=await j('https://api.coingecko.com/api/v3/coins/markets?vs_currency=vnd&order=market_cap_desc&per_page=40&page=1'); if(Array.isArray(c)) o.crypto=c.map(x=>[x.id, String(x.symbol).toUpperCase(), x.name, Math.round(x.current_price)]);
  fs.writeFileSync('data/other.js','window.TALENTA_OTHER='+JSON.stringify(o)+';\n'); console.log('Other', o.gold.length, 'vang,', o.funds.length, 'quy,', o.crypto.length, 'crypto'); }
fs.mkdirSync('data',{recursive:true});
for(const [n,fn] of [['universe',universe],['events',events],['others',others]]){ try{ await fn(); }catch(e){ console.error('Bo qua', n, e.message); } }
fs.mkdirSync('data',{recursive:true});
fs.writeFileSync('data/market.json',JSON.stringify(out));
fs.writeFileSync('data/market.js','window.TALENTA_DATA='+JSON.stringify(out)+';\n');
console.log('OK',days.length,'phiên,',Object.keys(px).length-1,'mã, đến',days[days.length-1]);
