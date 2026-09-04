# Roylle — personal portfolio

A personal portfolio, inspired by the spacious typography and interactive pixel language of [Craft by wild](https://craft.wild.as/), with original layout, copy and canvas implementation.

## Run

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. `npm run build` creates `dist/`; `npm run preview` serves that production build locally. No hosting service, database, API key, or paid dependency is required.

## Content

- Profile: [Hoang Le on Behance](https://www.behance.net/hoangle1999), checked September 3, 2026.
- Twelve public project covers are stored locally alongside three local case studies; six projects are selected for the initial gallery, led by GrabRoy, CrypRoy and Forma.
- Five selected projects also include their original long-form artwork in the preview dialog. Existing projects link to their own full Behance presentation; the three independent concepts link to local case studies.
- Project names, source URLs and categories live in `src/projects.js`.
- Profile details also use the user-supplied `CV_UIUX_hoangJimNew.pdf`: Hoang Le (Roylle), UI/UX work starting in 2022 (corrected by the user), Dai Quoc Viet (October 2022–April 2025), education, immersive design, mentoring, and design tools. Dai Quoc Viet dates remain those in the CV. The user also supplied nanoHome and Orchestars, UI/UX collaboration with CoderPush, and marketing/e-commerce experience at nanoHome; the two new roles have no dates until supplied.
- The AI Product Designer direction and proficiency in Codex, ChatGPT, Gemini, Flow Labs, and Claude were supplied directly by the user on September 3, 2026. Introductory copy describes this as the next chapter of their practice. Existing projects are not relabeled as AI projects, and no AI project results or metrics are claimed.
- The source CV remains unchanged; no downloadable copy is added. The user confirmed a Bachelor of Business Administration, an interest in technology since primary school, and design/programming since high school.
- The motion project currently has a cover preview and a link to its original animation on Behance; it does not contain a local video copy.
- Assets belong to the user who supplied their portfolio. `scripts/download-assets.py` records exact observed source URLs and can restore missing files with Python + Pillow.

## Implementation

Vanilla JavaScript + Vite. Fonts are bundled locally (Manrope and Instrument Serif, distributed under their included open font licenses). CSS handles responsive layouts; a native dialog supplies focus containment and Escape dismissal.

The interaction uses a document-wide thermal heat grid. Connected colour bands animate in the hero; pointer strokes are interpolated so fast movements leave continuous trails. Hovering the hero resolves its existing grid cells into a smile, which dissolves back into the ribbon on exit. Around titles, in About, and at an idle pointer, the same thermal pixels form a smaller smile; Contact retains its envelope. The original palette, trails, hold-and-release shockwaves, and project hover effects are preserved. Project hover samples the local image to pixelate its corners and draws a travelling thermal border.

The canvas overlay is pointer-transparent and suspends interaction while project dialogs are open. Actual rendered text lines get a cached, feathered opacity field instead of full-width rectangular cutouts. Profile blocks no longer cover the effect with opaque panels. Buttons, links, and disclosure controls gain travelling pixel edges on hover or keyboard focus and a brief expanding pixel pulse on activation; project cards keep their image-specific effect. Buttons and project images share border geometry anchored to the element bounds; corner breakup is clipped to the image. The overlay backing size matches its CSS box to prevent scrollbar-related scaling offsets. A shared motion toggle and `prefers-reduced-motion` disable both ambient and pointer effects. The simulation uses elapsed time, caps rendering at 60 fps, and stops in hidden tabs. Touch devices retain the ambient artwork and normal scrolling without mouse-only trails. Event listeners and observers are disposed on module replacement.

## Quick contact

Three fixed contact links use `https://zalo.me/0338341000`, `tel:+84338341000`, and `mailto:hoanglv.md1999@gmail.com`. The user supplied the phone and new email; every portfolio email link uses this address. Links open the appropriate service/application without sending a message automatically.

Icon sources: [Zalo / Simple Icons](https://github.com/simple-icons/simple-icons/blob/develop/icons/zalo.svg), [Phone / Lucide](https://lucide.dev/icons/phone), [Mail / Lucide](https://lucide.dev/icons/mail). SVGs and their upstream license notices are bundled in `src/icons/`.

## Verification

- Production build succeeds.
- Real browser checks at 375, 768, 1024 and 1440 pixels: no horizontal overflow.
- Category filters return 5 websites, 8 apps/systems and 2 explorations, including three local concepts.
- Expand/collapse changes between 6 selected and all 15 projects.
- Desktop and mobile dialogs open/close; Escape restores focus to the originating card.
- Email and Behance destinations inspected; no email sent.
- Motion pause/resume and emulated reduced-motion preference verified.
- Text transitions around the About label and button hover/click feedback checked in the browser; expansion and filters remain functional.
- Accordion interaction verified; browser console contains no warning/error entries during these checks.

The contact section shares the site's paper background, ink text, and cobalt accents. Warm gold is reserved for the contact button, retaining the user's warm-color preference without introducing a separate section palette.

## Hosting

Published with GitHub Pages at https://roylle.github.io/. The deployment workflow builds every HTML entry point and deploys `dist/` on pushes to `main`. Local research in `Grab/` and QA screenshots in `evidence/` are excluded from the public repository.

Local development: http://127.0.0.1:1102/.


## Forma — banking app concept

Added September 3, 2026. Open `/forma.html` or select **Forma** in the portfolio gallery. The Vite build includes both the portfolio and this standalone case-study page.

- Original concept identity, vector cover, responsive case study, visual system and Vietnamese interactive prototype. Reference links to N26, Monzo and Grab are included in the page; their artwork is not copied into the project.
- Three scenarios: transfer to a sample recipient, sample QR payment, and cardless ATM withdrawal. Each shows the amount and zero demo fee before confirmation. Amount validation, editing, cancellation, success feedback and a sample transaction ledger are implemented.
- Withdrawal codes expire after five minutes. Creating or cancelling a code does not debit the sample balance; only the explicit simulated collection step does. Pending withdrawal codes must be completed or cancelled before another scenario starts.
- The overview supports balance visibility, demo debit-card lock/unlock, recent activity and reset. State exists only in memory and resets on reload. There are no financial APIs, real accounts, camera access, analytics, user-data collection or real transactions.
- This is a design concept, not a launched bank or validated client engagement. No user research, conversion metrics or real product outcomes are claimed.
- Files: `forma.html`, `src/forma.js`, `src/forma.css`, `public/projects/forma.svg`; multi-page build configuration in `vite.config.js`.
- Browser verification and limitations are recorded in `evidence/forma-qa.md`.

## GrabRoy and CrypRoy — independent redesign studies

Added September 4, 2026. Open `/grabroy.html` and `/cryproy.html`, or select either project at the top of the portfolio gallery.

- Both pages explicitly identify the work as independent and unaffiliated. Source screenshots are acknowledged as reference evidence rather than presented as original product discovery or client work.
- Each case study separates observed design complexity, a design hypothesis, process evidence, potential value and unvalidated limitations. Artifact counts are used only as proof of scope; no business or usability outcomes are invented.
- GrabRoy presents the 60-screen super-app system through cross-service consistency, reusable interaction families and recovery routes.
- CrypRoy presents a focused spot-buy flow through decision clarity, inline validation, review, duplicate-submit protection and timeout recovery.
- Both pages use an image-led long-form narrative with project overview, table of contents and distinct framing, research, system, prototype and outcome chapters. The pacing is informed by strong editorial case-study conventions while retaining original project identities and content.
- Chapter four contains a browser-native prototype at `#prototype`, so a reviewer can test meaningful state changes without leaving the case study: GrabRoy Ride/Wallet/Support and CrypRoy amount validation, review, processing, success and timeout recovery. All data is explicitly illustrative.
- Shared presentation files: `src/case-study.js`, `src/case-prototypes.js` and `src/case-study.css`. Portfolio card treatment is in `src/project-covers.css`; optimized Figma evidence is stored under `public/projects/`.
