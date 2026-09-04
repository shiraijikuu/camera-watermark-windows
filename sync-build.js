#!/usr/bin/env node
/**
 * sync-build.js — Camera-WaterMark 内核一键同步脚本
 * 用法:
 *   node sync-build.js              # 同步所有副本并校验哈希
 *   node sync-build.js --bump-build # 同步前先把 APP_BUILD +1（内核+2处gradle+3处update.json）
 *   node sync-build.js --bump-sw    # 同步前先把 sw.js 缓存版本 +1（如 v3.0.7→v3.0.8）
 *   node sync-build.js --bump-all   # 两者都 +1
 *
 * 防止再出现"本地修了线上还是旧的"或"漏了主仓 app/index.html"。
 */
const fs=require('fs'),path=require('path'),crypto=require('crypto');

const ROOT='C:/Users/白井时空/Downloads/cwm-prototype';
const SRC_HTML=path.join(ROOT,'index.html');
const SRC_SW=path.join(ROOT,'sw.js');

// 所有 index.html 副本（含源头自身用于校验）
const HTML_TARGETS=[
  SRC_HTML,
  path.join(ROOT,'www/index.html'),
  path.join(ROOT,'android/app/src/main/assets/public/index.html'),
  'E:/codex/camera-watermark-android/www/index.html',
  'E:/codex/camera-watermark-android/android/app/src/main/assets/public/index.html',
  'E:/codex/camera-watermark-windows/index.html',
  'E:/codex/camera-watermark-pwa/index.html',
  'E:/codex/camera-watermark/app/index.html',  // 主仓（之前漏过！）
];
// 所有 sw.js 副本
const SW_TARGETS=[
  SRC_SW,
  path.join(ROOT,'www/sw.js'),
  path.join(ROOT,'android/app/src/main/assets/public/sw.js'),
  'E:/codex/camera-watermark-android/www/sw.js',
  'E:/codex/camera-watermark-android/android/app/src/main/assets/public/sw.js',
  'E:/codex/camera-watermark-windows/sw.js',
  'E:/codex/camera-watermark-pwa/sw.js',
];
// build.gradle（versionCode）
const GRADLE_TARGETS=[
  path.join(ROOT,'android/app/build.gradle'),
  'E:/codex/camera-watermark-android/android/app/build.gradle',
];
// update.json（build 字段）
const UPDATE_TARGETS=[
  'E:/codex/camera-watermark-android/update.json',
  path.join(ROOT,'android/update.json'),
  'E:/codex/camera-watermark/app/update.json',
];

function sha(buf){return crypto.createHash('sha256').update(buf).digest('hex').slice(0,16);}
function read(p){return fs.readFileSync(p);}
function write(p,buf){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,buf);}
function rel(p){return p.replace(ROOT+'/','').replace('E:/codex/','');}

const args=process.argv.slice(2);
const bumpBuild=args.includes('--bump-build')||args.includes('--bump-all');
const bumpSw=args.includes('--bump-sw')||args.includes('--bump-all');

// ===== 1. bump build =====
if(bumpBuild){
  const html=fs.readFileSync(SRC_HTML,'utf8');
  const m=html.match(/APP_BUILD=(\d+)/);
  if(!m){console.error('找不到 APP_BUILD');process.exit(1);}
  const oldB=+m[1],newB=oldB+1;
  // 内核
  fs.writeFileSync(SRC_HTML,html.replace(/APP_BUILD=\d+/,'APP_BUILD='+newB),'utf8');
  console.log(`[bump-build] 内核 APP_BUILD ${oldB} -> ${newB}`);
  // gradle versionCode
  for(const g of GRADLE_TARGETS){
    if(!fs.existsSync(g)){console.log('  skip (missing):',rel(g));continue;}
    const s=fs.readFileSync(g,'utf8');
    const gm=s.match(/versionCode\s+(\d+)/);
    if(gm){
      fs.writeFileSync(g,s.replace(/versionCode\s+\d+/,'versionCode '+newB),'utf8');
      console.log(`[bump-build] ${rel(g)} versionCode ${gm[1]} -> ${newB}`);
    }
  }
  // update.json build
  for(const u of UPDATE_TARGETS){
    if(!fs.existsSync(u)){console.log('  skip (missing):',rel(u));continue;}
    try{
      const j=JSON.parse(fs.readFileSync(u,'utf8'));
      const oldJ=j.build||0;
      j.build=newB;
      if(!j.releaseDate)j.releaseDate=new Date().toISOString().slice(0,10);
      fs.writeFileSync(u,JSON.stringify(j,null,2)+'\n','utf8');
      console.log(`[bump-build] ${rel(u)} build ${oldJ} -> ${newB}`);
    }catch(e){console.log('  skip (parse fail):',rel(u),e.message);}
  }
}

// ===== 2. bump sw cache version =====
if(bumpSw){
  const sw=fs.readFileSync(SRC_SW,'utf8');
  const m=sw.match(/cwm-pwa-v(\d+)\.(\d+)\.(\d+)/);
  if(!m){console.error('sw.js 找不到缓存版本号');process.exit(1);}
  const [,a,b,c]=m;const newV=`cwm-pwa-v${a}.${b}.${(+c)+1}`;
  fs.writeFileSync(SRC_SW,sw.replace(/cwm-pwa-v[\d.]+/g,newV),'utf8');
  console.log(`[bump-sw] sw 缓存 ${m[0]} -> ${newV}`);
}

// ===== 3. 同步 index.html =====
console.log('\n=== 同步 index.html ===');
const srcBuf=read(SRC_HTML);const srcHash=sha(srcBuf);
let htmlOk=true;
for(const t of HTML_TARGETS){
  try{write(t,srcBuf);const h=sha(read(t));const ok=h===srcHash;if(!ok)htmlOk=false;
    console.log(`  ${ok?'OK ':'FAIL'} ${h}  ${rel(t)}`);
  }catch(e){htmlOk=false;console.log(`  FAIL ${e.message}  ${rel(t)}`);}
}

// ===== 4. 同步 sw.js =====
console.log('\n=== 同步 sw.js ===');
const swBuf=read(SRC_SW);const swHash=sha(swBuf);let swOk=true;
for(const t of SW_TARGETS){
  try{write(t,swBuf);const h=sha(read(t));const ok=h===swHash;if(!ok)swOk=false;
    console.log(`  ${ok?'OK ':'FAIL'} ${h}  ${rel(t)}`);
  }catch(e){swOk=false;console.log(`  FAIL ${e.message}  ${rel(t)}`);}
}

// ===== 5. 汇总 =====
console.log('\n=== 汇总 ===');
console.log(`index.html: ${htmlOk?'全部一致 ✓':'有不一致 ✗'} (源哈希 ${srcHash})`);
console.log(`sw.js:      ${swOk?'全部一致 ✓':'有不一致 ✗'} (源哈希 ${swHash})`);
if(bumpBuild)console.log(`APP_BUILD/versionCode/update.json.build 已同步升号`);
if(bumpSw)console.log(`sw 缓存版本已升号`);
if(!htmlOk||!swOk){process.exit(1);}
console.log('\n下一步：重打三端 → 校验 APK/asar 内核哈希 → 上传 Release。');
