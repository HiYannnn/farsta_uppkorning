type Point={lat:number;lng:number;time?:string};
const distance=(a:Point,b:Point)=>{const r=Math.PI/180,q=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lng-a.lng)*r/2)**2;return 12742*Math.asin(Math.sqrt(q))};

function config(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error("Supabase is not configured");
 return {url,key,headers:{apikey:key,Authorization:`Bearer ${key}`}};
}

export async function GET(){
 try{
  const {url,headers}=config();
  const response=await fetch(`${url}/rest/v1/routes?select=id,name,skills,distance_km,duration_minutes,points,created_at&order=created_at.desc&limit=50`,{headers,cache:"no-store"});
  if(!response.ok)throw new Error();
  const rows=await response.json() as Array<Record<string,unknown>>;
  return Response.json({routes:rows.map(row=>({id:row.id,name:row.name,skills:row.skills,distanceKm:row.distance_km,durationMinutes:row.duration_minutes,points:row.points,createdAt:row.created_at}))});
 }catch{return Response.json({error:"Route library unavailable"},{status:500})}
}

export async function POST(request:Request){
 try{
  const payload=await request.json() as {name?:string;skills?:string;durationMinutes?:number;points?:Point[]};
  const name=payload.name?.trim()||"",skills=payload.skills?.trim()||"",points=payload.points;
  if(!name||name.length>60||skills.length>250||!Array.isArray(points)||points.length<2||points.length>5000)return Response.json({error:"Invalid route information"},{status:400});
  if(points.some(point=>!Number.isFinite(point.lat)||!Number.isFinite(point.lng)||point.lat<55||point.lat>70||point.lng<10||point.lng>25))return Response.json({error:"Route must be in Sweden"},{status:400});
  const distanceKm=points.slice(1).reduce((sum,point,index)=>sum+distance(points[index],point),0);
  if(distanceKm<.05||distanceKm>150)return Response.json({error:"Route distance is outside the allowed range"},{status:400});
  const reduced=points.length>1200?Array.from({length:1200},(_,index)=>points[Math.round(index*(points.length-1)/1199)]):points;
  const {url,headers}=config();
  const response=await fetch(`${url}/rest/v1/routes`,{method:"POST",headers:{...headers,"content-type":"application/json",Prefer:"return=representation"},body:JSON.stringify({name,skills,distance_km:distanceKm,duration_minutes:Math.max(0,Math.min(300,Math.round(payload.durationMinutes||0))),points:reduced})});
  if(!response.ok)throw new Error();
  const [route]=await response.json() as Array<{id:number}>;
  return Response.json({route},{status:201});
 }catch{return Response.json({error:"Could not publish this route"},{status:500})}
}
