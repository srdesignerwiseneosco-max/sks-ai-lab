# sks Ai Lab — channel website

Website for the **sks Ai Lab** YouTube channel (AI filmmaking): https://www.youtube.com/@TheSKSAILab

Live at https://srdesignerwiseneosco-max.github.io/sks-ai-lab/ (GitHub Pages, served from the `gh-pages` branch).
Edit files on `main`; `.github/workflows/pages.yml` mirrors `main` to `gh-pages` so the site republishes automatically.

Static site — plain HTML/CSS/JS, no build step. Preview locally with `python3 -m http.server` (the page loads `videos.json`, which needs a server, not `file://`).

## Updating videos
All videos live in **`videos.json`**:
- `videos[]` — `{ id, title, category, duration, type: "video"|"short", popular }`. `id` is the YouTube video ID (thumbnail + player are built from it).
- `categories[]` — filter pills and the "Detailed content categories" cards (name, icon, description, what it covers). Keep `count` in sync.
- `featured` — the video ID shown in the Featured player.
- `channel` — subscriber / video counts (snapshot from YouTube, Oct 2026).
