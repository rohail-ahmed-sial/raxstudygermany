# Contributing to RAX Study Germany

Thank you for helping. RAX Study Germany is a static site: every page is plain HTML, and content data lives in `assets/js/data/`.

## Reporting an outdated or wrong visa fact

Open an issue with:

1. the page on RAX Study Germany,
2. the **official** source (a German mission, the Federal Foreign Office, Make it in Germany, a ministry or a federal agency),
3. what the official page says now, and the date you checked it.

Blogs, agents and forums are not accepted as sources. When a figure cannot be confirmed, it is shown as “Verify current requirement”.

## Changing visa figures

Edit `assets/js/data/visa-data.js`. Update `display`, `amount`, `checked` (YYYY-MM-DD) and `status`. Do not invent fees, amounts or processing times. Do not describe a language certificate or IELTS as a universal requirement.

## Adding practice material

- Write original texts. Do not copy official exam papers or commercial books.
- German practice sets live in `assets/js/data/german-sets.js` (format documented at the top of `assets/js/practice.js`).
- IELTS sets live in `assets/js/data/ielts.js`.
- Keep English plain and short. The site is in English only; do not add Urdu or Roman Urdu translations.

## Code

- No frameworks and no build step. Keep scripts small and wrap `localStorage` access in `RAX.store` (it handles blocked storage).
- Test pages at 390 px and 1280 px width, in light and dark mode, and with the keyboard.
- Keep the Content Security Policy in `netlify.toml` working: no inline scripts or event handlers.

## Out of scope

University search engines, degree comparisons or rankings, admission eligibility databases and application management systems are out of scope for this project.
