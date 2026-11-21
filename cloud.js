(function(root){
  'use strict';

  const B=root.APP_BASELINE,W=root.WorkbenchStore;
  if(!B||!W)return;

  const CONFIG={
    projectId:'hiring-post-observatory',
    apiKey:'AIzaSyCbouN0B-AybtVnvlOTkblXCyGve-3_F80',
    workspace:'com5507-main',
    pollMs:6*60*60*1000,
    minRefreshGapMs:6*60*60*1000,
    cachedFreshMs:6*60*60*1000,
    pageSize:1000,
    quotaBackoffMs:15*60*1000
  };
  const PROFILE_KEY='com5507-cloud-profile-v1';
  const DIRTY_KEY='com5507-cloud-dirty-v1';
  const SYNC_STAMP_KEY='com5507-cloud-last-sync-v1';
  const COOLDOWN_KEY='com5507-cloud-cooldown-v1';
  const QUERY_KEY='?key='+encodeURIComponent(CONFIG.apiKey);
  const ROOT='https://firestore.googleapis.com/v1/projects/'+CONFIG.projectId+'/databases/(default)/documents';
  const KINDS=['posts','comments','updates'];
  const clone=x=>typeof structuredClone==='function'?structuredClone(x):JSON.parse(JSON.stringify(x));
  const now=()=>new Date().toISOString();
  const safeId=v=>String(v||'').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,1400);
  const random=i=>Math.random().toString(36).slice(2,2+i);
  let profile=readProfile();
  let currentState=W.empty(B);
  let onState=null;
  let lastCloud=emptyCloud();
  let lastCloudSignature='';
  let lastRefreshStartedAt=0;
  let lastSuccessfulRefreshAt=Number(localStorage.getItem(SYNC_STAMP_KEY)||0);
  let nextRefreshNotBefore=Number(localStorage.getItem(COOLDOWN_KEY)||0);
  let dirty=readDirty();
  let status={mode:'connecting',detail:'正在连接共享数据库',lastSyncAt:null,queued:0};
  let pollTimer=null,flushTimer=null,refreshing=null,scheduled=false;

  function emptyCloud(){
    return {records:new Map(),reports:new Map(),reportItems:new Map(),signature:''};
  }

  function readProfile(){
    let value=null;
    try{value=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');}catch(_){}
    const clientId=value&&typeof value.clientId==='string'&&value.clientId?value.clientId:'client_'+Date.now().toString(36)+'_'+random(8);
    const alias=value&&typeof value.alias==='string'?value.alias.slice(0,40):'';
    const next={clientId,alias:alias||'访客-'+clientId.slice(-4).toUpperCase(),named:!!value?.named};
    writeProfile(next);
    return next;
  }

  function writeProfile(next){
    try{localStorage.setItem(PROFILE_KEY,JSON.stringify(next));}catch(_){}
  }

  function readDirty(){
    try{
      const value=JSON.parse(localStorage.getItem(DIRTY_KEY)||'null');
      return {records:new Set(value&&Array.isArray(value.records)?value.records:[]),reports:new Set(value&&Array.isArray(value.reports)?value.reports:[])};
    }catch(_){return {records:new Set(),reports:new Set()};}
  }

  function saveDirty(){
    try{localStorage.setItem(DIRTY_KEY,JSON.stringify({records:[...dirty.records],reports:[...dirty.reports]}));}catch(_){}
    status.queued=dirty.records.size+dirty.reports.size;
    emitStatus();
  }

  function emitStatus(){
    try{root.dispatchEvent(new CustomEvent('workbench-cloud-status',{detail:clone(status)}));}catch(_){}
  }

  function setStatus(mode,detail,error){
    status={...status,mode,detail,error:error||'',lastSyncAt:mode==='online'?now():status.lastSyncAt};
    emitStatus();
  }

  function enrich(state){
    const out=clone(state||W.empty(B));
    out.additions=out.additions||{posts:[],comments:[],updates:[]};
    KINDS.forEach(kind=>{
      out.additions[kind]=(Array.isArray(out.additions[kind])?out.additions[kind]:[]).map(item=>{
        if(!item||!item.reviewId)return item;
        return {
          ...item,
          submittedAt:item.submittedAt||now(),
          submitterAlias:item.submitterAlias||profile.alias,
          clientId:item.clientId||profile.clientId
        };
      });
    });
    out.drafts=Array.isArray(out.drafts)?out.drafts:[];
    out.snapshots=Array.isArray(out.snapshots)?out.snapshots:[];
    return out;
  }

  function latestDecision(entries){
    if(!entries||!entries.length)return null;
    return entries.slice().sort((a,b)=>String(a.decidedAt||'').localeCompare(String(b.decidedAt||''))).at(-1);
  }

  function cloudItem(raw,decisionHistory){
    let record;
    try{record=JSON.parse(raw.recordJson||'null');}catch(_){return null;}
    if(!record||typeof record!=='object')return null;
    const latest=latestDecision(decisionHistory);
    return {
      ...record,
      reviewId:raw.reviewId,
      reviewStatus:latest?latest.status:'pending',
      reviewDecisionAt:latest?latest.decidedAt:'',
      reviewDecisionBy:latest?latest.alias:'',
      decisionHistory:decisionHistory||[],
      submitterAlias:raw.submitterAlias||'匿名',
      submittedAt:raw.submittedAt||'',
      clientId:raw.clientId||'',
      cloudSynced:true
    };
  }

  function mergeState(local,cloud){
    const base=enrich(local||W.empty(B));
    const out=W.empty(B);
    out.drafts=clone(base.drafts);
    KINDS.forEach(kind=>{
      const merged=new Map();
      (base.additions[kind]||[]).forEach(item=>{if(item&&item.reviewId)merged.set(item.reviewId,item);});
      cloud.records.forEach(raw=>{
        if(raw.kind!==kind)return;
        const remote=cloudItem(raw,raw._decisions||[]);
        if(!remote)return;
        // Cloud records and decisions are append-only and authoritative. A stale
        // local pending copy must not overwrite a decision already on the server.
        merged.set(raw.reviewId,remote);
      });
      out.additions[kind]=[...merged.values()].sort((a,b)=>{
        const left=String(a.submittedAt||'');
        const right=String(b.submittedAt||'');
        return left.localeCompare(right)||String(a.reviewId).localeCompare(String(b.reviewId));
      });
    });

    const reports=new Map();
    (base.snapshots||[]).forEach(item=>{if(item&&item.id)reports.set(item.id,item);});
    cloud.reports.forEach((reportData,id)=>{
      if(dirty.reports.has(id)&&reports.has(id))return;
      const meta=reportData.meta||{};
      const additions={posts:[],comments:[],updates:[]};
      (cloud.reportItems.get(id)||[]).forEach(item=>{
        if(!KINDS.includes(item.kind))return;
        let record;
        try{record=JSON.parse(item.recordJson||'null');}catch(_){return;}
        if(record&&typeof record==='object'){
          additions[item.kind].push({...record,reviewStatus:'approved',cloudSynced:true});
        }
      });
      reports.set(id,{
        id,
        label:meta.label||'共享报告',
        createdAt:meta.createdAt||'',
        createdBy:meta.createdBy||'',
        baselineVersion:meta.baselineVersion||B.version,
        additions
      });
    });
    out.snapshots=[...reports.values()].sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
    return out;
  }

  function fsValue(value,type){
    if(type==='timestamp')return {timestampValue:String(value)};
    if(value===null||value===undefined)return {nullValue:null};
    return {stringValue:String(value)};
  }

  function fields(values,types){
    const out={};
    Object.keys(values).forEach(key=>{out[key]=fsValue(values[key],types&&types[key]);});
    return out;
  }

  async function request(url,options){
    const response=await fetch(url,options);
    if(!response.ok){
      let message='共享数据库请求失败（HTTP '+response.status+'）';
      try{
        const body=await response.json();
        if(body&&body.error&&body.error.message)message=body.error.message;
      }catch(_){}
      const error=new Error(message);
      error.status=response.status;
      if(response.status===429){
        const retryAfter=Number(response.headers.get('retry-after'));
        error.retryAfterMs=Number.isFinite(retryAfter)&&retryAfter>0?retryAfter*1000:CONFIG.quotaBackoffMs;
      }
      throw error;
    }
    const text=await response.text();
    return text?JSON.parse(text):{};
  }

  async function listAll(collection){
    const docs=[];
    let token='';
    do{
      const suffix=(token?'&pageToken='+encodeURIComponent(token):'');
      const data=await request(ROOT+'/'+collection+'?pageSize='+CONFIG.pageSize+suffix+(QUERY_KEY.startsWith('?')?'&'+QUERY_KEY.slice(1):''));
      (data.documents||[]).forEach(doc=>docs.push(doc));
      token=data.nextPageToken||'';
    }while(token);
    return docs;
  }

  function docsSignature(groups){
    let hash=2166136261;
    groups.forEach(docs=>{
      docs.forEach(doc=>{
        const token=String(doc.name||'')+'|'+String(doc.updateTime||'')+'|';
        for(let i=0;i<token.length;i+=1){
          hash^=token.charCodeAt(i);
          hash=Math.imul(hash,16777619);
        }
      });
    });
    return (hash>>>0).toString(36)+':'+groups.map(docs=>docs.length).join('.');
  }

  function docId(doc){
    const name=String(doc&&doc.name||'');
    return name.slice(name.lastIndexOf('/')+1);
  }

  function stringField(doc,key){
    const value=doc&&doc.fields&&doc.fields[key];
    return value&&typeof value.stringValue==='string'?value.stringValue:'';
  }

  function timestampField(doc,key){
    const value=doc&&doc.fields&&doc.fields[key];
    return value&&typeof value.timestampValue==='string'?value.timestampValue:'';
  }

  async function create(collection,id,values,types){
    try{
      return await request(ROOT+'/'+collection+'?documentId='+encodeURIComponent(id)+(QUERY_KEY.startsWith('?')?'&'+QUERY_KEY.slice(1):''),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({fields:fields(values,types)})
      });
    }catch(error){
      if(error.status===409)return {};
      throw error;
    }
  }

  async function fetchCloud(){
    const recordDocs=await listAll('records');
    const decisionDocs=await listAll('decisions');
    const reportDocs=await listAll('reports');
    const itemDocs=await listAll('reportItems');
    const cloud=emptyCloud();
    cloud.signature=docsSignature([recordDocs,decisionDocs,reportDocs,itemDocs]);
    const decisions=new Map();
    decisionDocs.forEach(doc=>{
      const reviewId=stringField(doc,'reviewId');
      if(!reviewId)return;
      const entry={
        id:docId(doc),
        reviewId,
        status:stringField(doc,'status'),
        alias:stringField(doc,'alias')||'匿名',
        clientId:stringField(doc,'clientId'),
        decidedAt:timestampField(doc,'decidedAt')
      };
      if(!['approved','rejected'].includes(entry.status))return;
      if(!decisions.has(reviewId))decisions.set(reviewId,[]);
      decisions.get(reviewId).push(entry);
    });
    recordDocs.forEach(doc=>{
      const reviewId=stringField(doc,'reviewId');
      const kind=stringField(doc,'kind');
      const recordJson=stringField(doc,'recordJson');
      if(!reviewId||!KINDS.includes(kind)||!recordJson)return;
      const raw={
        id:docId(doc),
        reviewId,
        kind,
        recordJson,
        baselineVersion:stringField(doc,'baselineVersion'),
        baselineHash:stringField(doc,'baselineHash'),
        submitterAlias:stringField(doc,'submitterAlias'),
        clientId:stringField(doc,'clientId'),
        submittedAt:timestampField(doc,'submittedAt'),
        _decisions:decisions.get(reviewId)||[]
      };
      cloud.records.set(reviewId,raw);
    });
    reportDocs.forEach(doc=>{
      let meta;
      try{meta=JSON.parse(stringField(doc,'metaJson')||'null');}catch(_){return;}
      if(!meta||!meta.id)return;
      cloud.reports.set(meta.id,{id:meta.id,meta,docId:docId(doc)});
    });
    itemDocs.forEach(doc=>{
      const reportId=stringField(doc,'reportId');
      const kind=stringField(doc,'kind');
      const recordJson=stringField(doc,'recordJson');
      const reviewId=stringField(doc,'reviewId');
      if(!reportId||!KINDS.includes(kind)||!recordJson||!reviewId)return;
      if(!cloud.reportItems.has(reportId))cloud.reportItems.set(reportId,[]);
      cloud.reportItems.get(reportId).push({id:docId(doc),reviewId,kind,recordJson});
    });
    return cloud;
  }

  function recordValues(kind,item){
    return {
      workspace:CONFIG.workspace,
      schemaVersion:'1',
      baselineVersion:B.version,
      baselineHash:B.meta&&B.meta.hashes?B.meta.hashes.records:B.version,
      kind,
      reviewId:item.reviewId,
      submitterAlias:String(item.submitterAlias||profile.alias).slice(0,40),
      clientId:String(item.clientId||profile.clientId).slice(0,80),
      submittedAt:item.submittedAt||now(),
      recordJson:JSON.stringify(item)
    };
  }

  async function writeDecision(item,statusValue){
    const id=safeId(item.reviewId+'_'+statusValue+'_'+Date.now()+'_'+random(5));
    await create('decisions',id,{
      workspace:CONFIG.workspace,
      schemaVersion:'1',
      reviewId:item.reviewId,
      status:statusValue,
      alias:profile.alias,
      clientId:profile.clientId,
      decidedAt:now()
    },{decidedAt:'timestamp'});
  }

  async function writeReport(snapshot){
    const meta={
      id:snapshot.id,
      label:snapshot.label,
      createdAt:snapshot.createdAt,
      baselineVersion:snapshot.baselineVersion||B.version,
      createdBy:profile.alias
    };
    await create('reports',safeId(snapshot.id),{
      workspace:CONFIG.workspace,
      schemaVersion:'1',
      reportId:snapshot.id,
      metaJson:JSON.stringify(meta),
      createdAt:snapshot.createdAt||now(),
      createdBy:profile.alias,
      clientId:profile.clientId
    },{createdAt:'timestamp'});
    const items=[];
    KINDS.forEach(kind=>(snapshot.additions&&snapshot.additions[kind]||[]).forEach(item=>{
      if(item&&item.reviewId)items.push({kind,item});
    }));
    for(const {kind,item} of items){
      const id=safeId(snapshot.id+'_'+kind+'_'+item.reviewId);
      await create('reportItems',id,{
        workspace:CONFIG.workspace,
        schemaVersion:'1',
        reportId:snapshot.id,
        kind,
        reviewId:item.reviewId,
        recordJson:JSON.stringify(item)
      });
    }
  }

  async function pushOnce(){
    const base=enrich(currentState);
    let wrote=false;
    for(const kind of KINDS){
      for(const item of base.additions[kind]||[]){
        if(!item||!item.reviewId)continue;
        const remote=lastCloud.records.get(item.reviewId);
        if(!remote){
          await create('records',safeId(item.reviewId),recordValues(kind,item),{submittedAt:'timestamp'});
          lastCloud.records.set(item.reviewId,{kind,reviewId:item.reviewId,_decisions:[]});
          if(item.reviewStatus!=='pending')await writeDecision(item,item.reviewStatus);
          dirty.records.delete(item.reviewId);
          wrote=true;
          continue;
        }
        if(dirty.records.has(item.reviewId)){
          const latest=latestDecision(remote._decisions||[]);
          const remoteStatus=latest?latest.status:'pending';
          if(item.reviewStatus!==remoteStatus&&['approved','rejected'].includes(item.reviewStatus)){
            await writeDecision(item,item.reviewStatus);
          }
          dirty.records.delete(item.reviewId);
          wrote=true;
        }
      }
    }
    for(const snapshot of base.snapshots||[]){
      if(!snapshot||!snapshot.id)continue;
      if(!lastCloud.reports.has(snapshot.id)||dirty.reports.has(snapshot.id)){
        await writeReport(snapshot);
        lastCloud.reports.set(snapshot.id,{id:snapshot.id,meta:snapshot});
        dirty.reports.delete(snapshot.id);
        wrote=true;
      }
    }
    const presentRecords=new Set(KINDS.flatMap(kind=>(base.additions[kind]||[]).map(item=>item&&item.reviewId).filter(Boolean)));
    const presentReports=new Set((base.snapshots||[]).map(item=>item&&item.id).filter(Boolean));
    [...dirty.records].forEach(id=>{if(!presentRecords.has(id))dirty.records.delete(id);});
    [...dirty.reports].forEach(id=>{if(!presentReports.has(id))dirty.reports.delete(id);});
    saveDirty();
    return wrote;
  }

  async function flushLoop(){
    if(refreshing){await refreshing;return;}
    if(flushTimer)return;
    flushTimer=setTimeout(async()=>{
      flushTimer=null;
      try{
        setStatus('syncing','正在同步共享数据');
        let changed=false;
        do{
          scheduled=false;
          changed=await pushOnce()||changed;
        }while(scheduled||dirty.records.size||dirty.reports.size);
        if(changed)await refresh(true);
        else setStatus('online','共享数据库已连接');
      }catch(error){
        if(error.status===429){nextRefreshNotBefore=Date.now()+(error.retryAfterMs||CONFIG.quotaBackoffMs);try{localStorage.setItem(COOLDOWN_KEY,String(nextRefreshNotBefore));}catch(_){}}
        setStatus('offline',error.status===429?'云端读取配额暂时用尽；继续使用本机缓存':'云端暂不可用，改动已保存在本机',error.message);
      }
    },20);
  }

  async function refresh(force){
    if(refreshing)return refreshing;
    if(!force&&nextRefreshNotBefore&&Date.now()<nextRefreshNotBefore){
      setStatus('cached','正在使用本机数据库；云端请求配额恢复后自动重试');
      return;
    }
    if(!force&&lastSuccessfulRefreshAt&&Date.now()-lastSuccessfulRefreshAt<CONFIG.cachedFreshMs){
      setStatus('cached','本机数据仍在 6 小时有效期内；可点击“立即同步”强制检查');
      return;
    }
    if(!force&&lastRefreshStartedAt&&Date.now()-lastRefreshStartedAt<CONFIG.minRefreshGapMs)return;
    lastRefreshStartedAt=Date.now();
    refreshing=(async()=>{
      setStatus('syncing','正在读取全组数据');
      const cloud=await fetchCloud();
      lastCloud=cloud;
      const cloudChanged=cloud.signature!==lastCloudSignature;
      if(cloudChanged){
        lastCloudSignature=cloud.signature;
        currentState=mergeState(currentState,cloud);
        if(onState)onState(clone(currentState),{initial:false});
      }
      lastSuccessfulRefreshAt=Date.now();
      nextRefreshNotBefore=0;
      try{localStorage.setItem(SYNC_STAMP_KEY,String(lastSuccessfulRefreshAt));localStorage.removeItem(COOLDOWN_KEY);}catch(_){}
      setStatus('online','全组数据已同步');
      const hasLocalOnly=KINDS.some(kind=>(currentState.additions[kind]||[]).some(item=>item&&item.reviewId&&!cloud.records.has(item.reviewId)))||(currentState.snapshots||[]).some(item=>item&&item.id&&!cloud.reports.has(item.id));
      if(force||hasLocalOnly||dirty.records.size||dirty.reports.size)flushLoop();
    })().catch(error=>{
      if(error.status===429){nextRefreshNotBefore=Date.now()+(error.retryAfterMs||CONFIG.quotaBackoffMs);try{localStorage.setItem(COOLDOWN_KEY,String(nextRefreshNotBefore));}catch(_){}}
      setStatus('offline',error.status===429?'云端读取配额暂时用尽；继续使用本机缓存':'云端暂不可用，改动已保存在本机',error.message);
      if(onState)onState(clone(currentState),{initial:false,error:error.message});
    }).finally(()=>{refreshing=null;});
    return refreshing;
  }

  function beforeCommit(next){
    return enrich(next);
  }

  function afterCommit(previous,next){
    currentState=enrich(next);
    const previousMap=new Map();
    KINDS.forEach(kind=>(previous.additions&&previous.additions[kind]||[]).forEach(item=>{if(item&&item.reviewId)previousMap.set(item.reviewId,item);}));
    KINDS.forEach(kind=>(currentState.additions[kind]||[]).forEach(item=>{
      if(!item||!item.reviewId)return;
      const before=previousMap.get(item.reviewId);
      if(!before||before.reviewStatus!==item.reviewStatus)dirty.records.add(item.reviewId);
    }));
    const previousReports=new Set((previous.snapshots||[]).map(item=>item&&item.id).filter(Boolean));
    (currentState.snapshots||[]).forEach(item=>{if(item&&item.id&&!previousReports.has(item.id))dirty.reports.add(item.id);});
    saveDirty();
    flushLoop();
  }

  async function init(localState,listener){
    currentState=enrich(localState||W.empty(B));
    onState=listener;
    updateProfileButton();
    emitStatus();
    const hasCachedData=KINDS.some(kind=>(currentState.additions[kind]||[]).length)||(currentState.snapshots||[]).length;
    if(hasCachedData){
      status={...status,mode:'cached',detail:'本机数据库已载入；正在后台核对全组更新',error:'',lastSyncAt:lastSuccessfulRefreshAt||status.lastSyncAt};
      emitStatus();
      setTimeout(()=>refresh(false),250);
    }else{
      await refresh(false);
    }
    if(!pollTimer){
      pollTimer=setInterval(()=>{if(document.visibilityState==='visible')refresh(false);},CONFIG.pollMs);
    }
    window.addEventListener('focus',()=>refresh(false));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(false);});
  }

  function getAlias(){return profile.alias;}
  function getClientId(){return profile.clientId;}

  function setAlias(value){
    const alias=String(value||'').replace(/[\r\n\t]/g,' ').replace(/\s+/g,' ').trim().slice(0,40);
    if(!alias)throw new Error('提交者别名不能为空');
    profile={...profile,alias,named:true};
    writeProfile(profile);
    updateProfileButton();
    return alias;
  }

  async function forceSync(){
    await refresh(true);
  }

  function updateProfileButton(){
    const button=document.getElementById('cloud-profile');
    if(button){
      button.textContent=profile.alias;
      button.title='提交者别名：'+profile.alias;
    }
    const input=document.getElementById('cloud-alias-input');
    if(input&&document.activeElement!==input)input.value=profile.alias;
  }

  function bindUi(){
    const profileButton=document.getElementById('cloud-profile');
    const dialog=document.getElementById('cloud-profile-dialog');
    const form=document.getElementById('cloud-profile-form');
    const syncButton=document.getElementById('cloud-sync-now');
    if(profileButton&&dialog){
      profileButton.addEventListener('click',()=>{
        const input=document.getElementById('cloud-alias-input');
        if(input)input.value=profile.alias;
        dialog.showModal();
      });
      dialog.addEventListener('close',()=>{
        if(profile.named)return;
        profile={...profile,named:true};
        writeProfile(profile);
      });
    }
    if(form){
      form.addEventListener('submit',event=>{
        event.preventDefault();
        try{
          setAlias(new FormData(form).get('alias'));
          dialog.close();
          root.dispatchEvent(new CustomEvent('workbench-cloud-toast',{detail:{message:'提交者别名已更新'}}));
        }catch(error){
          const errorBox=document.getElementById('cloud-profile-error');
          if(errorBox)errorBox.textContent=error.message;
        }
      });
    }
    if(syncButton)syncButton.addEventListener('click',()=>forceSync());
    const close=dialog&&dialog.querySelector('.close-cloud-profile');
    if(close)close.addEventListener('click',()=>dialog.close());
    root.addEventListener('workbench-cloud-status',event=>renderStatus(event.detail));
    window.addEventListener('workbench-language-change',()=>renderStatus(status));
    renderStatus(status);
  }

  function renderStatus(value){
    const text=document.getElementById('cloud-status-text');
    const detail=document.getElementById('cloud-status-detail');
    const dot=document.getElementById('cloud-status-dot');
    const button=document.getElementById('cloud-sync-now');
    const translate=root.WorkbenchI18n?.t||(s=>String(s));
    if(dot)dot.className='status-dot cloud-'+value.mode;
    if(text)text.textContent=translate(value.mode==='online'?'全组云端数据已同步':value.mode==='syncing'?'正在同步全组数据':value.mode==='cached'?'使用本机数据库':'云端暂不可用');
    const queued=value.queued?` · ${value.queued} 项待上传`:'';
    if(detail)detail.textContent=translate(value.detail||'')+translate(queued)+(value.lastSyncAt?' · '+new Date(value.lastSyncAt).toLocaleTimeString(root.WorkbenchI18n?.locale?.()||'zh-CN',{hour12:false}):'');
    if(button){button.disabled=value.mode==='syncing';}
  }

  root.addEventListener('workbench-cloud-toast',event=>{
    const toast=document.getElementById('toast');
    if(!toast)return;
    toast.textContent=event.detail&&event.detail.message||'云端操作已完成';
    toast.className='toast';
    toast.hidden=false;
    setTimeout(()=>{toast.hidden=true;},5000);
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindUi,{once:true});
  else bindUi();

  root.WorkbenchCloud={
    config:clone(CONFIG),
    init,beforeCommit,afterCommit,forceSync,getAlias,getClientId,setAlias,
    getStatus:()=>clone(status),
    getCloudState:()=>mergeState(currentState,lastCloud)
  };
})(globalThis);
