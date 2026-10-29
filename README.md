# RAX Study Germany

Free, open-source preparation for the move to Germany:

- **German A1 and A2** (Goethe-Zertifikat): exam patterns and marks, Lesen, Hören, Schreiben and Sprechen practice, grammar, 1,506 words with English meanings, 125 verbs, pronunciation, flashcards with spaced repetition, and A1/A2 mock-test generators.
- **IELTS Academic**: original Listening, Reading, Writing and Speaking practice, a band calculator and a full mock-test generator.
- **Germany visa guide**: plain-language guides to every main route (study, language course, Ausbildung, work, Opportunity Card, Schengen, family reunification and more), a seven-question route finder, document checklists, a fees and financing page with a cost calculator, a page for applicants in Pakistan, a source verification database and an application planner.
- **Bachelor's in Germany**: what 12, 13 or more years of education from Pakistan mean for admission (Studienkolleg or direct, subject-related admission after one year of university study), a path checker, and how to apply through uni-assist.
- **Document attestation (Pakistan)**: board verification, IBCC, HEC e-Attestation, MOFA general attestation and apostille, step by step, with a document route selector, a personal checklist, verified fees, offices and what Germany actually asks for.

Live site: https://raxstudygermany.netlify.app

> RAX Study Germany is an independent educational and information platform. It is not affiliated with IBCC, HEC, Pakistan's Ministry of Foreign Affairs, the German government, German Missions, Goethe-Institut, or IELTS. Document-attestation requirements depend on document type, destination, and the receiving authority. Always confirm current requirements through the official authority before submitting or paying for an application. RAX Study Germany does not guarantee visa eligibility, appointment availability, processing time, or approval.

## How it is built

Plain HTML, CSS and JavaScript. No framework, no build step, no server code, no tracking. Every page works when you open `index.html` straight from a folder.

```
index.html               Home
german/                  German A1/A2 pages
bachelor/                Bachelor's in Germany guide (12 and 13 years of education, Studienkolleg, applying)
ielts/                   IELTS Academic pages
visa/                    Germany visa guide and tools
visa/work/               Work routes
attestation/             Pakistan document attestation guide and tools
about.html, disclaimer.html, progress.html, 404.html
assets/css/main.css      All styles (light and dark mode)
assets/js/core.js        Shared helpers: storage, progress, speech, timers, recorder
assets/js/*.js           One script per tool (practice engine, flashcards, mock tests, visa tools …)
assets/js/data/*.js      Content and data files (vocabulary, practice sets, visa figures, attestation data)
assets/img/              Favicon, app icons, social preview image
sitemap.xml, robots.txt, manifest.webmanifest, netlify.toml
```

Learner progress (practice scores, flashcards, checklists, plans) is saved in the browser with `localStorage` and can be exported and imported as JSON on the **My progress** page.

## Run it locally

Open `index.html` in a browser. That is all.

If you prefer a local web server (closer to how it runs online):

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Deploy to Netlify

**Drag and drop:** log in to Netlify, open *Sites*, and drag this whole folder onto the upload area.

**From GitHub (recommended, redeploys on every push):**

1. Create a new repository on GitHub and push this folder:
   ```
   git init
   git add .
   git commit -m "RAX Study Germany"
   git branch -M main
   git remote add origin https://github.com/<your-user>/rax-german.git
   git push -u origin main
   ```
2. In Netlify choose *Add new site → Import an existing project → GitHub* and pick the repository.
3. Leave the build command empty. The publish directory is the repository root (already set in `netlify.toml`).

`netlify.toml` adds security headers and a Content Security Policy. Netlify serves `404.html` automatically.

## Deploy to GitHub Pages

Enable Pages for the `main` branch, root folder. All links are relative, so the site works at `https://<user>.github.io/rax-german/`. Only `404.html` uses root links (`/…`), which work on a custom domain or a `<user>.github.io` repository.

## Use your own domain

The canonical URLs, Open Graph tags and sitemap use `https://raxstudygermany.netlify.app`. After you choose your address, replace it everywhere:

```
grep -rl "https://raxstudygermany.netlify.app" . | xargs sed -i "s#https://raxstudygermany.netlify.app#https://your-domain.example#g"
```

(On macOS use `sed -i ''`.)

## Updating visa figures

All changeable visa figures and sources live in **`assets/js/data/visa-data.js`** (`window.RAX_VISA`):

- `figures` — each fee or amount has `display`, `amount`, `currency`, `applies`, `route`, `jurisdiction`, `source`, `checked` (YYYY-MM-DD) and `status` (`Verified`, `Needs review`, `Outdated`).
- `sources` — each official page has `title`, `url`, `summary`, `status` (`Verified`, `Needs review`, `Outdated`, `Archived`), `checked` and `jur`.
- `routes` — the checklists and finder data for each route.
- `lastReview` — the date shown as “Last checked” on visa pages.

When a figure changes, edit `display` and `amount`, set `checked` to today and `status` to `Verified`. Pages update the figure, its status badge, the fees table, the source database and the cost calculator from this file. If you cannot confirm a figure on an official page, set `display` to `Verify current requirement` and `status` to `Needs review` — never guess. The text around a figure is plain HTML; review the guide pages too when a rule (not just an amount) changes.

The site does **not** update itself. Amounts often change on 1 January; plan a review then.

## Updating attestation information

IBCC, HEC and MOFA fees, processing times and sources live in **`assets/js/data/attest-data.js`** (`window.RAX_ATTEST`). Each fee has `display`, `amount`, `applies`, `source`, `verificationStatus` and `lastVerifiedAt`. The fee table, cost estimate, route selector and checklist read this file. The step-by-step text on the IBCC, HEC, MOFA and Apostille pages is plain HTML: when a procedure changes, edit those pages and the matching stage items in `attest-data.js`. Procedures changed several times in 2024–2026 (HEC went fully online in May 2026; MOFA introduced a Digital Attestation System on 12 October 2026), so check the official portals before every review.

## Self-hosting the fonts

Pages load the Barlow typefaces from Google Fonts. To avoid contacting Google, download Barlow, Barlow Condensed and Barlow Semi Condensed (Open Font License) into `assets/fonts/`, add `@font-face` rules at the top of `main.css`, and remove the three Google Fonts lines from the `<head>` of each page. Also remove `https://fonts.googleapis.com` and `https://fonts.gstatic.com` from the Content Security Policy in `netlify.toml`.

## Speech and recording

Read-aloud uses the browser’s Web Speech API (`speechSynthesis`) with German (`de-DE`) and English (`en-GB`) voices. If a phone reads German with an English voice, install a German voice in the system settings. The speaking recorder uses `MediaRecorder`; recordings stay in the browser.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Corrections to visa or attestation information must include the official source.

## Licence

- Code: [MIT](LICENSE).
- Original learning content (practice texts, model answers, explanations): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Goethe-Zertifikat is a product of the Goethe-Institut. IELTS is jointly owned by the British Council, IDP IELTS and Cambridge University Press & Assessment. All practice material here is original.

Made by Rohail Ahmed Sial: [GitHub](https://github.com/rohail-ahmed-sial), [LinkedIn](https://www.linkedin.com/in/rohailahmedsial), rohilahmedsial@gmail.com
#   r a x s t u d y g e r m a n y  
 