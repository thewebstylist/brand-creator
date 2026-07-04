# EMBER & OAK

A cinematic single-page site for a fictional wood-fire steakhouse in Asheville.
Near-black, warm cream, ember orange; Cormorant Garamond + Jost, self-hosted.

## Run it

Any static server from this directory works:

```sh
cd ember-oak
python3 -m http.server 4173
# open http://localhost:4173
```

## How it's put together

- **Hero** — `fire.mp4` (Seedance 2.0, keyframe-dense re-encode) is fetched as a
  blob so it's fully buffered, then scroll position drives `currentTime` through
  an eased rAF loop while the serif title tracks in.
- **Story / private dining** — ambient loops (`room.mp4`, `craft.mp4`) lazy-load
  near the viewport with slow parallax; film-grain overlay sits above everything.
- **Codecs** — H.264 mp4 preferred; VP9 webm fallback is selected at runtime for
  open-codec browsers (`canPlayType` probe in `main.js`).
- **Menu** — two columns (Fire / Field) collapsing to one under 760px.
- **Reservation form** — client-side only; shows a confirmation panel on submit.
- Assets were generated with Seedance 2.0 via the Higgsfield MCP and committed by
  `.github/workflows/fetch-assets.yml` (the dev sandbox can't reach the CDN).
