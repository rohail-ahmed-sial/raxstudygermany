# 🇩🇪 RAX Study Germany

**Free, open-source resources to prepare for German language exams, IELTS, studying in Germany, visa applications, and document attestation in Pakistan.**

🌐 **Live Website:** https://raxstudygermany.netlify.app

RAX Study Germany is an independent educational platform built to help learners and applicants access practical study materials, interactive tools, and step-by-step guides in one place.

## ✨ Features

### 🇩🇪 German A1 & A2 — Goethe-Zertifikat Preparation
- Exam patterns, marks, and practice for Lesen, Hören, Schreiben, and Sprechen.
- Grammar lessons and explanations.
- **1,506 vocabulary words** with English meanings.
- **125 German verbs** and pronunciation support.
- Interactive flashcards with spaced repetition.
- A1 and A2 mock-test generators.

### 📝 IELTS Academic Preparation
- Original Listening, Reading, Writing, and Speaking practice.
- IELTS band score calculator.
- Full mock-test generator.
- Practice resources for developing exam skills.

### 🛂 Germany Visa Guide
Explore the main German visa and residence pathways:
- Student visa.
- Language course visa.
- Ausbildung (vocational training).
- Work visas.
- Opportunity Card (Chancenkarte).
- Schengen visa.
- Family reunification and other routes.

Additional tools include:
- Seven-question visa route finder.
- Route-specific document checklists.
- Fees and financing guide with a cost calculator.
- Guidance for applicants applying from Pakistan.
- Source verification database.
- Application planner.

### 🎓 Bachelor's Degree in Germany
Understand your admission options after completing education in Pakistan:
- 12, 13, or more years of education.
- Studienkolleg and the Feststellungsprüfung pathway.
- Direct and subject-related admission possibilities.
- How previous university study may affect eligibility.
- Application guidance through uni-assist.
- Interactive admission pathway checker.

*Admission requirements vary by qualification, subject, university, and individual circumstances. Always verify eligibility with the relevant university or official admissions authority.*

### 📄 Document Attestation in Pakistan
Step-by-step guidance covering:
- Educational board verification.
- IBCC attestation.
- HEC e-Attestation.
- Ministry of Foreign Affairs (MOFA) attestation.
- Apostille procedures.
- Document route selector.
- Personal document checklist.
- Fees, processing information, offices, and Germany-specific requirements.

The platform includes structured data to help users review fees, sources, and verification statuses.

### 📊 Personal Progress Tracking
- Practice scores and learning progress.
- Flashcard progress.
- Saved checklists and application plans.
- Browser-based progress storage using `localStorage`.
- Export and import personal progress as JSON.

No account is required for these features.

## 🖥️ Technology Stack

- **HTML5** — page structure.
- **CSS3** — responsive styling, light mode, and dark mode.
- **Vanilla JavaScript** — interactive tools and learning features.
- **Browser APIs** — speech synthesis, audio recording, and local storage.
- **Netlify** — live website hosting.

The website uses no frontend framework, build step, server-side code, or database. Its pages can be opened directly through `index.html`.

## 📁 Project Structure

```text
raxstudygermany/
├── index.html
├── about.html
├── disclaimer.html
├── progress.html
├── 404.html
├── german/                 # German A1/A2 learning resources
├── bachelor/               # Bachelor's admission guides
├── ielts/                  # IELTS Academic practice
├── visa/                   # Visa guides and tools
│   └── work/               # Work-related visa routes
├── attestation/             # Pakistan document attestation
├── assets/
│   ├── css/
│   │   └── main.css         # Shared styles
│   ├── js/
│   │   ├── core.js          # Shared helpers and utilities
│   │   └── data/            # Vocabulary, visa, and attestation data
│   └── img/                 # Icons and images
├── sitemap.xml
├── robots.txt
├── manifest.webmanifest
├── netlify.toml
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

Individual JavaScript files implement the practice engine, flashcards, mock tests, visa tools, and other interactive features.

## 🚀 Run Locally

**Option 1: Open directly**

1. Download or clone this repository.
2. Open the project folder.
3. Open `index.html` in your browser.

**Option 2: Use a local web server**

Requirements: Python 3.

```bash
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser.

On Windows, you can also use:

```powershell
py -m http.server 8000
```

## 🌐 Deployment

### Netlify — Recommended

Live website: https://raxstudygermany.netlify.app

To deploy your own copy:

1. Fork or push the repository to GitHub.
2. Sign in to Netlify.
3. Select **Add new site → Import an existing project**.
4. Connect GitHub and select your repository.
5. Leave the build command empty.
6. Set the publish directory to the repository root.
7. Deploy the site.

The included `netlify.toml` provides deployment configuration and security headers.

### GitHub Pages

1. Open your repository on GitHub.
2. Go to **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Choose `main` and `/(root)`.
5. Click **Save**.

Your site will be available at:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

**Note:** Review `404.html` before deploying to a project subpath, because root-relative links may need adjustment. Also review the canonical URLs, Open Graph metadata, and sitemap when publishing your own copy.

## 🔄 Maintaining Visa and Attestation Information

Visa fees, financial requirements, attestation procedures, and official policies can change. The project keeps much of this information in structured JavaScript data files.

### Visa data

File: `assets/js/data/visa-data.js`

The `window.RAX_VISA` data structure contains:
- `figures` — fees, amounts, applicability, sources, verification dates, and statuses.
- `sources` — reference pages, summaries, jurisdictions, and verification statuses.
- `routes` — route-specific checklist and visa finder data.
- `lastReview` — the last review date displayed on visa pages.

### Attestation data

File: `assets/js/data/attest-data.js`

The `window.RAX_ATTEST` data structure contains fee details, applicable procedures, sources, verification statuses, and last verification dates.

When updating information:
1. Consult the relevant official authority.
2. Update the data and the associated guide text.
3. Record the verification date.
4. Set the appropriate status.
5. Mark unconfirmed information as needing review rather than guessing.

**The website does not update its information automatically.** Review time-sensitive information regularly and before every application.

## 🔐 Privacy

- No login or registration is required.
- No database is used.
- Learning progress is stored locally in the user's browser.
- Progress can be exported and imported as JSON.
- Speaking recordings remain in the browser unless the user independently saves or shares them.

Pages load Barlow typefaces from Google Fonts by default. For a fully self-hosted font setup, download the fonts into `assets/fonts/`, add local `@font-face` rules, and update the Content Security Policy accordingly.

## 🤝 Contributing

Contributions, corrections, and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the affected pages and tools.
5. Submit a pull request describing your changes.

For corrections to visa or attestation information, include a link to the relevant official source.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📜 Licence

- **Code:** [MIT License](LICENSE).
- **Original learning content:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

Goethe-Zertifikat is a product of the Goethe-Institut. IELTS is jointly owned by the British Council, IDP IELTS, and Cambridge University Press & Assessment. All practice material on RAX Study Germany is original and is not presented as official exam material.

## ⚠️ Disclaimer

RAX Study Germany is an independent educational and informational platform. It is not affiliated with or endorsed by IBCC, HEC, Pakistan's Ministry of Foreign Affairs, the German government, German Missions, the Goethe-Institut, or IELTS.

Document-attestation requirements depend on the document type, destination, and receiving authority. Always confirm current requirements with the appropriate official authority before submitting documents or making payments.

This platform does not guarantee visa eligibility, appointment availability, processing times, university admission, or application approval. Its content is for general informational and educational purposes and does not replace official guidance.

## 👨‍💻 Author

**Rohail Ahmed Sial**

- GitHub: [@rohail-ahmed-sial](https://github.com/rohail-ahmed-sial)
- LinkedIn: [rohailahmedsial](https://www.linkedin.com/in/rohailahmedsial)
- Email: rohilahmedsial@gmail.com

---

**Learn. Prepare. Apply with confidence. 🇩🇪**

If RAX Study Germany helps you, consider giving the repository a ⭐ on GitHub!
