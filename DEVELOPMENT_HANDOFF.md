# DragonCraft: Prodigy Realm — Agent Handoff & Development Notes

## 1. Project Overview

### Target Audience & Core Vision
- **Player**: 9-year-old elementary school student (Grade 3–5 level).
- **Concept**: Blends *Prodigy Math*-style STEM magical battles with *Minecraft*-style 2.5D voxel island exploration, dragon taming, gear unlocks, and surprise treasure chests.
- **Primary Device**: Apple iPad / Mobile Safari (touch-first ergonomics, zero external assets; needs no network once loaded, but has no service worker/offline install).

---

## 2. Technical Architecture & File Inventory

### Files located in `/Users/munnakalyan/.gemini/users/user1/DragonCraft-STEM/`:

1. **`index.html`**:
   - Semantic HTML5 shell with iPad safe-area padding (`env(safe-area-inset-top)`).
   - Touch-optimized HUD (Level Star, XP gauge, Coin counter, Active Quest banner).
   - Interactive overlays: 1-Click Hero Splash Portal, Visual STEM Spell-Forge, and 3-Tap Chest Unboxing.
2. **`game.js`**:
   - **SoundEngine**: Procedural Web Audio API synthesizer generating chiptune steps, coin jingles, laser blasts, and chest cracking.
   - **Isometric Renderer**: Calculates `gx, gy, gz` coordinates to screen pixels with automatic high-DPI Retina DPR scaling (2x rendering support).
   - **Visual STEM Generator**: Creates Grade 3–5 visual challenges across 5 categories:
     - *Voxel Power Arrays* (Multiplication grids).
     - *Dragon Egg Balance Scales* (Visual algebra equations).
     - *Alchemist Potions* (Fraction bar models).
     - *Minecraft Blueprints* (Area of a block grid).
     - *Elemental Science Circuits* (Battery, wire loop with visible open gap ✂️, and dark unlit lamp 💡).
   - **iPad Touch Controller**: Floating virtual joystick, 1-tap quest orb, and tap-to-move (straight-line walk, no pathfinding).
3. **`styles.css`**:
   - Modern CSS variables, system-font typography (Fredoka falls back to Trebuchet/system-ui), and hardware-accelerated CSS animations (`pulseGlow`, `floatBob`, `shakeWrong`).
4. **`.github/workflows/deploy.yml`**:
   - GitHub Actions workflow for automated deployment to GitHub Pages on push to `main`.
5. **`README.md`**:
   - Project documentation and quickstart guide.

---

## 3. Implemented Features & Game Rules

- **Infinite Island Progression with Loop Scaling**:
  - Explore 4 elemental islands (*Emerald Voxel Woods, Redstone Magma Citadel, Crystal Sky Sanctuary, Obsidian Ender Keep*).
  - After completing Island 4, a **Final Realm Celebration Chest** appears, and islands cycle infinitely with **Enemy HP +20% scaling per loop**.
- **Friendly Non-Punishing Combat & HP System**:
  - Answering STEM challenges incorrectly in battle drops hero HP (`-15 HP`).
  - At 0 HP, the game never triggers a game-over screen; instead, it displays a friendly `"Dragon naps — try again!"` notification, restores hero HP to max, and lets the player continue.
- **3-Tap Interactive Surprise Chests**:
  - Every boss victory and island completion triggers an interactive 3-tap chest unboxing yielding rare gear cosmetics (Golden Crown, Aether Dragon Wings, Redstone Staff, Orbiting Star), new companion dragons, and voxel gems.
- **Mobile Safari Optimization**:
  - Hardened against rubber-banding, pinch zoom, and double-tap delays using `100dvh` and touch-action locks.
