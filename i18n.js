(function(root,factory){
  const api=factory(root.WORKBENCH_TRANSLATIONS||[]);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.WorkbenchI18n=api;
  if(typeof document!=='undefined')api.start();
})(typeof globalThis!=='undefined'?globalThis:this,function(catalog){
  'use strict';
  const KEY='com5507-interface-language',supported=['zh-Hans','zh-Hant','en'];
  let language='zh-Hans',observer=null,queued=false,titleSource='',titleRendered='';
  const sourceText=new WeakMap(),sourceAttributes=new WeakMap();
  const skipped='script,style,textarea,code,[contenteditable="true"],[data-preserve-content],.comment-body,.detail-body,.review-excerpt,.table-body';
  const exact=new Map(),patterns=[];
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const row of catalog){
    if(!row[0]||row.length<3)continue;
    if(/\{\w+\}/.test(row[0])){
      const names=[];let pattern='',last=0;
      for(const m of row[0].matchAll(/\{(\w+)\}/g)){const numeric=['n','row','page','total','known','unknown','posts','eligible','comments','pending','reports','passed','failed'].includes(m[1]);pattern+=escape(row[0].slice(last,m.index))+(numeric?'([0-9][0-9,.%\\s]*|—)':'(.+?)');names.push(m[1]);last=m.index+m[0].length;}
      pattern+=escape(row[0].slice(last));patterns.push({regex:new RegExp('^'+pattern+'$'),names,row,specificity:row[0].replace(/\{\w+\}/g,'').length});
    }else exact.set(row[0],row);
  }
  patterns.sort((a,b)=>b.specificity-a.specificity);
  const fragments=[...exact.keys()].filter(s=>/[\u3400-\u9fff]/.test(s)).sort((a,b)=>b.length-a.length);
  const fragmentPattern=fragments.length?new RegExp(fragments.map(escape).join('|'),'g'):null;
  function locale(){return language==='en'?'en-GB':language==='zh-Hant'?'zh-TW':'zh-CN';}
  function t(value){
    const text=String(value??'');if(language==='zh-Hans')return text;
    const index=language==='zh-Hant'?1:2,trimmed=text.trim();
    const leading=text.slice(0,text.length-text.trimStart().length),trailing=text.slice(text.trimEnd().length);
    const row=exact.get(trimmed);if(row)return leading+row[index]+trailing;
    for(const p of patterns){const match=trimmed.match(p.regex);if(!match)continue;const args={};p.names.forEach((n,i)=>args[n]=['field','role','error','warning'].includes(n)?t(match[i+1]):match[i+1]);return leading+p.row[index].replace(/\{(\w+)\}/g,(_,n)=>args[n]??'')+trailing;}
    return fragmentPattern?text.replace(fragmentPattern,key=>exact.get(key)[index]):text;
  }
  function preserve(node){return !node.parentElement||!!node.parentElement.closest(skipped)||node.parentElement.matches('input');}
  function textNode(node){
    if(preserve(node)||!node.data.trim())return;
    const prev=sourceText.get(node),source=prev&&node.data===prev.rendered?prev.source:node.data,rendered=t(source);
    sourceText.set(node,{source,rendered});if(node.data!==rendered)node.data=rendered;
  }
  function attribute(el,name){
    if(el.closest(skipped)||(name==='title'&&el.hasAttribute('data-evidence-title')))return;let cached=sourceAttributes.get(el);if(!cached){cached={};sourceAttributes.set(el,cached);}
    const value=el.getAttribute(name);if(value===null)return;
    const previous=cached[name],source=previous&&value===previous.rendered?previous.source:value,rendered=t(source);
    cached[name]={source,rendered};if(value!==rendered)el.setAttribute(name,rendered);
  }
  function apply(){
    if(typeof document==='undefined'||!document.body)return;
    observer?.disconnect();
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))textNode(node);
    for(const el of document.querySelectorAll('[aria-label],[title],[placeholder],[alt]'))for(const name of ['aria-label','title','placeholder','alt'])attribute(el,name);
    for(const el of document.querySelectorAll('[data-language-select]'))el.value=language;
    document.documentElement.lang=language;
    if(document.title!==titleRendered)titleSource=document.title;
    titleRendered=t(titleSource);document.title=titleRendered;
    observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});
  }
  function set(next){
    if(!supported.includes(next))return;language=next;
    try{localStorage.setItem(KEY,next);}catch(_){/* Language still works for the current session. */}
    if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('workbench-language-change',{detail:{language}}));
    apply();
  }
  function untranslated(){
    if(typeof document==='undefined')return [];
    const values=new Set(),walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))if(!preserve(node)&&/[\u3400-\u9fff]/.test(node.data))values.add(node.data.trim());
    return [...values];
  }
  function start(){
    try{const saved=localStorage.getItem(KEY);if(supported.includes(saved))language=saved;}catch(_){}
    document.addEventListener('change',ev=>{if(ev.target.matches('[data-language-select]'))set(ev.target.value);});
    const init=()=>{observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});});apply();};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  }
  return {t,set,apply,start,locale,getLanguage:()=>language,untranslated};
});
