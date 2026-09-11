"use client";
import {useLanguage} from "./Language";
import {useEffect,useRef,useState} from "react";
import directory from "./test-offices.json";

type Stat={name:string;lat:number;lng:number;tests:number;passed:number;failed:number;rate:number};
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export default function StatisticsMap({stats}:{stats:Stat[]}){
 const {t,locale}=useLanguage();
 const [view,setView]=useState<"offices"|"statistics">("statistics"),[query,setQuery]=useState("");
 const mapNode=useRef<HTMLDivElement>(null);
 const offices=directory.locations.filter(o=>`${o.name} ${o.address}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
 useEffect(()=>{
  let map:any=null,cancelled=false;
  const boot=()=>{
   if(cancelled||!mapNode.current||!window.L)return false;
   const L=window.L;
   map=L.map(mapNode.current,{scrollWheelZoom:false}).setView([62,16],5);
   L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:"© OpenStreetMap"}).addTo(map);
   if(view==="offices"){
    offices.forEach(o=>{
     // A name match is contextual only: the published row may cover a wider area.
     const reported=stats.find(s=>s.name===o.name.replace(/^Stockholm /,""));
     const result=reported?`<p>${escapeHtml(t("Reported area:"))} <b>${escapeHtml(reported.name)}</b><br>${reported.rate.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2})}% ${escapeHtml(t("passed"))} · 2025<br>${escapeHtml(t("Automatic + manual combined. This is an area result, not a verified rate for this individual office."))}</p>`:"";
     L.circleMarker([o.lat,o.lng],{radius:7,color:"#64758a",weight:2,fillColor:"#fff",fillOpacity:1}).bindPopup(`<b>${escapeHtml(o.name)}</b><br>${escapeHtml(t("Körprov B · official directory"))}<br>${escapeHtml(o.address)}<p><strong>${escapeHtml(t("Statistics unavailable"))}</strong><br>${escapeHtml(t("No verified individual-office pass rate in this dataset."))}</p>${result}<a href="${escapeHtml(o.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("Official office details ↗"))}</a>`).addTo(map);
    });
    if(query.trim()&&offices.length)map.fitBounds(offices.map(o=>[o.lat,o.lng]),{padding:[35,35],maxZoom:13});
   }else{
    stats.forEach(s=>{
     const color=s.rate>=50?"#14a36f":s.rate>=40?"#f4a62a":"#ef3f53";
     L.circleMarker([s.lat,s.lng],{radius:Math.max(7,Math.min(15,5+Math.sqrt(s.tests)/18)),color,weight:2,fillColor:color,fillOpacity:.76}).bindPopup(`<b>${escapeHtml(s.name)}</b><br>${escapeHtml(t("Reported statistics area · approximate position"))}<br>${escapeHtml(t("2025 · automatic + manual combined"))}<br><strong>${s.rate.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2})}% ${escapeHtml(t("passed"))}</strong><br>${s.tests.toLocaleString(locale)} ${escapeHtml(t("tests"))} · ${s.passed.toLocaleString(locale)} ${escapeHtml(t("passed"))} · ${s.failed.toLocaleString(locale)} ${escapeHtml(t("failed"))}`).addTo(map);
    });
   }
   return true;
  };
  const timer=setInterval(()=>{if(boot())clearInterval(timer)},100);
  return()=>{cancelled=true;clearInterval(timer);map?.remove()};
 },[view,query,stats,t,locale]);
 return <>
  <div className="locationViews" role="group" aria-label={t("Map content")}>
   <button aria-pressed={view==="offices"} onClick={()=>setView("offices")}>{t("Verified B offices (")}{directory.locations.length})</button>
   <button aria-pressed={view==="statistics"} onClick={()=>setView("statistics")}>{t("Reported statistics areas (")}{stats.length})</button>
  </div>
  <p className="statsIntro">{view==="offices"?t("Official office locations offering car driving tests (B). Select a marker for its address, source and available area statistics."):t("Locations with reported statistics: 2025 area results, automatic and manual combined. Markers are approximate area positions, not office entrances.")}</p>
  {view==="offices"&&<label className="officeSearch">{t("Find an office")}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Town or street address")}/></label>}
  <div className="swedenMap" ref={mapNode} aria-label={view==="offices"?t("Verified B test offices map"):t("Reported statistics areas map")}/>
  <div className="mapLegend">{view==="offices"?<span><i className="unavailable"/>{t("Verified B office · individual-office statistics unavailable")}</span>:<><span><i className="low"/>{t("Under 40%")}</span><span><i className="mid"/>{t("40–49.99%")}</span><span><i className="high"/>{t("50% or higher")}</span></>}</div>
  <p className="statsSource">{t("Office source:")} <a href={directory.source} target="_blank" rel="noopener noreferrer">{t("Trafikverket’s public directory")}</a>{t(", checked")} {directory.checked}{t(". Includes all")} {directory.locations.length} {t("entries marked B in that directory. The directory focuses on offices with photography and may omit smaller test sites. For the current choice of test sites, check")} <a href="https://fp.trafikverket.se/Boka/" target="_blank" rel="noopener noreferrer">{t("Trafikverket booking")}</a>.</p>
  {view==="offices"&&<details className="officeDirectory"><summary>{t("Office list (")}{offices.length})</summary>{offices.length?offices.map(o=><article key={o.id}><a href={o.url} target="_blank" rel="noopener noreferrer">{o.name} ↗</a><p>{o.address}</p><small>{t("Individual-office statistics unavailable")}</small></article>):<p>{t("No matching offices. Try another town or street.")}</p>}</details>}
 </>;
}
