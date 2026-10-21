# HANS FC 2.0

A football manager game for Android. Pick any real club in the Premier League, La Liga, Serie A, Bundesliga or Ligue 1 and manage it through seasons.

## What is in it
- Career mode: 40-week seasons, league, domestic cup and a 16-team Champions Cup (two legs, extra time, penalties)
- Real club and player names (ratings are my own estimates, around the 2025/26 season, no badges or photos). Use Rename in the game to fix anything
- Players rated up to 98, with potential, ageing, growth, retirement and academy youngsters
- Live matches: moving pitch, commentary, 5 substitutions, tactics, pressing, half-time team talk, injuries, red cards, penalties
- Transfers: search the whole world, bids, contracts, free agents, offers for your players, transfer windows
- Money: wages, gate income, sponsors, TV money, stadium and facility upgrades (stadium, training, academy, medical, fan zone)
- Board objectives, confidence, sacking, and job offers from other clubs
- Saves automatically on the phone

## Get the APK (from your phone, no computer)
Upload all files to your GitHub repo (keep the folders and `.github/workflows/build-apk.yml`). Open **Actions**, wait for the green tick (about 5 minutes), then download `HansFC.apk` from **Releases**.

## Layout
`app/src/main/assets/www/`: `data.js` (clubs, players), `engine.js` (players and live match), `world.js` (leagues, cups, money, transfers), `app.js` (screens).
