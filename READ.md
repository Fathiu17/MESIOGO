MESIOGO — "The Courage of Ibadan" · Àkíkanjú Ìbàdàn

An original, Ibadan-themed, Monopoly-style property trading board game for the browser.
Single-player (You vs. Ọmọ Ìbàdàn, a rule-based AI), fully bilingual English / Yorùbá.
Pure HTML + CSS + vanilla JavaScript — no frameworks, no build tools, no backend.

---

▶ How to run

No installation, no server needed:

1. Keep all four files in one folder:
   
```
   mesiogo/
     index.html
     styles.css
     data.js
     script.js
   ```

2. Double-click `index.html` (or drag it into Chrome, Edge, Firefox or Safari).
3. Press Start · Bíbẹ̀rẹ̀ and play.

> If your browser is very strict about local files, you can instead run a tiny local
server from the folder: `python3 -m http.server 8000` → open `http://localhost:8000`.
Everything (including the PNG export) also works from `file://`.

---

🎲 Rules summary

- 2 players: You (Ìwọ) vs. Ọmọ Ìbàdàn (AI). Starting cash ₦1,500 each.
- Travel clockwise around the 40-space board; collect ₦200 each time you pass START.
- Unowned property → a Buy / Pass modal appears (AI decides automatically).
- Owned property → rent is paid automatically (base rent → houses → hotel; rent doubles
  with a full colour set; transports rent ₦25/50/100/200 by count owned; utilities = 4× or 10× dice).
- Doubles roll again; three doubles in a row sends you straight to Jail.
- Jail (Ẹ̀wọ̀n): escape by rolling doubles, paying ₦50, or using a Get-Out card.
  After 3 failed turns you are forced to pay.
- Building: you may build only on a full colour group, evenly, up to 1 hotel per property.
- Taxes: Market Levy ₦200, Development Levy ₦100.
- If you cannot pay, you must sell buildings and mortgage properties — otherwise you
  are bankrupt and lose.
- Game over: when one player goes bankrupt, or after 100 turns (50 each).
  Highest Total Points wins:

```
Total Points = Cash on hand
             + Σ (purchase price of every owned property)
             + Σ (building purchase cost paid)
             + (jail-free cards × ₦50)
             − Outstanding debts / mortgages
```

- On the result screen: take a screenshot of the card ("Ya àwòrán èsì yìí.") —
  or use the Download Result as PNG button for a rendered image.

🤖 The AI (Ọmọ Ìbàdàn)

Rule-based, never cheats:
- Buys if `cash − price ≥ ₦200` or if the purchase completes a colour set.
- Builds one house per turn (cheapest property of any full group) while cash > ₦600.
- Jail: pays ₦50 when cash > 400, otherwise uses a card, otherwise tries doubles.
- When short on rent: sells one building first, then mortgages a property, then goes bankrupt.

🌍 Languages

Toggle EN | YO on any screen (top-right). Every string — UI, modals, cards, log,
game-over card — exists in both languages with full Yoruba diacritics (ẹ, ọ, ṣ, tone marks),
rendered with Noto Sans / Noto Serif via Google Fonts. The choice is remembered
(`localStorage`) between visits.

📱 Responsive

Square board at every size, breakpoints from 320 px phones (horizontally scrollable board,
full-screen modals, ≥44 px touch targets) up to 1920 px+ desktops. In phone landscape the
log panel hides to free space. `prefers-reduced-motion` is respected.

♿ Accessibility

Semantic HTML, `aria-label`s on icon buttons, keyboard navigation (Tab / Enter / Escape),
visible focus outlines, contrast ≥ 4.5:1.

---

Credits

- Game design, code, Yoruba copy: written for this project — everything is original and
  Ibadan-themed. No Monopoly art, logos, characters or card text is used.
- Landmarks referenced belong to the city of Ibadan, Ọ̀yọ́ State, Nigeria.
- Fonts: [Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans) &
  [Noto Serif](https://fonts.google.com/noto/specimen/Noto+Serif) (Google Fonts, OFL).
