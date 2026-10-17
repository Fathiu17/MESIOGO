/* ==========================================================================
   MESIOGO — data.js
   Board data (40 spaces), event card decks, game config and the central
   EN/YO translation dictionary. Loaded before script.js.
   All space names, card texts and UI strings exist in English and Yoruba.
   ========================================================================== */

/* ---------- Game configuration ---------- */
const GAME_CONFIG = {
  startCash: 1500,      // starting cash per player
  salary: 200,          // collected each time START is passed
  jailFine: 50,         // pay to leave jail
  maxTotalTurns: 100,   // 50 turns each → then highest Total Points wins
  jailMaxTurns: 3,      // forced bail after this many jail turns
  mortgageRate: 0.5,    // mortgage value = price × 0.5
  unmortgageRate: 0.55, // cost to lift mortgage = price × 0.55 (10% interest)
  jailCardValue: 50,    // each get-out-of-jail card is worth ₦50 in Total Points
};

/* ---------- The board: exactly 40 spaces, in clockwise order from START ---------- */
/*
   type: 'start' | 'property' | 'transport' | 'utility' | 'tax' | 'chance' | 'chest' | 'corner'
   Properties have: group, price, rent[base, 1h, 2h, 3h, 4h, hotel], houseCost
   Transports have:  price, rentByCount [1, 2, 3, 4 owned]
   Utilities have:   price (rent = 4× dice with one owned, 10× dice with both)
*/
const BOARD_DATA = [
  /* 0 */ { type: 'start', icon: '🚩', name: { en: 'START', yo: 'Bíbẹ̀rẹ̀' },
            flavor: { en: 'Collect ₦200 salary each pass', yo: 'Gba ₦200 ní gbàgbọ́ tí o bá kọjá' } },
  /* 1 */ { type: 'property', group: 'brown', icon: '🧺', price: 60, houseCost: 50,
            rent: [2, 10, 30, 90, 160, 250],
            name: { en: 'Foko Market', yo: 'Ọjà Foko' }, short: { en: 'FOK', yo: 'Fok' } },
  /* 2 */ { type: 'chest', icon: '📦', name: { en: 'Community Chest', yo: 'Ẹ̀bùn Ìlú' } },
  /* 3 */ { type: 'property', group: 'brown', icon: '🧺', price: 60, houseCost: 50,
            rent: [2, 10, 30, 90, 160, 250],
            name: { en: 'Beere Market', yo: 'Ọjà Bèèrè' }, short: { en: 'BEE', yo: 'Bèr' } },
  /* 4 */ { type: 'tax', icon: '🧾', amount: 200, name: { en: 'Market Levy', yo: 'Owó Ọjà' } },
  /* 5 */ { type: 'transport', icon: '🚌', price: 200, rentByCount: [25, 50, 100, 200],
            name: { en: 'Iwo Road Bus Terminal', yo: 'Ibùdó Ọkọ̀ Iwo Road' }, short: { en: 'IWO', yo: 'Iwo' } },
  /* 6 */ { type: 'property', group: 'lblue', icon: '🛣️', price: 100, houseCost: 50,
            rent: [6, 30, 90, 270, 400, 550],
            name: { en: 'Oritamerin', yo: 'Oríta Mẹ́rìn' }, short: { en: 'ORI', yo: 'Orí' } },
  /* 7 */ { type: 'chance', icon: '❓', name: { en: 'Chance', yo: 'Ànfààní' } },
  /* 8 */ { type: 'property', group: 'lblue', icon: '🌳', price: 100, houseCost: 50,
            rent: [6, 30, 90, 270, 400, 550],
            name: { en: 'Oja Igbo', yo: 'Ọjà Igbo' }, short: { en: 'OJA', yo: 'Ijà' } },
  /* 9 */ { type: 'property', group: 'lblue', icon: '⚡', price: 120, houseCost: 50,
            rent: [8, 40, 100, 300, 450, 600],
            name: { en: 'Sango Market', yo: 'Ọjà Ṣàngó' }, short: { en: 'SAN', yo: 'Ṣàn' } },
  /* 10 */ { type: 'corner', corner: 'jail', icon: '🔒', name: { en: 'JAIL', yo: 'Ẹ̀wọ̀n' },
             sub: { en: 'Just Visiting', yo: 'Ìbẹ̀wò' } },
  /* 11 */ { type: 'property', group: 'pink', icon: '🏘️', price: 140, houseCost: 100,
             rent: [10, 50, 150, 450, 625, 750],
             name: { en: 'Mokola', yo: 'Mókólá' }, short: { en: 'MOK', yo: 'Mók' } },
  /* 12 */ { type: 'utility', icon: '💡', price: 150, name: { en: 'IBEDC (Electricity)', yo: 'Ilé-iṣẹ́ Iná IBEDC' }, short: { en: 'IBE', yo: 'IBD' } },
  /* 13 */ { type: 'property', group: 'pink', icon: '⛰️', price: 140, houseCost: 100,
             rent: [10, 50, 150, 450, 625, 750],
             name: { en: 'Oke Ado', yo: 'Òkè Adó' }, short: { en: 'ADO', yo: 'Adó' } },
  /* 14 */ { type: 'property', group: 'pink', icon: '🧵', price: 160, houseCost: 100,
             rent: [12, 60, 180, 500, 700, 900],
             name: { en: 'Gbagi Market', yo: 'Ọjà Gbagi' }, short: { en: 'GBA', yo: 'Gba' } },
  /* 15 */ { type: 'transport', icon: '🚌', price: 200, rentByCount: [25, 50, 100, 200],
             name: { en: 'Ojoo Bus Terminal', yo: 'Ibùdó Ọkọ̀ Ojoo' }, short: { en: 'OJO', yo: 'Ojo' } },
  /* 16 */ { type: 'property', group: 'orange', icon: '🛍️', price: 180, houseCost: 100,
             rent: [14, 70, 200, 550, 750, 950],
             name: { en: 'Dugbe Market', yo: 'Ọjà Dugbe' }, short: { en: 'DUG', yo: 'Dug' } },
  /* 17 */ { type: 'chest', icon: '📦', name: { en: 'Community Chest', yo: 'Ẹ̀bùn Ìlú' } },
  /* 18 */ { type: 'property', group: 'orange', icon: '👑', price: 180, houseCost: 100,
             rent: [14, 70, 200, 550, 750, 950],
             name: { en: 'Oja Oba', yo: 'Ọjà Ọba' }, short: { en: 'OOB', yo: 'Ọba' } },
  /* 19 */ { type: 'property', group: 'orange', icon: '🥬', price: 200, houseCost: 100,
             rent: [16, 80, 220, 600, 800, 1000],
             name: { en: 'Bodija Market', yo: 'Ọjà Bodija' }, short: { en: 'BOD', yo: 'Bod' } },
  /* 20 */ { type: 'corner', corner: 'parking', icon: '🅿️', name: { en: 'FREE PARKING', yo: 'Ìsìnmi Ọ̀fẹ́' },
             sub: { en: 'Safe space', yo: 'Ibi ààbò' } },
  /* 21 */ { type: 'property', group: 'red', icon: '🍅', price: 220, houseCost: 150,
             rent: [18, 90, 250, 700, 875, 1050],
             name: { en: 'Aleshinloye Market', yo: 'Ọjà Alẹ̀ṣinlọ́yè' }, short: { en: 'ALE', yo: 'Alẹ̀' } },
  /* 22 */ { type: 'chance', icon: '❓', name: { en: 'Chance', yo: 'Ànfààní' } },
  /* 23 */ { type: 'property', group: 'red', icon: '🎭', price: 220, houseCost: 150,
             rent: [18, 90, 250, 700, 875, 1050],
             name: { en: 'Ibadan Cultural Centre', yo: 'Ilé Àṣà Ìbàdàn' }, short: { en: 'ICC', yo: 'Àṣà' } },
  /* 24 */ { type: 'property', group: 'red', icon: '🏺', price: 240, houseCost: 150,
             rent: [20, 100, 300, 750, 925, 1100],
             name: { en: 'National Museum of Unity', yo: 'Ilé Ìkójọpọ̀ Àṣà Ìṣọ̀kan' }, short: { en: 'MUS', yo: 'Ìṣọ̀' } },
  /* 25 */ { type: 'transport', icon: '🚌', price: 200, rentByCount: [25, 50, 100, 200],
             name: { en: 'Ring Road Interchange', yo: 'Oríta Ọ̀nà Oríka' }, short: { en: 'RNG', yo: 'Rng' } },
  /* 26 */ { type: 'property', group: 'yellow', icon: '🌷', price: 260, houseCost: 150,
             rent: [22, 110, 330, 800, 975, 1150],
             name: { en: 'Agodi Gardens', yo: 'Ọgbà Agodi' }, short: { en: 'AGO', yo: 'Ago' } },
  /* 27 */ { type: 'property', group: 'yellow', icon: '🎡', price: 260, houseCost: 150,
             rent: [22, 110, 330, 800, 975, 1150],
             name: { en: 'Trans Amusement Park', yo: 'Ọgbà Ìdárayá Trans' }, short: { en: 'TRS', yo: 'Trs' } },
  /* 28 */ { type: 'utility', icon: '💧', price: 150, name: { en: 'Oyo State Water Corporation', yo: 'Ilé-iṣẹ́ Omi Ìpínlẹ̀ Ọ̀yọ́' }, short: { en: 'OYO', yo: 'Omi' } },
  /* 29 */ { type: 'property', group: 'yellow', icon: '✈️', price: 280, houseCost: 150,
             rent: [24, 120, 360, 850, 1025, 1200],
             name: { en: 'Ibadan Airport', yo: 'Pápá Ọkọ̀ Òfuurufú Ìbàdàn' }, short: { en: 'AIR', yo: 'Òfu' } },
  /* 30 */ { type: 'corner', corner: 'gotojail', icon: '👮', name: { en: 'GO TO JAIL', yo: 'Lọ sí Ẹ̀wọ̀n' },
             sub: { en: 'Move directly to Jail', yo: 'Lọ sí Ẹ̀wọ̀n lẹ́sẹkẹsẹ' } },
  /* 31 */ { type: 'property', group: 'green', icon: '🎓', price: 300, houseCost: 200,
             rent: [26, 130, 390, 900, 1100, 1275],
             name: { en: 'University of Ibadan', yo: 'Yunifásítì Ìbàdàn' }, short: { en: 'UI', yo: 'UI' } },
  /* 32 */ { type: 'property', group: 'green', icon: '🏥', price: 300, houseCost: 200,
             rent: [26, 130, 390, 900, 1100, 1275],
             name: { en: 'University College Hospital', yo: 'Ilé-ìwòsàn UCH' }, short: { en: 'UCH', yo: 'UCH' } },
  /* 33 */ { type: 'chest', icon: '📦', name: { en: 'Community Chest', yo: 'Ẹ̀bùn Ìlú' } },
  /* 34 */ { type: 'property', group: 'green', icon: '🔧', price: 320, houseCost: 200,
             rent: [28, 150, 450, 1000, 1200, 1400],
             name: { en: 'The Polytechnic Ibadan', yo: 'Polytechnic Ìbàdàn' }, short: { en: 'POL', yo: 'Pol' } },
  /* 35 */ { type: 'transport', icon: '🚌', price: 200, rentByCount: [25, 50, 100, 200],
             name: { en: 'Moniya Terminal', yo: 'Ibùdó Mọ́níyá' }, short: { en: 'MON', yo: 'Mní' } },
  /* 36 */ { type: 'chance', icon: '❓', name: { en: 'Chance', yo: 'Ànfààní' } },
  /* 37 */ { type: 'property', group: 'dblue', icon: '🏢', price: 350, houseCost: 200,
             rent: [35, 175, 500, 1100, 1300, 1500],
             name: { en: 'Cocoa House', yo: 'Ilé Koko' }, short: { en: 'COC', yo: 'Kok' } },
  /* 38 */ { type: 'tax', icon: '🧾', amount: 100, name: { en: 'Development Levy', yo: 'Owó Ìdàgbàsókè' } },
  /* 39 */ { type: 'property', group: 'dblue', icon: '🏛️', price: 400, houseCost: 200,
             rent: [50, 200, 600, 1400, 1700, 2000],
             name: { en: 'Mapo Hall', yo: 'Gbọ̀ngàn Mapo' }, short: { en: 'MAP', yo: 'Map' } },
];

/* Colour-group definitions: members + the monopoly bonus is simply full-group ownership */
const GROUPS = {
  brown:  { members: [1, 3] },
  lblue:  { members: [6, 8, 9] },
  pink:   { members: [11, 13, 14] },
  orange: { members: [16, 18, 19] },
  red:    { members: [21, 23, 24] },
  yellow: { members: [26, 27, 29] },
  green:  { members: [31, 32, 34] },
  dblue:  { members: [37, 39] },
};

/* ---------- Ànfààní (Chance) deck — 12 original Ibadan-themed cards ----------
   effect types: collect | pay | advanceTo | backN | jail | jailFree | nothing   */
const CHANCE_CARDS = [
  { icon: '🏛️', effect: { type: 'advanceTo', space: 39, passSalary: true },
    en: 'You greet the Olubadan with respect — advance to Mapo Hall.',
    yo: 'Ì kọlẹ̀ fún Olúbàdàn pẹ̀lú ọlá — rìn lọ sí Gbọ̀ngàn Mapo.' },
  { icon: '🌊', effect: { type: 'pay', amount: 100 },
    en: 'Ogunpa River floods your route — pay ₦100 to repair the roads.',
    yo: 'Odò Ogunpa gbà ojú ọ̀nà rẹ — sán ₦100 láti ṣe atúnṣe ònà.' },
  { icon: '🎉', effect: { type: 'collect', amount: 150 },
    en: 'You win the Ibadan Week cultural grant — collect ₦150.',
    yo: 'Ì ṣẹ́gun ìdásílẹ̀ owó àṣà Ọ̀sẹ̀ Ìbàdàn — gba ₦150.' },
  { icon: '🛺', effect: { type: 'jail' },
    en: 'Your keke breaks down at Iwo Road and blocks traffic — go to Jail.',
    yo: 'Kẹ́kẹ́ rẹ dá lóde Iwo Road, o sì dí ònà — lọ sí Ẹ̀wọ̀n.' },
  { icon: '🎓', effect: { type: 'collect', amount: 200 },
    en: 'You earn a scholarship to the University of Ibadan — collect ₦200.',
    yo: 'Ì rí ìṣọ́wò-ẹ̀kọ́ sí Yunifásítì Ìbàdàn — gba ₦200.' },
  { icon: '🗼', effect: { type: 'nothing' },
    en: 'You climb Bower\'s Tower and admire the whole city — do nothing.',
    yo: 'Ì gun Ilé Ìṣọ́ Bower, ì sì wo ìlú kíkún — má ṣe ohun kankan.' },
  { icon: '🏟️', effect: { type: 'collect', amount: 50 },
    en: 'You win the race at Adamasingba Stadium — collect ₦50.',
    yo: 'Ì ṣẹ́gun ìṣeré ní Pápá Ìṣeré Adamasingba — gba ₦50.' },
  { icon: '🚨', effect: { type: 'pay', amount: 50 },
    en: 'Speeding at Ring Road Interchange — pay a ₦50 fine.',
    yo: 'Ì ronú lórí Oríta Ọ̀nà Oríka — sán owó ìlàbá ₦50.' },
  { icon: '↩️', effect: { type: 'backN', count: 3 },
    en: 'Your goods are re-routed at Oja Oba — go back 3 spaces.',
    yo: 'Wọ́n yí ojú ọ̀nà oja rẹ̀ padà ní Ọjà Ọba — padà lẹ́yìn ibi mẹ́ta.' },
  { icon: '🎖️', effect: { type: 'collect', amount: 100 },
    en: 'The Olubadan names you Mogaji of your compound — collect ₦100 in gifts.',
    yo: 'Olúbàdàn pe ọ ní Mogaji ìdílé rẹ — gba ẹ̀bùn ₦100.' },
  { icon: '🏨', effect: { type: 'advanceTo', space: 5, passSalary: true },
    en: 'Take the express coach from Premier Hotel — advance to Iwo Road Terminal.',
    yo: 'Gba ọkọ̀ ìyára láti Ilé Ìtura Premier — lọ sí Ibùdó Iwo Road.' },
  { icon: '🎫', effect: { type: 'jailFree' },
    en: 'Your uncle in Jericho signs your bail bond — keep this card to leave Jail free.',
    yo: 'Bàbá ẹ̀ ṣe é ṣèwàlẹ́ ní Jéríkò — dá kaáàdì yìí mọ̀ láti jáwọ́ Ẹ̀wọ̀n láìsán owó.' },
];

/* ---------- Ẹ̀bùn Ìlú (Community Chest) deck — 12 original cards ---------- */
const COMMUNITY_CARDS = [
  { icon: '🙏', effect: { type: 'collect', amount: 100 },
    en: 'Your market stall at Dugbe is blessed with heavy sales — collect ₦100.',
    yo: 'Àpótí ọjà rẹ ní Dugbe rí ìbùkún, tì á sì lọ dáradà — gba ₦100.' },
  { icon: '🏫', effect: { type: 'pay', amount: 50 },
    en: 'You pay school fees at Ibadan Grammar School — pay ₦50.',
    yo: 'Ì sán owó ẹ̀kọ́ ní Ilé-ẹ̀kọ́ Giramà Ìbàdàn — sán ₦50.' },
  { icon: '🌾', effect: { type: 'collect', amount: 75 },
    en: 'A relative at IITA sends you a research grant — collect ₦75.',
    yo: 'Ẹbí rẹ ní IITA rán ìdásílẹ̀ owó ìwádìí ránṣẹ́ — gba ₦75.' },
  { icon: '🎫', effect: { type: 'jailFree' },
    en: 'Community elders vouch for you — keep this Get-Out-Of-Jail card.',
    yo: 'Àgbààyé ìlú jẹ́rìí sí ọ — dá kaáàdì Ìgbàlà-Ẹ̀wọ̀n yìí mọ̀.' },
  { icon: '💧', effect: { type: 'collect', amount: 25 },
    en: 'Eleyele Dam supplies your street with fresh water — collect ₦25 rebate.',
    yo: 'Ìdídò Eleyele mú omi tútù wá sí òpópónà rẹ — gba ₦25 padà.' },
  { icon: '📚', effect: { type: 'pay', amount: 50 },
    en: 'You donate books to the Central Library — pay ₦50.',
    yo: 'Ì fún Ilé-ìkàwé Àárín ní ìwé — sán ₦50.' },
  { icon: '🛒', effect: { type: 'collect', amount: 20 },
    en: 'A refund from Ibadan City Mall — collect ₦20.',
    yo: 'Wọ́n dá owó rẹ padà láti Ilé Ìtajà Ìlú Ìbàdàn — gba ₦20.' },
  { icon: '🏥', effect: { type: 'pay', amount: 100 },
    en: 'A full check-up at UCH — pay ₦100.',
    yo: 'Ì ṣe ìwòsàn kíkún ní UCH — sán ₦100.' },
  { icon: '🎪', effect: { type: 'pay', amount: 40 },
    en: 'You host the whole street at Ibadan Recreation Club — pay ₦40.',
    yo: 'Ì pè gbogbo òpópónà sí Ẹgbẹ́ Ìdárayá Ìbàdàn — sán ₦40.' },
  { icon: '🍲', effect: { type: 'collect', amount: 100 },
    en: 'You win the amala-eating contest at Ibadan Week — collect ₦100.',
    yo: 'Ì ṣẹ́gun ìje-unbẹ̀ àmàlà ní Ọ̀sẹ̀ Ìbàdàn — gba ₦100.' },
  { icon: '🏛️', effect: { type: 'collect', amount: 150 },
    en: 'The Oyo State Secretariat overcharged you last year — collect ₦150 refund.',
    yo: 'Ilé-iṣẹ́ Ìjọba Ìpínlẹ̀ Ọ̀yọ́ gba owó tó pọ̀ lọ́dún rẹ̀ — gba ₦150 padà.' },
  { icon: '🚧', effect: { type: 'pay', amount: 60 },
    en: 'Road repairs outside your house — pay ₦60.',
    yo: 'Wọ́n ń ṣe atúnṣe ònà níwájú ilé rẹ — sán ₦60.' },
];

/* ---------- Central translation dictionary ---------- */
/* {placeholders} are replaced by script.js via t(key, vars) */
const I18N = {
  en: {
    /* UI chrome (index.html) */
    brandTag: 'Àkíkanjú Ìbàdàn',
    ariaSound: 'Toggle sound',
    kicker: 'The Courage of Ibadan · Àkíkanjú Ìbàdàn',
    btnStart: 'Start · Bíbẹ̀rẹ̀',
    btnHowTo: 'How to Play · Bí a ṣe ń ṣeré',
    howToTitle: 'How to Play · Bí a ṣe ń ṣeré',
    btnBack: '← Back · Padà',
    centerKicker: 'The city of brown roofs',
    btnRoll: '🎲 Roll · Ya',
    btnBuild: '🏠 Build · Kọ́',
    aiThinking: 'Ọmọ Ìbàdàn ń ṣeré…',
    lblLog: 'Game Log · Ìtàn Ìṣeré',
    btnPlayAgain: '🔁 Play Again · Tún ṣeré',
    btnDownloadPng: '🖼 Download Result as PNG · Gbà àwòrán',
    colPlayer: 'Player', colCash: 'Cash', colProperty: 'Property',
    colBuildings: 'Buildings', colDebts: 'Debts', colTotal: 'Total Points',
    screenshotMsg: 'Take a screenshot of this result.',
    ariaClose: 'Close',
    credits: 'An original Ibadan-themed board game · Pure HTML/CSS/JS · No frameworks',

    /* Players */
    you: 'You', aiName: 'Ọmọ Ìbàdàn',
    turnYou: 'Your turn — roll the dice!',
    turnAi: 'Ọmọ Ìbàdàn\'s turn…',

    /* Log & dice */
    logRolled: '{p} rolled {d1} + {d2} = {total}',
    logDoubles: 'Doubles! {p} rolls again.',
    logThreeDoubles: 'Three doubles in a row — {p} goes straight to Jail!',
    logPassedStart: '{p} passed START and collected ₦200.',
    logLanded: '{p} landed on {space}.',

    /* Buy modal */
    buyTitle: 'Buy this property?',
    buyQuestion: '{space} costs ₦{price}. Owning it lets you charge rent. Buy it or pass?',
    btnBuy: 'Buy · Ra',
    btnPass: 'Pass · Kọjá',
    logBought: '{p} bought {space} for ₦{price}.',
    logPassed: '{p} passed on {space}.',
    notEnoughCash: 'You cannot afford this property.',

    /* Rent modal */
    rentTitle: 'Rent due',
    rentPayMsg: '{p} pays ₦{amount} rent to {owner} for {space}.',
    mortgagedNoRent: '{space} is mortgaged — no rent charged.',
    ownedBy: 'Owned by {owner}',
    btnOK: 'OK · Ó dára',

    /* Rent table in buy modal */
    rentLabel: 'Rent', oneHouse: 'with 1 house', twoHouses: 'with 2 houses',
    threeHouses: 'with 3 houses', fourHouses: 'with 4 houses', hotel: 'with hotel',
    housesCost: 'Houses cost ₦{cost} each',
    fullSetBonus: 'Rent doubles when the full colour set is owned.',

    /* Tax / parking / corners */
    taxPayMsg: '{p} pays ₦{amount} — {tax}.',
    freeParkingMsg: '{p} rests at Free Parking — a safe space, no action.',
    jailVisitMsg: '{p} is just visiting Jail.',
    goToJailMsg: '{p} is sent straight to Jail!',

    /* Event cards */
    chanceKicker: 'ÀNFÀÀNI · CHANCE',
    chestKicker: 'Ẹ̀BÙN ÌLÚ · COMMUNITY CHEST',
    cardOK: 'Continue · Tẹ̀síwájú',

    /* Jail */
    jailTitle: 'Ẹ̀wọ̀n — You are in Jail',
    jailSub: 'Roll doubles, pay ₦50, or use a Get-Out card.',
    jailTryDoubles: 'Try doubles · Gbìyànjú àdíṣẹ́bọ̀',
    jailPay: 'Pay ₦50 · Sán ₦50',
    jailUseCard: 'Use card · Lo kaáàdì',
    jailNoDoubles: 'No doubles — {p} stays in Jail.',
    jailForcedPay: 'Third turn in Jail — {p} must pay ₦50.',
    jailPaid: '{p} paid ₦50 and left Jail.',
    jailCardUsed: '{p} used a Get-Out card and left Jail.',
    jailDoublesOut: '{p} rolled doubles and left Jail!',

    /* Building */
    buildTitle: 'Build houses · Kọ́ ilé',
    buildEmpty: 'You need to own a full colour group before you can build.',
    buildMaxed: 'This property already has a hotel.',
    buildHouse: 'Build house · Kọ́ ilé (₦{cost})',
    logBuiltHouse: '{p} built a house on {space} (−₦{cost}).',
    logBuiltHotel: '{p} built a hotel on {space} (−₦{cost}).',
    logSoldHouse: '{p} sold a building on {space} (+₦{cost}).',
    buildEvenRule: 'Build evenly: you cannot build a second house on {space} while a sibling property in {group} has fewer.',
    transportRentNote: 'Rent depends on how many terminals you own.',
    utilityRentNote: 'Rent = 4× dice (one utility) or 10× dice (both).',

    /* Mortgage (bankruptcy flow) */
    mortgageTitle: 'Mortgage · Fi ṣe gbèsè',
    mortgageMsg: 'Mortgage {space} for ₦{amount}? A mortgaged property earns no rent until you lift the mortgage (₦{cost}).',
    btnMortgage: 'Mortgage · Fi ṣe gbèsè',
    unmortgageMsg: 'Lift the mortgage on {space} for ₦{cost}?',
    btnUnmortgage: 'Lift mortgage · San gbèsè',
    logMortgaged: '{p} mortgaged {space} for ₦{amount}.',
    logUnmortgaged: '{p} lifted the mortgage on {space} for ₦{amount}.',

    /* Bankruptcy / game over */
    bankruptTitle: 'Bankruptcy! · Ìsòro Owó!',
    bankruptMsg: '{p} cannot pay ₦{amount}. Sell buildings and mortgage properties, or the game ends.',
    btnSellBuilding: 'Sell building · Ta ilé',
    bankruptEnd: '{p} is bankrupt — {winner} wins the game!',
    overTurns: '100 turns reached — the highest Total Points wins!',
    winnerIs: 'Olùborí · Winner: {name}',
    tieResult: 'Both players are tied!',
    formula: 'Total Points = Cash + Property Value + Building Value + Jail Cards (₦50 each) − Debts (mortgages)',
    langUsed: 'Language · Èdè',
    dateLocale: 'en-GB',

    /* Space info bar */
    infoUnowned: '{space} · for sale at ₦{price}',
    infoOwned: '{space} · owned by {owner}',
    infoRent: 'rent ₦{amount}',
    infoJailCards: '{count} jail card(s)',

    
