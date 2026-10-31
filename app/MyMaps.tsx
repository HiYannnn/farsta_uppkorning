"use client";
import {useState} from "react";
import {ExternalLink} from "lucide-react";
import {useLanguage} from "./Language";

const mapIds = [
 "1XEKkNW__X7vto_SbFo7EYorPFgUyjQE",
 "1FqrB7jJ4zBU5cWRCoJuny-7N9Cmn3o0",
 "1_zB9MnDaO6b59XMyEB2SPrObVJg4KUk",
 "1lP_YpdzujjotWmhrpSWKmtw4mSUU3HY",
 "13m5hfTuSxrdPouQdAE13D4PRcfMD35M",
 "1L9YAC3bLDW1PN8VVpVOIYDhlyYYcBIs",
];

export default function MyMaps(){
 const {t}=useLanguage();
 const [active,setActive]=useState(0);
 const label=t("Map {number}",{number:active+1});
 return <section className="myMaps" aria-labelledby="my-maps-title">
  <p className="eyebrow">{t("MY DRIVING TEST EXPERIENCES")}</p>
  <h2 id="my-maps-title">{t("Maps from my driving tests")}</h2>
  <p className="myMapsIntro">{t("I made these six maps from driving tests I didn’t pass. I’m sharing them to help others practise in Farsta. These are my past experiences—your test route may be different.")}</p>
  <div className="myMapsSelector" role="group" aria-label={t("Choose a practice map")}>
   {mapIds.map((id,index)=><button key={id} type="button" aria-pressed={active===index} aria-controls="practice-map-viewer" onClick={()=>setActive(index)}>{t("Map {number}",{number:index+1})}</button>)}
  </div>
  <iframe id="practice-map-viewer" key={mapIds[active]} title={label+" — Google My Maps"} src={`https://www.google.com/maps/d/embed?mid=${mapIds[active]}&ehbc=2E312F`} loading="lazy" allowFullScreen />
  <a className="openGoogleMap" href={`https://www.google.com/maps/d/viewer?mid=${mapIds[active]}`} target="_blank" rel="noopener noreferrer" aria-label={t("Open {map} in Google My Maps",{map:label})}><ExternalLink aria-hidden="true"/>{t("Open in Google Maps")} · {label}</a>
  <p className="myMapsNote">{t("If the map does not appear, open it in Google My Maps using the link above.")}</p>
 </section>;
}
