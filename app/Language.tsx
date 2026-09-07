"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import swedish from "./sv.json";
export type Language="en"|"sv";
const LANGUAGE_KEY="drivepath-language-v1";
const messages:Record<string,string>=swedish;
type Translate=(text:string,values?:Record<string,string|number>)=>string;
const LanguageContext=createContext<{language:Language;setLanguage:(language:Language)=>void;t:Translate;locale:string}|null>(null);
export function translate(text:string,language:Language,values?:Record<string,string|number>){
 if(!values){
  const recording=text.match(/^Recording · GPS ±(\d+) m$/);
  const roads=text.match(/^Official NVDB speed limits · (\d+) road sections$/);
  if(recording)return translate("Recording · GPS ±{accuracy} m",language,{accuracy:recording[1]});
  if(roads)return translate("Official NVDB speed limits · {count} road sections",language,{count:roads[1]});
 }
 let result=language==="sv"?(messages[text]??text):text;
 if(values)result=result.replace(/\{(\w+)\}/g,(match,key)=>String(values[key]??match));
 return result;
}
export function LanguageProvider({children}:{children:ReactNode}){
 const [language,setLanguageState]=useState<Language>("en");
 useEffect(()=>{try{const saved=localStorage.getItem(LANGUAGE_KEY);if(saved==="sv"||saved==="en")setLanguageState(saved)}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=language},[language]);
 const setLanguage=useCallback((next:Language)=>{setLanguageState(next);try{localStorage.setItem(LANGUAGE_KEY,next)}catch{}},[]);
 const t=useCallback<Translate>((text,values)=>translate(text,language,values),[language]);
 return <LanguageContext.Provider value={{language,setLanguage,t,locale:language==="sv"?"sv-SE":"en-GB"}}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){const value=useContext(LanguageContext);if(!value)throw new Error("LanguageProvider is required");return value}
export function LanguageSwitch(){const {language,setLanguage}=useLanguage();return <div className="languageSwitch" role="group" aria-label="Language / Språk"><button type="button" lang="en" aria-pressed={language==="en"} onClick={()=>setLanguage("en")}>English</button><button type="button" lang="sv" aria-pressed={language==="sv"} onClick={()=>setLanguage("sv")}>Svenska</button></div>}
