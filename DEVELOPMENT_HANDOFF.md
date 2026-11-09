# DragonCraft: Prodigy Realm — Agent Handoff & Development Notes

## 1. Project Overview & Original User Requirements

### Target Audience
- **Player**: 9-year-old elementary school student (Grade 3–4 level).
- **Interests**: *Prodigy Math*, *Minecraft*, elemental dragons, magical spells, treasure chests, and surprise rewards.
- **Primary Device**: Apple iPad using Mobile Safari (touch-first, no external mouse required).

### Core Vision & Constraints
- **Stealth Learning (STEM Core)**: Problem solving is the core criteria, but it should feel like an intuitive video game rather than a dry worksheet or test. Solving equations and STEM concepts is the direct mechanic for dealing damage, taming dragons, and mining voxel resources.
- **Zero Clutter & Kid-Centric UX**: Avoid confusing dashboards, overwhelming options, multi-field setup forms, or complex menus. Provide single-click entry, a guided visual path, and clear immediate goals that pull the kid in.
- **Surprise Reward Loops**: Every level-up, achievement, and boss victory must grant tactile surprise chests that yield visible cosmetics (crowns, wings, staffs) and new companion dragons.
- **Online & Version Controlled**: Structured as a lightweight web app deployed via GitHub Pages from the user's GitHub account (`KalyanMuppala`).

---

## 2. Chronological Prompt History & Iterations

### Phase 1: Initial Prompt
> *"i want to develop a game for 9 years old kid who is in elementary school... he like games like: prodigy, minecraft, with lot of dragons, magical stuff, Also design some chests as well as some surprises for every level or every achievement he has achieved... STEM related, so every equation or every dragon... strategy what a prodigy is following... pushed to my GitHub and it should be an online website where he can log in and just play it."*

- **Action Taken**: Built initial multi-tab interface with 2D grid canvas, turn-based battle arena, PIN login, and curriculum tuner. Staged in local Git repository.

### Phase 2: Quality & UX Pivot (User Feedback)
> *"This looks pretty standard, not even standard, it's much lower than a standard. I bet not even a five-year-old kid will play this game... the graphics should be much more intuitive. Dude, that is so confusing, a lot of options. You should never give a kid a lot of options. Just enter that and make sure you develop and design it much more curated way. The game should pull the kid into you."*

- **Action Taken**: Completely scraped the multi-tab layout and form fields. Re-architected into a fullscreen 60fps 2.5D isometric voxel floating island with an automated Golden Path, flying dragon followers, high-energy particle bursts, and an interactive "Tap 3 Times" chest-breaking mechanic.

### Phase 3: Platform Hardening (iPad Safari Focus)
> *"Also all the time the kid plays this game in ipad only soo design it as per it he opens it in safari"*

- **Action Taken**: Optimized specifically for iOS/iPadOS Safari:
  - Added `100dvh` viewport height and `viewport-fit=cover` to eliminate Safari URL-bar jitter.
  - Implemented touch-action locks to prevent elastic rubber-banding, double-tap zoom, and pinch gestures.
  - Built an ergonomic dual-thumb touch layout: a virtual floating thumbstick on the bottom-left and an oversized 1-tap quest orb on the bottom-right.
  - Configured zero-dependency Web Audio touch-unlocking so sound effects play seamlessly without being muted by iOS autoplay policies.

---

## 3. Technical Architecture & File Inventory

### Local Files on Device: `/Users/munnakalyan/.gemini/users/user1/DragonCraft-STEM/`

1. **`index.html`**:
   - Semantic HTML5 shell with iPad safe-area padding (`env(safe-area-inset-top)`).
   - Contains minimal HUD (Level Star, XP gauge, Coin counter, Active Quest banner).
   - Modals: 1-Click Hero Splash Portal, Visual STEM Spell-Forge, and 3-Tap Chest Unboxing.
2. **`game.js`**:
   - **SoundEngine**: Procedural Web Audio synthesizer (zero audio asset downloads; generates chiptune steps, coins, laser blasts, chest cracking, and level-up fanfare).
   - **Isometric Renderer**: Calculates `gx, gy, gz` coordinates to screen pixels with automatic DPR scaling (supports Retina 2x displays).
   - **Visual STEM Generator**: Creates Grade 3–5 problems across 5 visual categories:
     - *Voxel Power Arrays* (Multiplication grids).
     - *Dragon Egg Balance Scales* (Visual algebra).
     - *Alchemist Potions* (Fraction bar models).
     - *Minecraft Blueprints* (Area & perimeter formulas).
     - *Elemental Science* (States of matter, simple machines, closed electrical circuits).
   - **iPad Touch Controller**: Virtual joystick with directional normalization mapped to isometric vectors, plus direct tap-to-move pathfinding with touch ripple animations.
3. **`styles.css`**:
   - Modern CSS variables, Tailwind-compatible styling, Fredoka/Inter typography, and hardware-accelerated CSS animations (`pulseGlow`, `floatBob`, `shakeWrong`).
4. **`.github/workflows/deploy.yml`**:
   - GitHub Actions workflow that automatically deploys the static game to GitHub Pages upon pushing to `main`.
5. **`README.md`**:
   - Project documentation and local quickstart instructions.

### Canvas / Self-Contained Web App
- **`dragoncraft_ipad.html`**: Single-file bundle containing the complete game engine with embedded base64 studio illustrations, ready for immediate browser preview.

---

## 4. Current State & Handoff Checklist for Next Agent

- [x] **Core Game Playable**: Island exploration, STEM spell casting, wild dragon dueling, dragon taming, and 3-tap chest unboxing are 100% functional.
- [x] **iPad Safari Optimization**: Viewport scaling, touch gestures, and audio context unlock confirmed working.
- [x] **Local Git Repository**: Initialized at `/Users/munnakalyan/.gemini/users/user1/DragonCraft-STEM` on branch `main` with 2 commits tracking all progress.
- [ ] **GitHub Remote Push**: Awaiting the target repository name under user account `KalyanMuppala` (e.g. `git@github.com:KalyanMuppala/dragoncraft-stem.git`) to execute `git remote add origin` and `git push -u origin main`.
- [ ] **GitHub Pages Activation**: Once pushed, ensure repository settings have GitHub Pages enabled from GitHub Actions to generate the public web URL.
