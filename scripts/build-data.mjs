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
  if(!d||!d.data||!d.data.length) return null; const m={}; d.data.forEach(x=>m[x.date]=x.adClose); return m; }
async function ratios(sym){ const d=await j(`https://api-finfo.vndirect.com.vn/v4/ratios/latest?filter=ratioCode:PRICE_TO_EARNINGS,PRICE_TO_BOOK,ROAE_TR_AVG5Q,EPS_TR,BVPS_CR&where=code:${sym}&order=reportDate&fields=ratioCode,value,reportDate`);
  const o={}; if(d&&d.data) d.data.forEach(x=>{ const k={PRICE_TO_EARNINGS:'pe',PRICE_TO_BOOK:'pb',ROAE_TR_AVG5Q:'roe',EPS_TR:'eps',BVPS_CR:'bvps'}[x.ratioCode]; if(k){ o[k]=x.value; if(!o.date||x.reportDate>o.date) o.date=x.reportDate; } }); return o; }
const idx=await entrade('index','VNINDEX'); if(!idx) throw new Error('Không lấy được VN-Index');
const days=Object.keys(idx).filter(d=>d>=FROM).sort();
const px={VNINDEX:days.map(d=>+idx[d].toFixed(2))}, f={}, via={VNINDEX:'DNSE'};
for(const s of T){ let m=await vnd(s), src='VNDirect'; if(!m){ m=await entrade('stock',s); src='DNSE'; } if(!m){ console.error('Bỏ qua '+s); continue; }
  const v=Object.values(m).filter(x=>x>0), scale=v[v.length>>1]<1000?1000:1; // nguồn trả về nghìn đồng
  let last=null; const first=days.map(d=>m[d]).find(x=>x>0); if(!first){ console.error('Không có giá '+s); continue; }
  px[s]=days.map(d=>{ if(m[d]>0) last=m[d]; return Math.round((last??first)*scale); }); via[s]=src; f[s]=await ratios(s); await sleep(300); }
if(Object.keys(px).length<15) throw new Error('Thiếu quá nhiều mã, giữ file cũ');
const out={updated:new Date().toISOString(), source:'VNDirect và DNSE', days, px, f, via};
fs.mkdirSync('data',{recursive:true});
fs.writeFileSync('data/market.json',JSON.stringify(out));
fs.writeFileSync('data/market.js','window.TALENTA_DATA='+JSON.stringify(out)+';\n');
console.log('OK',days.length,'phiên,',Object.keys(px).length-1,'mã, đến',days[days.length-1]);
