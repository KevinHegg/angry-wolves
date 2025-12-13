# Angry Wolves (Prototype)

Mobile-first, casual “Tetris-but-herds” game.

- Classic Tetris board + falling tetrads
- Clear **connected groups (4-neighbor) of 10+** matching animals (not rows)
- Power tiles:
  - 💩 Cow pie = **-5** coins when cleared
  - 🥚 Golden egg = **+5** coins when cleared
- Special 2×2 pieces:
  - 🐺 Wolves = “bomb” effect on lock (prototype behavior)
  - 🐑‍⬛ Black sheep = converts into the best adjacent animal type on lock

## Run locally (Codespaces)
1. Open the repo in **Code → Codespaces → Create codespace on main**
2. Open `index.html` in the editor.
3. Preview:
   - Right-click `index.html` → **Open with Live Server** (recommended), or
   - Use the built-in preview / open in a new tab.

## Controls
Mobile:
- Tap board = rotate
- Swipe left/right = move
- Swipe down = drop (bigger swipe = hard drop)
- Buttons below the board also work (hold to repeat)

Desktop:
- Arrow keys = move/drop
- `Z` / `X` = rotate
- `Space` = hard drop
- `P` = pause

## Deploy to GitHub Pages
1. Repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`  Folder: `/root`
4. Save

Your game will appear at:

`https://YOUR_USERNAME.github.io/angry-wolves/`

## Files
- `index.html` — single-file prototype (Canvas + JS)
