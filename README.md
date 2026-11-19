# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/FarizalMYaqub/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/FarizalMYaqub/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Legend — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **All 55 official trophies**, each with its official name, description and grade as PlayStation publishes them (Exophase / PSNProfiles, 18 Nov 2026): 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden.
- **A guide for every trophy in our own words**, with step-by-step instructions and its sources cited beside it (GTABase, Press-Start, OutputLag, EGamers). Where a trigger is not yet confirmed at launch, the guide says so instead of guessing.
- **A roadmap to the platinum in 4 stages**, each with its own progress bar, and the one missable trophy (Positive Mental Attitude) flagged with exactly when it can be missed.
- **A tracker**: checklist saved in the browser (localStorage), export/import of progress as JSON, filters by kind / grade / status, sort by roadmap order / name / grade, search (press `/`), and a spoiler setting that hides story trophies until they are earned.
- **Next up**: the guide always shows the first unearned trophy in roadmap order, with a button that jumps to its guide.
- **Fully offline**: plain static files under `app/`, no network requests at run time, no account, no Rockstar logo or official artwork.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The guide is plain static files under `app/` and works with the network off. Use `PORT=9000 node serve.ts` for another port.

## Layout

- `app/index.html` — the guide page
- `app/app.js` — tracker: checklist, filters, sort, spoiler setting, export/import
- `app/style.css` — the look (own design, sunset over Leonida)
- `app/data/trophies.json` — the 55 trophies with official data, guides, steps and sources
- `main.ts` — entrypoint: checks the guide (55 trophies, every guide present, 3–4 screenshots under 256 KiB) and writes `/output/dossier.json`
- `screenshots/` — 4 real renders of the guide's own code
- `shots.json` — the shot list used to take them
- `vendor/makefun-frontend.ts` — the kit's library, unchanged

## Verify it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

## Sources

Official names, descriptions and grades: Exophase / PSNProfiles. Guide facts: GTABase GTA 6 Trophy Guide, Press-Start, OutputLag, EGamers — each cited beside the trophy it supports in the app. Unofficial fan guide, not affiliated with Rockstar Games or Sony Interactive Entertainment.

---

<sub>Entered on [make.fun](https://make.fun/?ref=qk9k9vgs&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
