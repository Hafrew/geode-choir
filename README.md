# Geode Choir

An idle / incremental game in two worlds. Shout into a buried crystal cave to wake the town of Hollowmere, descend through older and older caves, kindle the Heartstone, then skip stones across a sunless sea where crossing ripples ring the drowned bells.

It's a single static file (`index.html`) with no build step. Progress is saved in your browser's localStorage.

Current version: **1.8.0**. See [CHANGELOG.md](CHANGELOG.md) for what changed.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

## Deploy

Any static host works. On Vercel: **Add New → Project → import this repo**, framework preset **Other**, no build command, output directory `.`.
