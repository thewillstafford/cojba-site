# COJBA site with game logs

This version adds a **Game Logs** page.

## What changed
- You can enter each game one time on `game-logs.html`.
- Saved game logs recalculate:
  - player profile averages
  - player season totals
  - homepage leaders
  - stats page leaderboards
  - stats table numbers
- Videos and league text still come from `assets/data.js`.

## Important note
This version stores game logs in the **browser** using local storage.
That means the saved logs update the site on the browser/device where you entered them.

If you want a shared live league admin setup later, you will need a database/backend.

## Fastest way to use it
1. Open `game-logs.html`
2. Fill in a game
3. Save the log
4. Open `stats.html` or `players.html` and the numbers will already be updated
5. Export a backup JSON after big updates

## Which file still matters most?
- `assets/data.js` = roster, bios, videos, base stats
- `assets/app.js` = page logic and stat recalculation
- `assets/styles.css` = visual design


## Player photos
Put headshots in `images/players/` and name them with the player id format, like `will-stafford.jpeg`. The site will try to use those automatically across the roster, stats, and game logs.
