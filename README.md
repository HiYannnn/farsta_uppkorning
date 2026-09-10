# Farsta Uppkörning 🍀

A little helper for anyone practising driving in Farsta.

The idea is simple: keep track of the roads you’ve practised, revisit the parts you find tricky, and share useful routes with other learners. Hopefully it makes preparing for your driving test a little easier.

**Lycka till med uppkörningen!**

## What you can do

- Record a route with GPS, import a GPX file, or draw a route from memory or screenshots.
- Save routes in your browser and export them as GPX files.
- Share practice routes with other learners.
- Look up driving-test offices and the available pass-rate statistics.
- Open Trafikverket’s NVDB map to check speed limits and other road information.
- Switch between English and Swedish.

These are practice routes, not official test routes. The app isn’t affiliated with Trafikverket, and a route here won’t tell you where your examiner will take you.

The statistics cover reported areas, not necessarily individual offices. The office directory may also miss smaller test sites. Sources and dates are shown in the app.

## Run it locally

You’ll need Node.js and npm.

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

You can use local route storage without setting up a database. Saved routes stay in the browser you used; clearing its data can remove them, so export anything you want to keep.

### Optional services

For the shared route library:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in its SQL editor.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY`.

For the speed-limit overlay, also add `TRAFIKVERKET_API_KEY`. The NVDB website link works without a key.

Keep `.env.local` out of Git. Publishing a route shares its start and end too, so avoid sharing a route that starts at your home. Public routes currently have no owner accounts; moderation is done through Supabase.

## A small project

Built with Next.js, React and Leaflet, using OpenStreetMap tiles and OSRM for routing along roads.

Found something wrong or have an idea? Open an issue. Suggestions from people practising around Farsta are welcome.
