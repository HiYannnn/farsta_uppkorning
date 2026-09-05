type Coordinate=[number,number];

const xmlEscape=(value:string)=>value.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");

// Convert WGS84 latitude/longitude to SWEREF 99 TM (EPSG:3006).
// Trafikverket's Hastighetsgräns dataset only accepts its projected geometry
// for spatial filtering, while the response can still be requested in WGS84.
function toSweref99Tm(lng:number,lat:number):Coordinate{
 const axis=6378137,flattening=1/298.257222101,centralMeridian=15,scale=0.9996,falseNorthing=0,falseEasting=500000;
 const degToRad=Math.PI/180;
 const phi=lat*degToRad,lambda=lng*degToRad,lambdaZero=centralMeridian*degToRad;
 const e2=flattening*(2-flattening),n=flattening/(2-flattening);
 const aRoof=axis/(1+n)*(1+n*n/4+n**4/64);
 const A=e2,e4=A*A,e6=e4*A,e8=e4*e4;
 const beta1=n/2-2*n*n/3+5*n**3/16+41*n**4/180;
 const beta2=13*n*n/48-3*n**3/5+557*n**4/1440;
 const beta3=61*n**3/240-103*n**4/140;
 const beta4=49561*n**4/161280;
 const delta1=A/2+5*e4/24+e6/12+13*e8/360;
 const delta2=7*e4/48+29*e6/240+811*e8/11520;
 const delta3=7*e6/120+81*e8/1120;
 const delta4=4279*e8/161280;
 const sinPhi=Math.sin(phi);
 const phiStar=phi-sinPhi*Math.cos(phi)*(delta1+delta2*sinPhi**2+delta3*sinPhi**4+delta4*sinPhi**6);
 const xiPrim=Math.atan(Math.tan(phiStar)/Math.cos(lambda-lambdaZero));
 const etaPrim=Math.atanh(Math.cos(phiStar)*Math.sin(lambda-lambdaZero));
 const northing=scale*aRoof*(xiPrim+beta1*Math.sin(2*xiPrim)*Math.cosh(2*etaPrim)+beta2*Math.sin(4*xiPrim)*Math.cosh(4*etaPrim)+beta3*Math.sin(6*xiPrim)*Math.cosh(6*etaPrim)+beta4*Math.sin(8*xiPrim)*Math.cosh(8*etaPrim))+falseNorthing;
 const easting=scale*aRoof*(etaPrim+beta1*Math.cos(2*xiPrim)*Math.sinh(2*etaPrim)+beta2*Math.cos(4*xiPrim)*Math.sinh(4*etaPrim)+beta3*Math.cos(6*xiPrim)*Math.sinh(6*etaPrim)+beta4*Math.cos(8*xiPrim)*Math.sinh(8*etaPrim))+falseEasting;
 return [easting,northing];
}

function parseWkt(value:unknown):Coordinate[][]{
 if(typeof value!=="string")return [];
 const clean=value.replace(/^SRID=\d+;/i,"").trim();
 const parseLine=(line:string):Coordinate[]=>line.split(",").map(pair=>pair.trim().split(/\s+/).slice(0,2).map(Number) as Coordinate).filter(([lng,lat])=>Number.isFinite(lng)&&Number.isFinite(lat));
 if(/^LINESTRING(?:\s+Z)?\s*\(/i.test(clean)){
  const body=clean.replace(/^LINESTRING(?:\s+Z)?\s*\(/i,"").replace(/\)\s*$/,"");
  const line=parseLine(body);return line.length>1?[line]:[];
 }
 if(/^MULTILINESTRING(?:\s+Z)?\s*\(/i.test(clean)){
  const body=clean.replace(/^MULTILINESTRING(?:\s+Z)?\s*\(/i,"").replace(/\)\s*$/,"");
  return body
   .split(/\)\s*,\s*\(/)
   .map(part=>parseLine(part.replace(/^\(/,"").replace(/\)$/,"")))
   .filter(line=>line.length>1);
 }
 return [];
}

function speedLimitRows(value:unknown):Record<string,unknown>[]{
 const root=value as {RESPONSE?:{RESULT?:Array<Record<string,unknown>>}};
 const result=root?.RESPONSE?.RESULT;
 if(!Array.isArray(result))return [];
 for(const item of result){
  const rows=item?.["Hastighetsgräns"];
  if(Array.isArray(rows))return rows.filter(row=>row&&typeof row==="object") as Record<string,unknown>[];
 }
 return [];
}

export async function GET(request:Request){
 try{
  const key=process.env.TRAFIKVERKET_API_KEY;
  if(!key)return Response.json({error:"NVDB is not configured"},{status:503});
  const url=new URL(request.url),raw=(url.searchParams.get("bbox")||"").split(",").map(Number);
  if(raw.length!==4||raw.some(x=>!Number.isFinite(x)))return Response.json({error:"A valid map area is required"},{status:400});
  const [west,south,east,north]=raw;
  if(west<10||east>25||south<55||north>70||west>=east||south>=north||(east-west)*(north-south)>.08)return Response.json({error:"Zoom in to load road rules"},{status:400});
  const [minEasting,minNorthing]=toSweref99Tm(west,south),[maxEasting,maxNorthing]=toSweref99Tm(east,north);
  const query=`<REQUEST><LOGIN authenticationkey="${xmlEscape(key)}"/><QUERY objecttype="Hastighetsgräns" namespace="Vägdata.NVDB_DK_O" schemaversion="1.4" limit="10000"><FILTER><WITHIN name="Geometry.WKT-SWEREF99TM-3D" shape="box" value="${minEasting} ${minNorthing}, ${maxEasting} ${maxNorthing}"/></FILTER><INCLUDE>Högsta_tillåtna_hastighet</INCLUDE><INCLUDE>Geometry</INCLUDE></QUERY></REQUEST>`;
  const upstream=await fetch("https://api.trafikinfo.trafikverket.se/v2/data.json",{method:"POST",headers:{"content-type":"text/xml"},body:query});
  const data=await upstream.json() as unknown;
  if(!upstream.ok){console.error("Trafikverket API rejected NVDB request",upstream.status,JSON.stringify(data).slice(0,1200));return Response.json({error:"Trafikverket did not accept the request"},{status:502})}
  const rows=speedLimitRows(data);
  const segments=rows.flatMap(row=>{const geometry=row.Geometry as Record<string,unknown>|undefined,speed=String(row["Högsta_tillåtna_hastighet"]??"").match(/\d+/)?.[0];return parseWkt(geometry?.["WKT-WGS84-3D"]).map(coordinates=>({speed:speed?Number(speed):null,coordinates}))}).filter(x=>x.speed&&x.coordinates.length>1);
  return Response.json({segments},{headers:{"cache-control":"public, max-age=300"}});
 }catch{return Response.json({error:"Road rules are temporarily unavailable"},{status:502})}
}
