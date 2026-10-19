# HANS FC

A football manager game for Android in the style of mobile card-collecting football games. Collect player cards from packs, set your formation and tactics, and play a league season with live match commentary. Everything is offline and saved on the phone. All players, clubs and badges are made up.

## Get the APK (from your phone, no computer)
1. On github.com create a new repository, e.g. `hans-fc`.
2. Upload all files from this project, keeping the folders. The `.github/workflows/build-apk.yml` file must keep that exact path (use "Add file > Create new file" and type `.github/workflows/build-apk.yml` as the name if the upload skips hidden folders, then paste the contents).
3. Open the **Actions** tab and allow workflows if asked. The build starts by itself (about 5 minutes). Green tick = done.
4. Open **Releases** on the repo page, download `HansFC.apk`, tap it and allow "install unknown apps" when Android asks.

If the build fails, open the red run, copy the error lines and send them to me.

## Layout
- `app/src/main/assets/www/` is the whole game (HTML, CSS, JS): `data.js` (clubs, formations, packs), `engine.js` (players, matches, seasons), `app.js` (screens).
- `app/src/main/java/com/hans/fc/MainActivity.java` is the small Android shell that shows the game in a WebView.
