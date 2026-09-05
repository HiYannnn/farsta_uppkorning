# Farsta Uppkörning

Independent Next.js version of DrivePath for recording, recreating and sharing
private-practice driving routes around Farsta.

## Local setup

1. Create a free Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and add your Supabase URL, anon key,
   and Trafikverket API key.
4. Run `npm install`.
5. Run `npm run dev`, then open http://localhost:3000.

## Deploy to Vercel

Push this repository to GitHub, import it into Vercel, and add the same three
environment variables in Vercel Project Settings. Vercel will build the project
with `npm run build`.

Public routes are readable and insertable through Supabase Row Level Security.
Updates and deletes are disabled from the public API. Use Supabase Table Editor
for moderation until owner authentication is added.
