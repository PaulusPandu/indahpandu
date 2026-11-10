# Threadline Shop Manager

Frontend (`public/index.html`) + Node/Express backend (`server.js`) + SQLite database.

## Run locally
    npm install
    npm start        # http://localhost:3000

Optional: set `APP_PASSWORD` to require a login (any username, that password).
Env vars: `PORT`, `DB_PATH` (default `./data/shop.db`), `APP_PASSWORD`.

## Deploy
GitHub stores the code; GitHub Pages cannot run a backend, so host on Render/Railway/Fly:
1. Push this repo to GitHub.
2. Create a Web Service from the repo (Docker or Node, start command `npm start`).
3. Attach a persistent disk/volume mounted at `/data` and set `DB_PATH=/data/shop.db`
   (without a disk, the SQLite file is wiped on every redeploy).
4. Set `APP_PASSWORD`.
