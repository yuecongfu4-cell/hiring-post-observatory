(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.WorkbenchCore);if(typeof module==='object'&&module.exports)module.exports=api;root.WorkbenchStore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const fingerprint=b=>b.meta?.hashes?.records||b.version;
  const empty=b=>({schema:1,baselineVersion:b.version,baselineHash:fingerprint(b),additions:{posts:[],comments:[],updates:[]},drafts:[],snapshots:[]});
  const uid=prefix=>prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
  function pending(s){return ['posts','comments','updates'].reduce((n,k)=>n+s.additions[k].filter(x=>x.reviewStatus==='pending').length,0);}
  function dataset(b,s,selection){if(selection==='baseline')return b;if(selection&&selection!=='working'){const snap=s.snapshots.find(x=>x.id===selection);if(snap)return C.buildDataset(b,snap.additions);}return C.buildDataset(b,s.additions);}
  function auditDataset(b,s){const d=C.buildDataset(b,s.additions);const ids=new Set(d.posts.map(p=>p.id));for(const p of s.additions.posts)if(p.reviewStatus==='pending'&&!ids.has(p.id)){d.posts.push(p);ids.add(p.id);}for(const c of s.additions.comments)if(c.reviewStatus==='pending')d.comments.push(c);return d;}
  function stage(s,type,audit){const next=clone(s);const field=type==='comments'?'comments':'posts';let n=0;for(const r of audit.records||[]){const rec=clone(r);rec.reviewStatus='pending';rec.reviewId=uid('review');next.additions[field].push(rec);n++;}for(const u of audit.updates||[]){const rec=clone(u);rec.reviewStatus='pending';rec.reviewId=uid('review');rec.record.reviewStatus='pending';next.additions.updates.push(rec);n++;}return {state:next,staged:n};}
  function review(b,s,type,reviewId,decision){
    if(!['posts','comments','updates'].includes(type))throw Error('未知的审核类型');
    const next=clone(s),item=next.additions[type].find(x=>x.reviewId===reviewId);
    if(!item||item.reviewStatus!=='pending')throw Error('这项记录已经处理，请刷新列表');
    if(decision==='reject'){item.reviewStatus='rejected';return next;}
    const d=C.buildDataset(b,next.additions),raw=type==='updates'?item.record:item;
    const v=type==='comments'?C.normalizeComment(raw,{posts:d.posts}):C.normalizePost(raw);
    if(v.errors.length)throw Error(v.errors.join('；'));
    if(type==='posts'){
      const check=C.deduplicatePosts([v.record],d.posts);
      if(!check.unique.length)throw Error('该帖子已存在或正文重复；请退回此项，同帖变化应按快照更新导入');
      Object.assign(item,v.record,{reviewStatus:'approved'});
    }else if(type==='comments'){
      if(d.comments.some(c=>c.id===v.record.id||(v.record.sourceId&&c.sourceId===v.record.sourceId)))throw Error('这条评论的编号或来源 ID 已存在');
      Object.assign(item,v.record,{reviewStatus:'approved'});
    }else{
      const target=d.posts.find(p=>p.id===item.postId);if(!target)throw Error('目标帖子尚未通过审核');
      const check=C.deduplicatePosts([v.record],d.posts);
      if(check.errors.length)throw Error(check.errors[0].errors.join('；'));
      if(!check.updates.length)throw Error('没有可应用的快照变化，请退回此项');
      item.record={...v.record,id:target.id,reviewStatus:'approved'};item.reviewStatus='approved';
    }
    return next;
  }
  function freeze(b,s,label){if(!String(label||'').trim())throw Error('请填写报告版本名称');const next=clone(s);const additions={};for(const k of ['posts','comments','updates'])additions[k]=clone(s.additions[k].filter(x=>x.reviewStatus==='approved'));const snapshot={id:uid('report'),label:String(label).trim().slice(0,80),createdAt:new Date().toISOString(),baselineVersion:b.version,additions};next.snapshots.push(snapshot);return {state:next,snapshot};}
  function backup(b,s){return {format:'com5507-workbench-backup',schema:1,exportedAt:new Date().toISOString(),baselineVersion:b.version,baselineHash:fingerprint(b),state:clone(s)};}
  function validateState(b,input){
    if(!input||input.schema!==1||input.baselineVersion!==b.version||input.baselineHash!==fingerprint(b))throw Error('备份与当前冻结基线版本不匹配，未覆盖任何数据');
    const out=empty(b);const states=['pending','approved','rejected'];
    function validateAdditions(raw){
      if(!raw||!['posts','comments','updates'].every(k=>Array.isArray(raw[k])))throw Error('备份缺少帖子、评论或快照更新数组');
      if(['posts','comments','updates'].some(k=>raw[k].length>100000))throw Error('备份单类记录超过 100,000 条');
      const dest={posts:[],comments:[],updates:[]},reviews=new Set(),ids=new Set(b.posts.map(p=>p.id));
      const metaKeys=['submitterAlias','submittedAt','clientId','decisionHistory','reviewDecisionAt','reviewDecisionBy','cloudSynced','duplicateOf','conflict'];
      function statusAndId(x){if(!x||typeof x!=='object'||!states.includes(x.reviewStatus)||typeof x.reviewId!=='string'||!x.reviewId||reviews.has(x.reviewId))throw Error('备份审核状态或审核编号无效');reviews.add(x.reviewId);}
      function carryMeta(x){const meta={};metaKeys.forEach(k=>{if(x&&Object.prototype.hasOwnProperty.call(x,k))meta[k]=clone(x[k]);});return meta;}
      for(const p of raw.posts){statusAndId(p);const v=C.normalizePost(p);if(v.errors.length)throw Error('备份帖子无效：'+v.errors.join('；'));ids.add(v.record.id);dest.posts.push({...v.record,...carryMeta(p),reviewId:p.reviewId,reviewStatus:p.reviewStatus});}
      const allPosts=b.posts.concat(dest.posts);
      for(const c of raw.comments){statusAndId(c);const v=C.normalizeComment(c,{posts:allPosts});if(v.errors.length)throw Error('备份评论无效：'+v.errors.join('；'));dest.comments.push({...v.record,...carryMeta(c),reviewId:c.reviewId,reviewStatus:c.reviewStatus});}
      for(const u of raw.updates){statusAndId(u);if(typeof u.postId!=='string'||!ids.has(u.postId))throw Error('备份快照的目标帖子不存在');const v=C.normalizePost(u.record);if(v.errors.length)throw Error('备份快照无效：'+v.errors.join('；'));const target=allPosts.find(p=>p.id===u.postId);if(C.normalizeUrl(target.url)&&C.normalizeUrl(target.url)!==v.record.url)throw Error('备份快照链接与目标帖子不同');dest.updates.push({postId:u.postId,record:{...v.record,id:u.postId,reviewStatus:u.reviewStatus},reviewId:u.reviewId,reviewStatus:u.reviewStatus,previous:u.previous||null,changes:u.changes||{},warnings:Array.isArray(u.warnings)?clone(u.warnings):[],...carryMeta(u)});}
      return dest;
    }
    out.additions=validateAdditions(input.additions);
    if(!Array.isArray(input.drafts)||input.drafts.length>5000||!Array.isArray(input.snapshots)||input.snapshots.length>100)throw Error('备份草稿或版本列表格式无效');
    const draftIds=new Set();for(const x of input.drafts){if(!x||typeof x.id!=='string'||draftIds.has(x.id)||typeof x.text!=='string'||x.text.length>200000||typeof x.createdAt!=='string'||!Number.isFinite(Date.parse(x.createdAt)))throw Error('备份草稿格式无效');draftIds.add(x.id);out.drafts.push({id:x.id,text:C.redactText(x.text),createdAt:x.createdAt});}
    const snapIds=new Set();for(const x of input.snapshots){if(!x||typeof x.id!=='string'||snapIds.has(x.id)||['baseline','working'].includes(x.id)||x.baselineVersion!==b.version||typeof x.label!=='string'||!x.label.trim()||typeof x.createdAt!=='string'||!Number.isFinite(Date.parse(x.createdAt)))throw Error('备份报告版本无效');snapIds.add(x.id);const additions=validateAdditions(x.additions);if(['posts','comments','updates'].some(k=>additions[k].some(r=>r.reviewStatus!=='approved')))throw Error('冻结版本不能含未审核内容');out.snapshots.push({id:x.id,label:x.label.slice(0,80),createdAt:x.createdAt,baselineVersion:b.version,additions});}
    return out;
  }
  function restore(b,payload){if(!payload||payload.format!=='com5507-workbench-backup'||payload.schema!==1||payload.baselineVersion!==b.version||payload.baselineHash!==fingerprint(b))throw Error('这不是当前基线的有效工作台备份');return validateState(b,payload.state);}
  return {empty,uid,pending,dataset,auditDataset,stage,review,freeze,backup,restore,validateState};
});
