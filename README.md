# Star Wars Explorer

A playground for the Star Wars universe: a timeline in release or story order, characters clustered by faction, planets, creators, and a Tech view with orbitable wireframe holograms of weapons, gadgets and ships.

Data is hand-compiled from [Wookieepedia](https://starwars.fandom.com) and every entry links back to its article. Filters for media type and canon status apply across every view.

Static site, no build step. Open `index.html` or serve the folder.

- `data.js` – the dataset (media, characters, planets, creators, tech)
- `models.js` – procedural Three.js holograms
- `app.js` – views, filters, panel, warp starfield
