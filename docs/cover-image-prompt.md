# Enderas Auction System — Cover Image Generation Prompt

## Context

This prompt is designed to generate an **abstract, richly detailed cover image** for the Enderas Auction System GitHub repository. The image will serve as the repository header / profile banner and should communicate the system's identity, purpose, and technical depth at a glance.

---

## The Prompt

> **Generate an abstract, wide-format (1280x640px or 2:1 ratio) digital illustration for a government auction management platform called "Enderas Auction System."**
>
> ### Central Focal Point
> Place the **Enderas logo** at the visual center — a bold geometric star-gear hybrid shape with concentric target circles at its core (a dark outer ring, a bright inner ring, and a deep center). The logo should feel metallic or luminous, as if carved from light, and should subtly glow against the background.
>
> ### Background & Atmosphere
> The background should be a **deep navy-to-midnight gradient** (from #06436a to #081026), evoking professionalism, trust, and Ethiopian institutional identity. Layer semi-transparent geometric shapes — hexagons, circuit-board traces, dotted grid patterns, and flowing data streams — to suggest a modern digital platform. Faint topographic contour lines should weave through the background, hinting at asset locations and Ethiopian geography.
>
> ### Scattered Keywords & Typography
> Weave the following words throughout the composition in varying sizes, orientations, opacities, and typefaces (mix of clean sans-serif and elegant serif). Some words should be bold and prominent, others whispered and ghosted into the background:
>
> **Primary words (larger, 60-80% opacity):**
> - `AUCTION`
> - `BIDDING`
> - `EVALUATION`
> - `ASSET`
> - `KYC`
> - `ENDERAS`
>
> **Secondary words (medium, 30-50% opacity):**
> - `PAYMENT`
> - `CPO`
> - `WINNER`
> - `VERIFICATION`
> - `SECURITY`
> - `RBAC`
> - `NOTIFICATION`
>
> **Tertiary words (small, 10-25% opacity, decorative):**
> - `ETB`
> - `ADDIS PAY`
> - `JWT`
> - `SEQUELIZE`
> - `MYSQL`
> - `REDIS`
> - `NODE.JS`
> - `EXPRESS`
> - `REACT`
> - `VITE`
> - `EXPO`
> - `SEAL`
> - `DOCUMENT`
> - `INSPECTION`
> - `VALUATION`
> - `RESERVE PRICE`
> - `CLOSED BID`
> - `TIE-BREAK`
> - `SOFT DELETE`
> - `UUID`
> - `OTP`
> - `BCRYPT`
> - `MIGRATION`
> - `SEED`
> - `AMHARIC`
> - `ETHIOPIA`
> - `PLC`
>
> ### Color Palette
> Use these exact brand colors throughout:
> - **Navy Blue** `#06436a` — primary surfaces, large shapes
> - **Deep Navy** `#04304c` — depth, shadows, gradients
> - **Midnight** `#081026` — background edges, contrast
> - **Soft Blue** `#76a6c5` — highlights, glows, accent lines
> - **Overlay Blue** `#1b447d` — translucent overlays, data streams
> - **Success Green** `#28a745` — small accent dots, checkmarks, status indicators
> - **Warning Amber** `#ffc107` — small accent dots, clock icons, timer elements
> - **Danger Red** `#dc3545` — small scattered accent marks
> - **Teal** `#17a2b8` — info badges, floating particles
> - **White** `#ffffff` — logo glow, key text highlights, sparkle points
>
> ### Visual Elements to Scatter
> - **Auction gavel silhouette** — subtle, abstract, in the upper-left quadrant
> - **Rising bar chart** — faint, ghosted, in the lower-right, suggesting reporting & analytics
> - **Document/paper icons** — floating at various angles, some with lock symbols (gated documents)
> - **Fingerprint or shield icon** — representing KYC and security
> - **Circular countdown timer ring** — suggesting auction deadlines and auto-close
> - **Binary/hex code streams** — flowing vertically like The Matrix, very subtle, representing the tech stack
> - **Map pin markers** — tiny, scattered, representing asset locations across Ethiopia
> - **Mobile phone outline** — faint, in one corner, representing the cross-platform mobile app
> - **Coin/payment icon** — representing Addis Pay integration and ETB transactions
> - **Winner trophy or star** — small, in the upper area, suggesting the winner selection process
> - **Concentric circles / radar pulse** — emanating from the logo, suggesting broadcast notifications (SMS, email, in-app)
> - **Hexagonal grid pattern** — fading in and out, suggesting modular architecture
> - **Ethiopian flag colors** — extremely subtle tricolor accent (green, yellow, red) as a thin border or ribbon element somewhere in the composition
>
> ### Composition Style
> - **Abstract and layered** — not a literal screenshot or UI mockup
> - **Dense but balanced** — rich with detail but not chaotic
> - **Dark, premium, institutional** — this is a national enterprise platform, not a consumer toy
> - **Tech-forward** — circuit traces, data particles, digital noise textures
> - **Ethiopian identity** — subtle geographic and cultural hints without being heavy-handed
>
> ### Text Overlay (bottom area)
> At the bottom of the image, include:
> - **"ENDERAS"** in large, bold, wide-tracked uppercase letters (white with soft glow)
> - **"AUCTION MANAGEMENT SYSTEM"** in smaller, lighter text beneath it
> - **"Enderas National PLC"** in very small, elegant italic text below that
>
> ### Technical Specifications
> - Aspect ratio: **2:1** (1280×640 or 1920×960)
> - Style: **Digital illustration / abstract graphic design**
> - Mood: **Professional, trustworthy, modern, Ethiopian**
> - No photographic elements — purely illustrative and typographic
> - The image should look sharp at both full size and when scaled down to GitHub's narrow README display

---

## Usage

Place the generated image at:

```
docs/cover.png
```

Then reference it in `README.md`:

```markdown
![Enderas Auction System](docs/cover.png)
```

Or as an HTML image tag for width control:

```html
<p align="center">
  <img src="docs/cover.png" alt="Enderas Auction System — Cover" width="100%" />
</p>
```

---

## Notes for the Generator

- If the AI image tool struggles with text rendering, prioritize the **visual composition and keywords as design elements** and add the "ENDERAS" title text manually in a design tool afterward.
- The logo SVG is available at `frontend/src/assets/images/enderas_logo.svg` — it can be extracted and composited manually if needed.
- The key brand color is **#06436a** (navy blue) — it should dominate approximately 50-60% of the image's color area.
