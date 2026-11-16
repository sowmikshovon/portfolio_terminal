# Terminal Portfolio — Sowmik Shovon Karmakar

A Linux bash terminal-style developer portfolio and interactive CV for **Sowmik Shovon Karmakar** (**Cloud, DevSecOps & QA Automation Engineer**).

- **Live Demo:** [sowmikshovon.github.io/portfolio_terminal](https://sowmikshovon.github.io/portfolio_terminal/)
- **Next.js Portfolio (Live):** [sowmik-portfolio-nextjs.vercel.app](https://sowmik-portfolio-nextjs.vercel.app)
- **Next.js Portfolio v2 Repo:** [github.com/sowmikshovon/advanced-portfolio-nextjs-v2](https://github.com/sowmikshovon/advanced-portfolio-nextjs-v2)
- **Next.js Portfolio v1 Repo:** [github.com/sowmikshovon/advanced-portfolio-nextjs](https://github.com/sowmikshovon/advanced-portfolio-nextjs)

---

## Features & Content

- **Zero-Dependency Vanilla DOM Engine:** Pure vanilla JavaScript (`index.js`) with zero external runtime dependencies (no jQuery or external CDN scripts).
- **Tag & Entity-Aware Typing Stepper:** Advances smoothly by visible characters while jumping atomically past HTML tags (`<...>`) and entities (`&...;`), never breaking partial tags or links mid-render, and pauses cleanly while hovering or focusing any `<a>` link inside `#console`.
- **Sticky `Esc` / Skip Control Bar:** Sticky `#terminal-hint` bar (`position: sticky; top: 12px`) with `Esc` keyboard shortcut and touch-friendly (`min-height: 44px`, `touch-action: manipulation`) **Skip animation** button to instant-load the full portfolio, plus `aria-live="polite"` screen-reader status announcements (`#terminal-status`).
- **User-Scroll Protection:** Detects upward `wheel`, `touchmove`, and `scroll` events and immediately stops auto-scrolling so the visitor retains full scroll control while typing is active.
- **Deep-Link `ls` Section Anchors:** All 6 files in `ls` (`about_Sowmik.txt`, `experience_and_education.txt`, `about_Skills.txt`, `about_Portfolio_and_CV.txt`, `about_Projects.txt`, `about_Contact.txt`) link directly to `#about`, `#experience`, `#skills`, `#portfolio`, `#projects`, and `#contact` (protected with `scroll-margin-top: 88px`). Visiting any `#section` hash auto-renders the full portfolio immediately and jumps to that section.
- **Screen-Reader-Friendly ASCII Skill Bars:** All 45 skill progress bars wrap the 900 decorative `#` characters inside `aria-hidden="true"` while keeping every skill name and `(XX%)` rating accessible.
- **Interactive Post-Load Terminal Prompt:** Once the portfolio finishes loading (via typing completion, `Esc`, Skip, deep link, or `prefers-reduced-motion`), an interactive bash prompt mounts in `#console` supporting command history (`ArrowUp`/`ArrowDown`) and 10 commands:
  - `help` — List all available interactive commands
  - `ls` — Display clickable portfolio file jump links
  - `about` — Profile summary, Finland location, and 4 domain pillars
  - `experience` — Reverse-chronological experience & education timeline
  - `skills` — All 45 categorized technical skills
  - `cv` — Google Drive PDF CV, printable Web CV, and Next.js v1/v2 links
  - `projects` — All 9 featured projects with GitHub & live demo links
  - `contact` — Email, LinkedIn, GitHub, Facebook, and phone
  - `clear` — Clear interactive command output history while keeping the prompt ready
  - `replay` — Reset and replay the terminal typing animation from the start
- **Complete 2026 Portfolio Sections (`sowmikshovon.txt`):**
  - **Profile & Domain Pillars:** `Cloud & IaC (Azure / Terraform)`, `DevSecOps & CI/CD`, `QA Test Automation`, and `Full-Stack TypeScript` (`Tampere, Finland`).
  - **Experience & Education (Reverse-Chronological):**
    - `2026 - Present` — Full-time availability across Finland & EU
    - `Aug 2026 - Jul 2028` — MSc in Software Product Management and Business, **LUT University** (Finland)
    - `2023-2025` — **PMSCS**, **Jahangirnagar University**
    - `2023-2024` — QA Automation Intern, **A1QA** (Page Object Model, Java, Selenium, TestNG, Cucumber BDD, Jenkins, Allure)
    - `2022-2023` — Skill Improvement, Dhaka, Bangladesh
    - `2017-2022` — **BSc** in Computer Science, **BRAC University**
  - **45 Categorized Skills:** Grouped across `Cloud & DevOps` (17), `QA & Test Automation` (10), `Backend & Databases` (7), and `Frontend & Product` (11).
  - **9 Featured Projects:** All 9 projects with GitHub repository links plus live demo links for the 4 deployed apps (`Azure Cloud Platform IaC`, `DevOps CI/CD Pipeline`, `Acquisitions API & CI/CD`, `Automated QA & Test Suite`, `Spotify Full-Stack Clone`, `Advanced Portfolio`, `IoT Parking Manager`, `Anime Vault`, `Terminal Portfolio`).
  - **CV & Contact Links:** Updated Google Drive CV, printable Web CV (`/cv`), `mailto:sowmikshovon@gmail.com`, LinkedIn, GitHub, Facebook, and phone (`+8801735867676`).

---

## Project Structure

```text
portfolio_terminal/
├── index.html                        # Zero-dependency HTML5 shell, sticky Esc/Skip bar & aria-live status
├── index.css                         # Terminal theme, sticky controls, anchor offset, interactive prompt styles
├── index.js                          # Vanilla DOM tag-aware typing engine, scroll guard, deep links & CLI prompt
├── sowmikshovon.txt                  # Terminal payload with clickable ls anchors & aria-hidden skill bars
├── scripts/
│   ├── build.mjs                     # Validates & bundles static assets into dist/
│   └── serve.mjs                     # Zero-dependency Node HTTP server for dist/
└── tests/
    └── terminal-portfolio.test.mjs   # Node test runner suite (static, content, accessibility & VM runtime checks)
```

---

## Scripts & Local Development

Requires **Node.js 18+** (zero external npm dependencies needed).

```bash
# Run TDD test suite (tests 1–8 and 10–15; test 9 skipped before build)
npm test

# Validate assets and build static bundle into dist/
npm run build

# Verify built dist/ artifacts match source files (PowerShell)
$env:BUILD_CHECK="1"; npm test

# Verify built dist/ artifacts match source files (bash / sh)
BUILD_CHECK=1 npm test

# Serve the built dist/ directory at http://localhost:3001 (override with PORT)
npm start
```

---

## Deployment (Static / GitHub Pages)

`npm run build` outputs a clean, self-contained static bundle into `dist/`:

- `dist/index.html`
- `dist/index.css`
- `dist/index.js`
- `dist/sowmikshovon.txt`

Because GitHub Pages also serves directly from the `main` branch root (`index.html`, `index.css`, `index.js`, `sowmikshovon.txt`) or from the generated `dist/` artifact on any static host (GitHub Pages Actions artifact, Netlify, Vercel, Cloudflare Pages, Nginx), keeping both root files and `dist/` synced ensures immediate compatibility everywhere.
