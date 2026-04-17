# HOW TO USE THESE FILES

## 1. Open the site
If you are just testing the site locally, open `index.html` or `game-logs.html` in your browser.

## 2. Enter games
Go to `game-logs.html`.
That page is now the easiest way to run the season.

For each game:
- enter the date and title
- optionally enter teams, score, format, and notes
- check `Played` for each player who appeared
- enter their stats
- enter `FGM`, `FGA`, `3PM`, and `3PA` if you want shooting percentages to calculate correctly
- click `Save game log`

## 3. What updates automatically
After you save a game log, the site recalculates:
- homepage leaders
- player cards
- player profile averages
- player profile totals
- stats page leaderboards
- stats table averages

## 4. Where the data is saved
Saved game logs are stored in the browser with local storage.
That means the logs are tied to the browser/device you used.

## 5. Backup your logs
Use the Game Logs page buttons to:
- export logs as JSON
- import logs from JSON
- reset saved logs

Exporting is the safest way to protect your season data.

## 6. When to still edit `assets/data.js`
Use `assets/data.js` for:
- league name and about text
- player bios
- positions
- teams
- images
- videos
- base stats if you are not using the Game Logs page yet

## 7. Best setup for a new season
If you want the season to be fully game-log-driven:
- leave or reset base stats in `assets/data.js` to zero
- enter every game through `game-logs.html`

## 8. If the logs do not seem to save
Some browsers can be weird about saving data when you open HTML files directly from the file system.
If that happens, run the folder through a simple local server and try again.
