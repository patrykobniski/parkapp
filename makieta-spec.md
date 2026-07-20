# Specyfikacja makiety funkcjonalnej UX

Ten dokument to **bazowe wytyczne** dla budowy każdej makiety funkcjonalnej UX w naszym zespole. Makieta powstaje na podstawie dokumentu wejściowego:

- **`copy.docx`** (WYMAGANE) — teksty strony (headline'y, paragrafy, CTA, FAQ itp.). Może też zawierać opis struktury — wtedy Cursor wyciąga z niego i treść, i architekturę.
- **`architektura.docx`** (OPCJONALNE) — osobny opis układu stron i sekcji. Jeśli istnieje, ma pierwszeństwo nad strukturą wywnioskowaną z `copy.docx`.

**Tryb domyślny: tylko `copy.docx`.** Grafik wrzuca jeden plik z treścią — Cursor sam czyta treść, wykrywa naturalną strukturę sekcji (hero, features, FAQ, kontakt itd.) i buduje kompletną makietę.

**Zasada: nic nie wymyślaj. Używaj wyłącznie treści z `copy.docx` (i `architektury.docx` jeśli jest).**

---

## 1. Cel makiety i kontekst pipeline'u

Makieta służy **wizualizacji** dla klienta i jednocześnie jest **bazą do produkcyjnej strony WordPress**. To kluczowy kontekst.

**Pipeline:**

```
copy.docx
   ↓ Cursor (ten projekt)
makieta statyczna HTML/CSS/JS
   ↓ klient akceptuje
deweloperzy (zespół wdrożeniowy)
   ↓ rozparcelowują makietę na bloki ACF + szablon WordPress
gotowa strona na produkcyjnym hostingu
```

**Twoje zadanie (Cursor) to środkowy etap.** Piszesz makietę tak, żeby deweloperzy mogli ją w 1-2 godziny przerobić na bloki ACF w naszym starterze WordPressa, bez przepisywania struktury od zera.

### Cele makiety

1. Pokazać klientowi kompletną strukturę strony (wszystkie sekcje, wszystkie teksty).
2. Zademonstrować zachowania interaktywne (hovery, animacje, stany).
3. Umożliwić klientowi zostawienie komentarzy do konkretnych elementów (moduł komentarzy — sekcja 9).
4. **Stać się 1:1 mapowalnym źródłem dla bloków ACF w produkcyjnym WP** — patrz sekcja 19 "Mapowanie na WordPress / ACF".

### Co makieta JEST, czego NIE jest

| Jest | NIE jest |
|---|---|
| Klikalnym prototypem dla klienta | Produkcyjną stroną |
| Wzorcem struktury HTML i klas BEM dla developera | Działającym CMS-em |
| Bazą stylów (CSS) gotową do konwersji na SCSS | Skompilowanym themem WP |
| Wszystkie sekcje w skali szarości (placeholder branding) | Strona w finalnej kolorystyce klienta |
| Wszystkie obrazy jako zaślepki `.placeholder-media` | Strona z prawdziwymi zdjęciami |

### Production-readiness — kluczowe zasady

Choć makieta jest "tylko wizualizacją", piszesz ją tak, żeby deweloper mógł ją przejąć z minimalnym wysiłkiem:

- **HTML semantyczny** — `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`. Hierarchia `<h1>` → `<h2>` → `<h3>` zachowana.
- **Każda sekcja makiety = jeden blok ACF.** `<section class="hero">...</section>` w HTML mapuje 1:1 na `template-parts/blocks/global/hero.php` u dewelopera.
- **Klasy BEM po nazwie bloku** — `.hero`, `.hero__title`, `.hero__title--placeholder`. Nie `.section`, nie `.section__title`. Każda sekcja ma swoją domain class odpowiadającą nazwie bloku ACF.
- **CSS przez tokeny, nie hardcoded values** — wszystkie kolory, fonty, spacing, radius zdefiniowane jako CSS custom properties z **nazwami identycznymi jak SCSS variables u dewelopera** (`--c-text`, `--c-gray-1`, `--bg-white`, `--b-gray-3`, `--global-radius`, `--btn-transition`, `--z-lvl-1`). Konwersja `var(--c-blue-2)` → `$c-blue-2` jest mechaniczna.
- **Pliki CSS per blok** — folder `styles/blocks/` zawiera plik `_<nazwa-bloku>.css` dla każdej sekcji. 1:1 mapuje na `assets/src/sass/blocks/_<nazwa-bloku>.scss` u dewelopera.
- **Pliki JS per blok** (gdy potrzebne interakcje) — folder `scripts/modules/` zawiera klasę `<Nazwa>` w pliku `<nazwa>.js`. 1:1 mapuje na `assets/src/js/modules/<nazwa>.js`.
- **Atrybuty `data-*` dla logiki JS** — `data-aos="fade-up"` (animacje), `data-slider`. Łatwo usunąć / zachować w produkcji.
- **Bez inline styles** poza wyjątkami uzasadnionymi technicznie.

Cel: deweloper bierze HTML, wycina kawałek `<section class="hero">...</section>`, opakowuje w PHP z `get_field()`, kopiuje `_hero.css` jako `_hero.scss`, dodaje `acf-json` na podstawie pól w HTML — i ma blok ACF gotowy.

---

## 2. Stack technologiczny

| Warstwa | Technologia | Dlaczego ta |
|---|---|---|
| HTML | **Statyczne pliki HTML5** — każda podstrona to folder z `index.html` | Pretty URLs `/o-nas`, działa wszędzie |
| Styling | **Native CSS z custom properties**, pliki podzielone wg konwencji WP theme | 1:1 mapping na SCSS dewelopera |
| JS | **Vanilla ES Modules**, klasy per moduł | 1:1 mapping na ich `assets/src/js/modules/` |
| Animacje | **AOS** (Animate On Scroll) przez CDN | Identyczna biblioteka co w ich themie |
| Slider | **Swiper** przez CDN | Identyczna biblioteka co w ich themie |
| Font | **DM Sans** przez Google Fonts | Domyślny font makietowy (deweloper podmieni na brand) |
| Komentarze | **`comments.js`** (vanilla, warstwa makietowa) | Niezależny od stack'u, nie ląduje w produkcji |

**ZABRONIONE:**
- `npm install` / `package.json` / `node_modules`
- Build step jakikolwiek (Vite, webpack, Next, Parcel)
- Tailwind (ani CDN ani CLI)
- React / Vue / Svelte / TypeScript
- jQuery (w makiecie — deweloper jej używa w produkcji, my nie potrzebujemy)
- Preprocesory CSS (Sass, Less) — native CSS pokrywa potrzeby, deweloper konwertuje przy adaptacji
- Lenis, GSAP, Embla — używamy AOS i Swiper zgodnie z konwencją zespołu

**Dependencje przez CDN — bezpośrednio w HTML:**

W `<head>`:
```html
<!-- Google Fonts: DM Sans -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap">

<!-- AOS - animacje scroll -->
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css">

<!-- Swiper (gdy potrzebny) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">

<!-- Twój styl -->
<link rel="stylesheet" href="/style.css">
```

Przed `</body>`:
```html
<!-- AOS -->
<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>

<!-- Swiper (gdy potrzebny) -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

<!-- Twój skrypt (ES Module — uwaga na atrybut type="module") -->
<script type="module" src="/script.js"></script>

<!-- Moduł komentarzy (NIE ląduje w produkcji) -->
<script src="/comments.js" data-project-id="nazwa-folderu-projektu" defer></script>
```

**Ścieżki:** wszystko z roota (`/style.css`, `/script.js`, `/comments.js`). Wymaga uruchomienia przez serwer HTTP (`npx serve .` lub Live Server). Otwarcie przez `file://` blokuje ES modules i fetch komentarzy.

---

## 3. Struktura projektu i URL-e

### URL-e (co widzi klient w pasku przeglądarki)

Strona ma **czyste URL-e bez `.html`**:

- `/` — strona główna
- `/o-nas` — podstrona "O nas"
- `/kontakt` — podstrona "Kontakt"
- `/oferta/audyt-strategiczny` — zagnieżdżona podstrona usługi
- `/blog/jak-zaprojektowac-strone` — pojedynczy wpis

Hierarchia URL odzwierciedla hierarchię informacji. Bez głębszych poziomów niż 2-3.

### Drzewo plików (po zbudowaniu)

```
/
├── index.html                              # URL: /
├── o-nas/
│   └── index.html                          # URL: /o-nas
├── oferta/
│   ├── index.html                          # URL: /oferta
│   └── audyt-strategiczny/
│       └── index.html                      # URL: /oferta/audyt-strategiczny
├── kontakt/
│   └── index.html                          # URL: /kontakt
├── polityka-prywatnosci/
│   └── index.html                          # placeholder
├── regulamin/
│   └── index.html                          # placeholder
│
├── style.css                               # Plik główny - lista @import url() do partials
├── styles/                                 # Mapuje 1:1 na assets/src/sass/ w WP theme
│   ├── abstracts/
│   │   └── _variables.css                  # custom properties = SCSS variables dewelopera
│   ├── base/
│   │   ├── _normalize.css
│   │   ├── _html.css                       # base font-size 62.5% (1rem = 10px)
│   │   ├── _typography.css
│   │   ├── _headings.css
│   │   ├── _links.css
│   │   ├── _lists.css
│   │   └── _images.css
│   ├── layout/
│   │   ├── _wrappers.css                   # .container
│   │   ├── _grid.css
│   │   └── _layout.css
│   ├── utilities/
│   │   ├── _spacing.css
│   │   ├── _display.css
│   │   ├── _align.css
│   │   ├── _colors.css
│   │   └── _transition.css
│   ├── components/
│   │   ├── _button.css                     # .btn, .btn--outline, .btn--ghost
│   │   ├── _accordion.css
│   │   ├── _field.css                      # pola formularza
│   │   └── _placeholder-media.css          # zaślepki obrazów
│   └── blocks/                             # 1 plik per blok ACF
│       ├── _site-header.css                # globalny (deweloper → header.php)
│       ├── _site-footer.css                # globalny (deweloper → footer.php)
│       ├── _hero.css
│       ├── _features.css
│       ├── _stats.css
│       ├── _testimonials.css
│       ├── _faq.css
│       ├── _contact.css
│       └── _cta-banner.css
│
├── script.js                               # Plik główny - bootstrap (= ich frontend.js)
├── scripts/
│   └── modules/                            # Mapuje 1:1 na assets/src/js/modules/
│       ├── mobile-menu.js
│       ├── accordion.js
│       ├── slider.js                       # gdy potrzebny Swiper
│       └── orphans.js                      # zapobieganie sierotom w nagłówkach
│
├── comments.js                             # Moduł komentarzy (NIE ląduje w produkcji)
│
├── assets/
│   ├── logo.svg                            # gdy grafik dostarczył
│   └── favicon.svg
│
├── KODER-HANDOFF.md                        # Generowany przez Cursor - mapping dla dewelopera
├── INICJALIZACJA.md                        # Generowany przez Cursor - prompt startowy kolejnych sesji
│
├── copy.docx                               # Input - w .gitignore
├── architektura.docx                       # Input (opcjonalny) - w .gitignore
├── _working/                               # Notatki Cursora - w .gitignore
│
├── .gitignore
├── README.txt                              # Opcjonalnie (zostaje z baseline)
├── .cursorrules                            # Pozostaje
├── makieta-spec.md                         # Pozostaje
└── comments/                               # Folder źródłowy (zostaje z baseline)
    ├── comments.js
    └── INSTRUKCJA.txt
```

### Plik `style.css` — tylko lista importów

`style.css` w roocie nie zawiera żadnych reguł — to wyłącznie lista `@import url()`. Kolejność identyczna jak w `frontend.scss` dewelopera (abstracts → base → layout → utilities → components → blocks):

```css
/* style.css — główny arkusz makiety */
/* Kolejność: abstracts → base → layout → utilities → components → blocks */
/* Mapuje 1:1 na frontend.scss WP theme */

/* Abstracts */
@import url("./styles/abstracts/_variables.css");

/* Base */
@import url("./styles/base/_normalize.css");
@import url("./styles/base/_html.css");
@import url("./styles/base/_typography.css");
@import url("./styles/base/_headings.css");
@import url("./styles/base/_links.css");
@import url("./styles/base/_lists.css");
@import url("./styles/base/_images.css");

/* Layout */
@import url("./styles/layout/_wrappers.css");
@import url("./styles/layout/_grid.css");
@import url("./styles/layout/_layout.css");

/* Utilities */
@import url("./styles/utilities/_spacing.css");
@import url("./styles/utilities/_display.css");
@import url("./styles/utilities/_align.css");
@import url("./styles/utilities/_colors.css");
@import url("./styles/utilities/_transition.css");

/* Components */
@import url("./styles/components/_button.css");
@import url("./styles/components/_accordion.css");
@import url("./styles/components/_field.css");
@import url("./styles/components/_placeholder-media.css");

/* Blocks (każda sekcja = osobny plik) */
@import url("./styles/blocks/_site-header.css");
@import url("./styles/blocks/_site-footer.css");
@import url("./styles/blocks/_hero.css");
@import url("./styles/blocks/_features.css");
/* ... dodajesz kolejne bloki */
```

**Uwaga:** `@import url()` w CSS robi sekwencyjne ładowanie. Akceptowalne w makiecie (lokalny serwer). Deweloper przy adaptacji do WP wstawia te same importy w `frontend.scss` (już bez `url()` i bez podkreślenia).

### Plik `script.js` — bootstrap modułów

`script.js` to plik z importami i inicjalizacją modułów. Mapuje na `assets/src/js/frontend.js` dewelopera:

```js
// script.js — główny bootstrap JS makiety (= frontend.js w WP theme)

import { MobileMenu } from './scripts/modules/mobile-menu.js';
import { Accordion } from './scripts/modules/accordion.js';
import { Slider } from './scripts/modules/slider.js';
import { Orphans } from './scripts/modules/orphans.js';

// Oznacz że JS jest aktywny - identycznie jak u deweloperów
document.documentElement.classList.add('js');

window.addEventListener('DOMContentLoaded', () => {
  // Inicjalizacja modułów
  new MobileMenu();
  new Accordion();
  new Slider();
  new Orphans();

  // AOS - identyczne parametry jak u deweloperów
  if (typeof AOS !== 'undefined') {
    AOS.init({ once: true, delay: 90, duration: 450, offset: 160, easing: 'ease-out' });
    requestAnimationFrame(() => AOS.refresh());
    setTimeout(() => AOS.refresh(), 150);
  }
});
```

### Linki w HTML — bez `.html`

```html
<a href="/">Strona główna</a>
<a href="/o-nas">O nas</a>
<a href="/oferta/audyt-strategiczny">Audyt strategiczny</a>
```

### Header i Footer — globalne, otoczone komentarzami

Header i footer powtarzają się na każdej podstronie. Dla łatwości synchronizacji (Cursor edytuje wszystkie naraz, ale komentarze pomagają ręcznym poprawkom):

```html
<!-- ===== SITE HEADER START — globalny, synchronizuj między podstronami ===== -->
<header class="site-header">
  ...
</header>
<!-- ===== SITE HEADER END ===== -->
```

Analogicznie footer. Deweloper trafia te elementy do `header.php` i `footer.php`, więc w makiecie traktuje się je jako "globalne", nie jako bloki ACF.

---

## 4. Design tokens (CSS custom properties = SCSS variables dewelopera)

Cała makieta operuje **wyłącznie na skali szarości**. Tokeny w `styles/abstracts/_variables.css`:

```css
/* styles/abstracts/_variables.css
 *
 * Mapowanie na abstracts/_variables.scss dewelopera:
 *   var(--c-text)        →  $c-text
 *   var(--c-gray-1)      →  $c-gray-1
 *   var(--bg-white)      →  $bg-white
 *   var(--global-radius) →  $global-radius
 *
 * W produkcji deweloper podmieni te kolory na branding klienta.
 */

:root {
  /* ===== Skala szarości ===== */
  --white: #ffffff;
  --black: #18181b;
  --gray-1: #8C8F98;
  --gray-2: #3B3E43;
  --gray-3: #D6D8DB;
  --gray-4: #F5F5F5;

  /* ===== Role: kolory tekstu ===== */
  --c-text: var(--black);
  --c-white: var(--white);
  --c-gray-1: var(--gray-1);
  --c-gray-2: var(--gray-2);
  --c-gray-3: var(--gray-3);

  /* ===== Role: tła ===== */
  --bg-white: var(--white);
  --bg-black: var(--black);
  --bg-gray-3: var(--gray-3);
  --bg-gray-4: var(--gray-4);

  /* ===== Role: bordery ===== */
  --b-black: var(--black);
  --b-white: var(--white);
  --b-gray-1: var(--gray-1);
  --b-gray-2: var(--gray-2);
  --b-gray-3: var(--gray-3);

  /* ===== Akcent (CTA, focus) — w makiecie też szary ===== */
  --c-accent: var(--black);
  --c-accent-hover: var(--gray-2);
  --c-accent-fg: var(--white);

  /* ===== Walidacja (jedyny "kolor") ===== */
  --c-error: #ef4444;

  /* ===== Typografia ===== */
  --f-primary: 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --main-family: var(--f-primary);

  /* ===== Tranzycje (identycznie jak w SCSS dewelopera) ===== */
  --btn-transition: all 200ms linear;
  --overlay-transition: all 300ms ease-in;
  --transition-fast: all 150ms linear;
  --transition: all 200ms linear;
  --transition-slow: all 400ms linear;

  /* ===== Z-index (identycznie jak w SCSS dewelopera) ===== */
  --z-lvl-1: 100;
  --z-lvl-2: 200;
  --z-lvl-3: 300;
  --z-lvl-4: 400;
  --z-lvl-5: 500;

  /* ===== Nawigacja ===== */
  --nav: 126px;
  --nav-top: 48px;
  --nav-bottom: 78px;

  /* ===== Border radius =====
   * Standard makietowy: 8px - wyraźne, ale nienarzucające się zaokrąglenie.
   * Deweloper przy adaptacji ustawia $global-radius: 8px (lub wg brandu klienta). */
  --global-radius: 8px;

  /* ===== Spacing makietowy (dodatkowe, nie ma u deweloperów - dodadzą gdy zechcą) ===== */
  --space-section:        100px;
  --space-section-md:     72px;
  --space-section-sm:     56px;
  --space-section-inner:    64px;
  --space-section-inner-md: 48px;
  --space-section-inner-sm: 40px;
}
```

**Konwencja nazewnictwa:**
- Skala szarości: `--gray-1`...`--gray-4` (jak w SCSS dewelopera)
- Role: prefiksy `--c-` (text/color), `--bg-` (background), `--b-` (border)
- **Konwersja na SCSS jest mechaniczna:** `var(--c-text)` → `$c-text`, `var(--bg-white)` → `$bg-white`

### Breakpointy (identyczne wartości jak u dewelopera)

```css
/* Media queries używamy bezpośrednio. Wartości z $breakpoints u dewelopera:
 *   small:   416px
 *   medium:  768px
 *   large:   1024px
 *   xlarge:  1280px
 *   display: 1440px
 *   full:    1600px
 *   retina:  2500px
 */

/* Min-width media queries */
@media (min-width: 416px)  { /* small */ }
@media (min-width: 768px)  { /* medium */ }
@media (min-width: 1024px) { /* large */ }
@media (min-width: 1280px) { /* xlarge */ }
@media (min-width: 1440px) { /* display */ }
@media (min-width: 1600px) { /* full */ }
```

Deweloper konwertuje na ich mixiny: `@media (min-width: 1024px)` → `@include bp(large)`.

---

## 5. Typografia

### Base font-size 62.5% (konwencja "1rem = 10px")

To kluczowa konwencja zespołu dewelopera — `html { font-size: 62.5% }`, dzięki czemu `1rem = 10px`. Cała typografia w `rem` jest łatwa do liczenia (`1.6rem = 16px`, `2.4rem = 24px`, `4.8rem = 48px`).

W `styles/base/_html.css`:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 62.5%;
  line-height: 1.625;
  min-height: 100%;
  overflow-y: scroll;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  scroll-behavior: smooth;
}
html.no-scroll { overflow-y: hidden; }

body {
  font-family: var(--main-family);
  color: var(--c-text);
  font-weight: 400;
  font-size: 1.6rem;
  overflow-x: hidden;
}
```

### Skala typograficzna

| Element | Klasa | Rozmiar (rem = px) | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Display / Hero H1 | `.h-display` | `clamp(4rem, 5vw, 7.2rem)` | 600 | -0.03em | 1.05 |
| H1 sekcji | `.h-1` | `clamp(3.2rem, 3.5vw, 4.8rem)` | 600 | -0.02em | 1.1 |
| H2 | `.h-2` | `clamp(2.4rem, 2.5vw, 3.2rem)` | 600 | -0.015em | 1.2 |
| H3 | `.h-3` | `2rem` | 600 | -0.01em | 1.3 |
| H4 | `.h-4` | `1.8rem` | 500 | 0 | 1.4 |
| Lead | `.lead` | `clamp(1.8rem, 1.5vw, 2rem)` | 400 | 0 | 1.5 |
| Body | (domyślny) | `1.6rem` | 400 | 0 | 1.625 |
| Small | `.small` | `1.4rem` | 400 | 0 | 1.5 |
| Eyebrow | `.eyebrow` | `1.2rem` | 500 | 0.08em, `uppercase` | 1 |

W `styles/base/_headings.css`:
```css
.h-display { font-size: clamp(4rem, 5vw, 7.2rem); font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; }
.h-1       { font-size: clamp(3.2rem, 3.5vw, 4.8rem); font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
.h-2       { font-size: clamp(2.4rem, 2.5vw, 3.2rem); font-weight: 600; letter-spacing: -0.015em; line-height: 1.2; }
.h-3       { font-size: 2rem; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3; }
.h-4       { font-size: 1.8rem; font-weight: 500; line-height: 1.4; }
```

W `styles/base/_typography.css`:
```css
.lead    { font-size: clamp(1.8rem, 1.5vw, 2rem); line-height: 1.5; color: var(--c-gray-2); }
.small   { font-size: 1.4rem; line-height: 1.5; }
.eyebrow { font-size: 1.2rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--c-gray-1); line-height: 1; }
```

### Sieroty językowe

Plik `scripts/modules/orphans.js`:
```js
export class Orphans {
  constructor() {
    document.querySelectorAll('h1, h2, h3, [data-noorphans]').forEach((el) => {
      if (el.dataset.noorphansApplied) return;
      el.innerHTML = el.innerHTML.replace(
        /\s(a|i|o|u|w|z|na|do|od|po|ze|że|lub|ani|jak|ale|gdy|bo|już|też|nie|or|an|I)\s/gi,
        (match, word) => ` ${word}\u00A0`
      );
      el.dataset.noorphansApplied = '1';
    });
  }
}
```

Wywoływany w `script.js` przez `new Orphans()`. Załatwia to automatycznie na wszystkich nagłówkach H1-H3.

---

## 6. Container i breakpointy

Container max-width **1440px**, padding 40px po bokach na desktop. **Content width 1360px.**

`styles/layout/_wrappers.css`:
```css
.container {
  width: 100%;
  max-width: 1440px;
  margin-inline: auto;
  padding-inline: 20px;
}
@media (min-width: 768px) {
  .container { padding-inline: 32px; }
}
@media (min-width: 1024px) {
  .container { padding-inline: 40px; }
}
```

Klasę `.container` używamy identycznie jak deweloperzy — to standard w ich szablonach (zobacz `hero.php`: `<div class="container hero__inner">`).

---

## 7. Komponenty (pliki w `styles/components/`)

### Button — `styles/components/_button.css`

Klasy zgodne z konwencją dewelopera (`.btn`, `.btn--outline`, `.btn--ghost`, `.btn--sm`, `.btn--lg`, `.btn--block`):

```css
/* ==========================================================================
   #BUTTONS
   - .btn            → przycisk podstawowy (primary)
   - .btn--outline   → obrys, wypełnienie na hover
   - .btn--light     → jasny (na ciemnym tle)
   - .btn--ghost     → bez tła i obrysu
   - .btn--sm | --lg → rozmiar
   - .btn--block     → pełna szerokość
========================================================================== */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  font-family: var(--main-family);
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  border-radius: var(--global-radius);
  cursor: pointer;
  transition: var(--btn-transition);
  border: 1px solid transparent;

  /* Primary - tło accent */
  color: var(--c-accent-fg);
  background-color: var(--c-accent);
  border-color: var(--c-accent);
}
.btn:hover {
  background-color: var(--c-accent-hover);
  border-color: var(--c-accent-hover);
}
.btn:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
}

.btn--outline {
  color: var(--c-accent);
  background-color: transparent;
  border-color: var(--c-accent);
}
.btn--outline:hover {
  color: var(--c-accent-fg);
  background-color: var(--c-accent);
}

.btn--light {
  color: var(--c-accent);
  background-color: var(--c-white);
  border-color: var(--c-white);
}
.btn--light:hover {
  background-color: var(--c-gray-3);
}

.btn--ghost {
  color: var(--c-accent);
  background-color: transparent;
  border-color: transparent;
  padding-left: 8px;
  padding-right: 8px;
}
.btn--ghost:hover {
  background-color: var(--bg-gray-4);
}

.btn--sm { padding: 10px 18px; font-size: 1.4rem; }
.btn--lg { padding: 18px 36px; font-size: 1.8rem; }
.btn--block { display: flex; width: 100%; }

.btn[disabled],
.btn.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

### Accordion — `styles/components/_accordion.css`

```css
.accordion__item {
  border-bottom: 1px solid var(--b-gray-3);
}
.accordion__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  cursor: pointer;
  list-style: none;
  font-size: 1.7rem;
  font-weight: 500;
  color: var(--c-text);
  transition: var(--transition);
}
.accordion__trigger::-webkit-details-marker { display: none; }
.accordion__item[open] .accordion__icon { transform: rotate(180deg); }
.accordion__icon { transition: transform 200ms ease; }
.accordion__content { padding: 0 0 20px; color: var(--c-gray-2); }
```

HTML używa natywnego `<details>/<summary>`:
```html
<div class="accordion">
  <details class="accordion__item">
    <summary class="accordion__trigger">
      <span>Pytanie z copy.docx</span>
      <svg class="accordion__icon" ...></svg>
    </summary>
    <div class="accordion__content"><p>Odpowiedź z copy.docx.</p></div>
  </details>
</div>
```

### Field — `styles/components/_field.css`

```css
.field { display: flex; flex-direction: column; gap: 6px; }
.field__label { font-size: 1.4rem; font-weight: 500; color: var(--c-text); }
.field__input,
.field__textarea {
  font-family: inherit;
  font-size: 1.6rem;
  padding: 12px 14px;
  background: var(--bg-white);
  border: 1px solid var(--b-gray-3);
  border-radius: var(--global-radius);
  color: var(--c-text);
  transition: border-color 150ms ease, box-shadow 150ms ease;
  width: 100%;
}
.field__input:hover,
.field__textarea:hover { border-color: var(--c-gray-1); }
.field__input:focus,
.field__textarea:focus {
  outline: none;
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.1);
}
.field__input.has-error,
.field__textarea.has-error { border-color: var(--c-error); }
```

### Placeholder media — `styles/components/_placeholder-media.css`

```css
.placeholder-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--bg-gray-4);
  border: 1px solid var(--b-gray-3);
  border-radius: var(--global-radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}
.placeholder-media--ratio-1\/1 { aspect-ratio: 1 / 1; }
.placeholder-media--ratio-4\/3 { aspect-ratio: 4 / 3; }
.placeholder-media--ratio-21\/9 { aspect-ratio: 21 / 9; }
.placeholder-media__icon { width: 40px; height: 40px; color: var(--c-gray-1); margin-bottom: 8px; }
.placeholder-media__label { font-size: 1.4rem; color: var(--c-gray-1); margin: 0; font-weight: 500; }
.placeholder-media__hint { font-size: 1.2rem; color: var(--c-gray-1); margin: 4px 0 0; opacity: 0.7; }
```

HTML:
```html
<div class="placeholder-media" aria-label="Placeholder dla zdjęcia bohatera sekcji">
  <svg class="placeholder-media__icon" ...><!-- Image icon --></svg>
  <p class="placeholder-media__label">PHOTO</p>
  <p class="placeholder-media__hint">Krótki opis co tu będzie</p>
</div>
```

---

## 7a. Bloki ACF (pliki w `styles/blocks/`)

**Każda sekcja makiety = jeden plik CSS w `styles/blocks/_<nazwa>.css` = jeden blok ACF u dewelopera.**

Konwencja nazewnictwa: BEM-like, klasa zewnętrzna = nazwa bloku.

### Przykład: Hero — `styles/blocks/_hero.css`

```css
/* ==========================================================================
   #HERO (blok ACF)
   Mapuje na: template-parts/blocks/global/hero.php
   ========================================================================== */

.hero {
  padding: 48px 0;
}
@media (min-width: 1024px) {
  .hero { padding: 96px 0; }
}

.hero__inner {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
@media (min-width: 1024px) {
  .hero__inner { flex-direction: row; align-items: center; gap: 64px; }
}

.hero__content { flex: 1; }
.hero__title { margin-bottom: 16px; }
.hero__title--placeholder { opacity: 0.4; }
.hero__subtitle { margin-bottom: 24px; font-size: 1.8rem; color: var(--c-gray-2); }
.hero__media { flex: 1; }
.hero__image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--global-radius);
}
```

**To jest 1:1 ten sam plik co `assets/src/sass/blocks/_hero.scss` u dewelopera** — różnice tylko w syntaxie (`var(--c-gray-2)` vs `$c-gray-2`, `@media (min-width: 1024px)` vs `@include bp(large)`).

### HTML Hero (sekcja w `index.html`)

Identyczna struktura BEM jak w PHP dewelopera:

```html
<section class="hero" data-aos="fade-up">
  <div class="container hero__inner">
    <div class="hero__content">
      <p class="eyebrow">Eyebrow z copy.docx</p>
      <h1 class="hero__title h-display">Tytuł hero z copy.docx</h1>
      <div class="hero__subtitle">
        <p>Lead pod headline'em z copy.docx.</p>
      </div>
      <a class="hero__button btn" href="/kontakt">CTA z copy.docx</a>
    </div>
    <div class="hero__media">
      <div class="hero__image placeholder-media" aria-label="Placeholder dla zdjęcia hero">
        <svg class="placeholder-media__icon" ...></svg>
        <p class="placeholder-media__label">PHOTO</p>
        <p class="placeholder-media__hint">Co tu będzie</p>
      </div>
    </div>
  </div>
</section>
```

### Konwencja klas BEM per blok

| Blok | Główna klasa | Elementy |
|---|---|---|
| Hero | `.hero` | `.hero__inner`, `.hero__content`, `.hero__title`, `.hero__subtitle`, `.hero__media`, `.hero__image` |
| Features | `.features` | `.features__inner`, `.features__header`, `.features__title`, `.features__grid`, `.features__card`, `.features__card-icon`, `.features__card-title`, `.features__card-text` |
| Stats | `.stats` | `.stats__inner`, `.stats__item`, `.stats__number`, `.stats__label` |
| Testimonials | `.testimonials` | `.testimonials__inner`, `.testimonials__item`, `.testimonials__quote`, `.testimonials__author` |
| FAQ | `.faq` | `.faq__inner`, `.faq__header`, `.faq__accordion` (zawiera `.accordion`) |
| Contact | `.contact` | `.contact__inner`, `.contact__info`, `.contact__form` |
| CTA Banner | `.cta-banner` | `.cta-banner__inner`, `.cta-banner__title`, `.cta-banner__actions` |
| Header | `.site-header` | `.site-header__inner`, `.site-header__logo`, `.site-header__nav`, `.site-header__cta`, `.site-header__hamburger` |
| Footer | `.site-footer` | `.site-footer__inner`, `.site-footer__col`, `.site-footer__bottom` |

**Modyfikatory** — używaj dwóch myślników: `.hero--centered`, `.features--zigzag`, `.cta-banner--dark`.

---

## 8. Stany interaktywne

Każdy element interaktywny musi mieć: default, hover, focus-visible, active, (disabled gdy dotyczy).

- Tranzycje: `var(--btn-transition)` lub `var(--transition)` (200ms linear) — zgodnie z konwencją dewelopera
- Focus visible: `outline: 2px solid var(--c-accent); outline-offset: 2px` — jak w ich `_button.scss`
- Disabled: `opacity: 0.5; pointer-events: none` — jak u nich
- Mobile (touch): hover może być wyciszony

---

## 9. Moduł komentarzy klienta

**Moduł jest gotowy** w `comments/comments.js`. NIE implementuj własnej wersji.

### Cel modułu

Pozwolić klientowi zostawiać komentarze do konkretnych elementów makiety (jak w Figmie). Działa wyłącznie na etapie makiety — **nie trafia do produkcyjnego WP**.

### Podpięcie (3 kroki)

**Krok 1.** Skopiuj `comments/comments.js` do roota jako `comments.js`:
```bash
cp comments/comments.js comments.js
```

**Krok 2.** W KAŻDYM pliku HTML, bezpośrednio przed `</body>`, dodaj:
```html
<script src="/comments.js" data-project-id="nazwa-folderu-projektu" defer></script>
```
`nazwa-folderu-projektu` musi być identyczna we wszystkich podstronach.

**Krok 3.** Dodaj w `styles/base/_html.css` (jeśli nie ma):
```css
body { position: relative; }
```

### Funkcje (do Twojej wiadomości, nic nie musisz robić)

- FAB w prawym dolnym rogu, trzy tryby: OFF → VIEW → ADD
- Pin z numerem przyklejony do elementu DOM (zakotwiczenie przez selektor CSS — działa przy resize)
- Wątki, odpowiedzi (jako "Klient" lub "JAAQOB"), status "Zakończony"
- Soft-delete z retencją 30 dni
- Synchronizacja z serwerem (`https://ux.dev-jaaqob.pl/comments.php`)
- localStorage cache
- Responsywne, obsługa klawiatury, `prefers-reduced-motion`
- Wszystkie klasy mają prefix `mk-c-*` — zero kolizji z makietą

### Co się dzieje przy adaptacji do WP

Deweloper **NIE kopiuje** `comments.js` do produkcyjnego theme. Moduł komentarzy to artefakt etapu makiety. Po deployu makieta jest zastępowana produkcyjnym WP-em.

---

## 10. Animacje — AOS, BEZ GLOW/BLUR

Używamy **AOS** (Animate On Scroll) — identyczna biblioteka co u dewelopera. Wartości init też identyczne.

### Section Reveal — `data-aos="fade-up"`

Każda sekcja (poza hero) dostaje atrybut `data-aos="fade-up"`. AOS sam zajmuje się resztą:

```html
<section class="features" data-aos="fade-up">
  ...
</section>
```

AOS automatycznie aplikuje:
- Start: `opacity: 0; transform: translateY(16px);`
- End: `opacity: 1; transform: translateY(0);`
- Duration: 450ms, easing: ease-out, once: true

**WAŻNE: NIE używamy `filter: blur(...)` ani efektu glow w reveal.** AOS daje czyste fade + slide-up, bez poświaty. Tak ma być.

### Wejście elementów wewnątrz sekcji — lekki stagger od dołu

Oprócz reveal całej sekcji, **kluczowe elementy wewnątrz sekcji dostają własne `data-aos="fade-up"` z narastającym opóźnieniem**. Dzięki temu treść "wchodzi" od dołu falami, a nie jednym blokiem:

```html
<section class="features" data-aos="fade-up">
  <div class="container features__inner">
    <header class="features__header" data-aos="fade-up">
      <p class="eyebrow">Eyebrow z copy</p>
      <h2 class="h-1">Tytuł sekcji z copy</h2>
    </header>
    <div class="features__grid">
      <article class="features__card" data-aos="fade-up" data-aos-delay="0">...</article>
      <article class="features__card" data-aos="fade-up" data-aos-delay="80">...</article>
      <article class="features__card" data-aos="fade-up" data-aos-delay="160">...</article>
      <article class="features__card" data-aos="fade-up" data-aos-delay="240">...</article>
    </div>
  </div>
</section>
```

Zasady staggera:
- Nagłówek sekcji (eyebrow + tytuł + lead) bez opóźnienia lub z `data-aos-delay="0"`
- Karty / kolumny / elementy list: krok **80ms** (`0`, `80`, `160`, `240`...), maksymalnie **320ms** — przy większej liczbie elementów kolejne wracają do `0` (i tak są już poniżej viewportu)
- Animacja ma być **lekka i szybka** — tylko `opacity` + `translateY` z globalnych ustawień AOS (450ms). Bez powiększania duration, bez blur, bez glow
- Slajdy wewnątrz Swipera NIE dostają `data-aos` (kolizja z transformacjami slidera)
- Hero: sam blok bez `data-aos`, ale elementy wewnątrz hero (eyebrow, tytuł, lead, CTA) mogą dostać stagger `0/80/160/240` — strona "ożywa" od razu po załadowaniu

### Init AOS w `script.js`

```js
// W script.js — w window load callback
if (typeof AOS !== 'undefined') {
  AOS.init({ once: true, delay: 90, duration: 450, offset: 160, easing: 'ease-out' });
  requestAnimationFrame(() => AOS.refresh());
  setTimeout(() => AOS.refresh(), 150);
}
```

To **identyczne parametry** co w `assets/src/js/frontend.js` u dewelopera. Bez modyfikacji.

### Wyłącznik ruchu — `prefers-reduced-motion`

```css
/* styles/utilities/_transition.css */
@media (prefers-reduced-motion: reduce) {
  .js [data-aos] {
    transition: none;
    transform: none !important;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Klasa `.js` jest dodawana do `<html>` przez `script.js` (`document.documentElement.classList.add('js')`) — bez JS treść pozostaje widoczna.

### Hover na buttonach — bez efektu "magnetic"

Buttony i klikalne karty mają standardowe stany hover z tokenów (`--btn-transition`, zmiana tła/koloru, ewentualnie subtelny lift `translateY(-2px)` na kartach). **NIE stosujemy efektu magnetic hover** (przycisk podążający za kursorem) — ruch elementu pod kursorem jest odbierany jako niestabilny i nie ma odpowiednika w produkcyjnym themie dewelopera.

### Smooth scroll

Natywny CSS `html { scroll-behavior: smooth; }` w `_html.css`. Bez Lenis (deweloper go nie używa).

---

## 11. Slider — Swiper

Gdy w sekcji 5+ kart nie mieści się w gridzie 1360px — **slider Swiper**. Identyczna biblioteka co u dewelopera.

### HTML

```html
<div class="swiper testimonials__slider">
  <div class="swiper-wrapper">
    <div class="swiper-slide testimonials__item">...</div>
    <div class="swiper-slide testimonials__item">...</div>
    <div class="swiper-slide testimonials__item">...</div>
  </div>
  <div class="swiper-button-prev"></div>
  <div class="swiper-button-next"></div>
  <div class="swiper-pagination"></div>
</div>
```

### JS — `scripts/modules/slider.js`

```js
export class Slider {
  constructor() {
    if (typeof Swiper === 'undefined') return;
    document.querySelectorAll('.swiper').forEach((el) => {
      if (el.dataset.sliderBound) return;
      new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 24,
        speed: 800,
        breakpoints: {
          768:  { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
        navigation: {
          nextEl: el.querySelector('.swiper-button-next'),
          prevEl: el.querySelector('.swiper-button-prev'),
        },
        pagination: {
          el: el.querySelector('.swiper-pagination'),
          clickable: true,
        },
      });
      el.dataset.sliderBound = '1';
    });
  }
}
```

---

## 12. Header, nawigacja, stopka

### Header — `styles/blocks/_site-header.css`

Sticky z subtelnym `is-scrolled` state.

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: var(--z-lvl-4);
  background: var(--bg-white);
  padding-block: 20px;
  border-bottom: 1px solid transparent;
  transition: padding-block 200ms ease, background-color 200ms, border-color 200ms;
}
.site-header.is-scrolled {
  padding-block: 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom-color: var(--b-gray-3);
}
.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}
.site-header__logo { display: block; }
.site-header__logo img { display: block; height: 32px; width: auto; }
.site-header__nav { display: none; }
@media (min-width: 1024px) { .site-header__nav { display: flex; gap: 32px; align-items: center; } }
.site-header__nav a {
  font-size: 1.5rem;
  color: var(--c-text);
  text-decoration: none;
  transition: var(--transition);
}
.site-header__nav a:hover { color: var(--c-gray-2); }
.site-header__hamburger { display: flex; flex-direction: column; gap: 4px; background: transparent; border: 0; padding: 8px; cursor: pointer; }
.site-header__hamburger span { display: block; width: 24px; height: 2px; background: var(--c-text); transition: var(--transition); }
@media (min-width: 1024px) { .site-header__hamburger { display: none; } }
```

`is-scrolled` aplikujemy przez moduł w `scripts/modules/header-scroll.js` (lub bezpośrednio w `script.js`).

### Mobile menu — `scripts/modules/mobile-menu.js`

```js
export class MobileMenu {
  constructor() {
    const trigger = document.querySelector('.site-header__hamburger');
    const menu = document.querySelector('#mobile-menu');
    if (!trigger || !menu) return;
    
    const close = () => {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('no-scroll');
    };
    const open = () => {
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('no-scroll');
    };
    
    trigger.addEventListener('click', () => menu.hidden ? open() : close());
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
}
```

(Zauważ: `no-scroll` na `<html>` — to ta sama konwencja co w `_html.scss` dewelopera: `html.no-scroll { overflow-y: hidden; }`.)

### Mega-menu na hover

- 6+ podstron lub podkategorie → mega-menu pełna szerokość
- 2-5 podstron → mały dropdown (200-280px)
- Hover, nie klik, 200ms delay na mouseleave

### Footer — `styles/blocks/_site-footer.css`

Globalny blok, ciemny (`var(--bg-black)`). Jeśli `copy.docx` zawiera stopkę — używaj. Jeśli nie — wygeneruj standardową (kolumna logo+tagline, kolumna nawigacja, kolumna kategorie, kolumna kontakt, dolny pasek z copyright i linkami `/polityka-prywatnosci` + `/regulamin`).

---

## 13. Reguły językowe

- Domyślnie polski. Wszystkie komunikaty UI po polsku.
- `copy.docx` po angielsku → cały UI po angielsku.
- `<html lang="pl">` lub `<html lang="en">` zgodnie z językiem treści.

---

## 14. Sekcje — warianty layoutów i antyszablonowość

**ZASADA NADRZĘDNA: NIE BĄDŹ SZABLONOWY.** Makieta złożona wyłącznie z "wycentrowany nagłówek + grid 3 kart" wygląda jak generator, nie jak projekt. Każda sekcja ma kilka wariantów — wybieraj świadomie na podstawie treści i rotuj między sekcjami.

Wybór wariantu na podstawie treści:
- 4 krótkie punkty → grid 2×2, 4-w-rzędzie albo bento
- 3 długie opisy → split zig-zag (tekst + obraz naprzemiennie)
- 1 cytat → centered z dużą typografią
- proces / kroki → pozioma oś czasu albo numerowana lista edytorska
- dane liczbowe → duża typografia liczb, nie małe karty

### Hero
A — Centered (h-display + lead + CTA + obraz pod CTA)
B — Split 50/50 (tekst lewy, obraz prawy)
C — Split z offsetem (tekst 5/12, obraz 7/12)
D — Full-bleed (obraz tła, overlay, tekst centered)
E — Edytorski (bardzo duży h-display na 10/12 szerokości, lead i CTA pod spodem w dwóch kolumnach, obraz full-width niżej)
F — Z nakładką (obraz 8/12 z prawej, karta tekstowa nachodząca na obraz z lewej, `position: relative` + ujemny margines)

### Features
A — Grid 3 lub 4 kolumny kart
B — Split zig-zag (rzędy: tekst + obraz na zmianę)
C — Sidebar + karty (sticky nagłówek/obraz po lewej, stos kart po prawej)
D — Grid 2×2 dużych kart
E — **Bento grid** (karty o różnych rozmiarach: jedna 2×2, pozostałe 1×1; najważniejsza cecha dostaje największe pole)
F — **Lista edytorska z numeracją** (01, 02, 03 dużą, cienką typografią po lewej; tytuł + opis po prawej; separatory poziome — dobra dla 3-6 dłuższych opisów)
G — **Naprzemienne szerokości** (rzędy 7/12+5/12, potem 5/12+7/12 — rytm bez pełnej symetrii)

### Proces / kroki
A — Pozioma oś czasu z numerami i linią łączącą
B — Pionowa oś po lewej (linia + kropki), treść kroków po prawej
C — Karty-kroki ze strzałkami/numeracją, grid albo slider
D — Sticky-scroll: numer i tytuł kroku sticky po lewej, opisy przewijają się po prawej

### Contact
A — Split 50/50 (info + formularz, **wyrównane wysokością**)
B — Formularz centered + dane pod spodem w trzech kartach
C — Split z dwiema osobami kontaktu (5/12) + formularz (7/12)
D — Full-width dark, formularz centered

### Stats
A — 4 w rzędzie z separatorem pionowym
B — 2×2 grid z kartami i kontekstem
C — Pasek wpleciony między sekcjami, dark, biały tekst
D — **Duża typografia** (liczby w skali h-display, etykiety small pod spodem; asymetrycznie, np. 2 duże + 2 mniejsze)

### Testimonials
A — Duży cytat centered, italic
B — Grid 2-3 kolumny kart
C — Logo wall + jeden wyróżniony cytat
D — Cytat na całą szerokość + pasek z avatarami/logo pod spodem

### FAQ
A — Centered accordion (max-width 800px)
B — Split: pytania klikalne po lewej, treść aktywnego po prawej (sticky)
C — Dwie kolumny accordionów (przy 8+ pytaniach)

### CTA banner
A — Pełna szerokość dark
B — Karta dark w kontenerze (border-radius)
C — Split: tekst + obraz
D — Karta z obrazem-tłem (placeholder-media pod spodem, overlay, tekst i CTA na wierzchu)

### Zasady antyszablonowe (twarde)

1. **Maksymalnie 2 sekcje z rzędu w układzie "wycentrowany nagłówek + symetryczny grid".** Trzecia z rzędu MUSI złamać schemat: split, zig-zag, bento, lista edytorska, sticky, asymetria.
2. **Minimum 1/3 sekcji na stronie głównej w wariantach asymetrycznych lub edytorskich** (E/F/G z Features, D ze Stats, sticky z Procesu itd.).
3. **Rotuj osie:** po sekcji z obrazem po prawej następna sekcja z obrazem daje go po lewej.
4. **Rotuj tła:** `bg-white` ↔ `bg-gray-4` ↔ okazjonalnie `bg-black` (dark). Nie więcej niż 2 sekcje z rzędu na tym samym tle.
5. **Różnicuj gęstość:** po gęstej sekcji (grid 4 kart) daj oddech (duży cytat, stats z dużą typografią, CTA).
6. **Nakładki i przełamania siatki są dozwolone** — karta nachodząca na obraz, obraz wystający poza container (`margin-inline: calc(-1 * ...)` albo grid full-bleed), element przekraczający granicę dwóch sekcji. Warunek: czysty, standalone CSS bloku, bez łamania mapowania na ACF.
7. **Asymetria świadoma:** 4/12+8/12, 5/12+7/12, 7/12+5/12 — nie tylko 6/12+6/12.
8. Kreatywność dotyczy WYŁĄCZNIE układu. Treść (teksty, kolejność informacji) pozostaje 1:1 z copy.docx, skala szarości i tokeny obowiązują bez wyjątków.

### Przykładowa rotacja (strona główna)

Hero split z offsetem (C) → Features bento (E) → Stats duża typografia (D) → Proces sticky-scroll (D) → Testimonials cytat + logo (C) → FAQ split (B) → CTA karta z obrazem-tłem (D). **Unikaj powtórzeń między sąsiednimi stronami** — podstrona oferty nie kopiuje układu strony głównej sekcja po sekcji.

### Wyrównywanie wysokości

Kiedy dwa bloki obok siebie — wysokość MUSI się pokrywać. CSS Grid lub Flexbox z `align-items: stretch`. Asymetria świadoma (4/12 + 8/12, 5/12 + 7/12, 6/12 + 6/12).

---

## 15. Checklist finalny

Przed zakończeniem sprawdź:

- [ ] Każda sekcja z `copy.docx` (i `architektura.docx` jeśli istnieje) jest zbudowana
- [ ] Każdy tekst z `copy.docx` jest umieszczony (nic nie zostało, nic nie dodałeś od siebie)
- [ ] Jeśli nie było `architektura.docx` — `_working/architektura-wywnioskowana.md` opisuje decyzje
- [ ] Każdy URL podstrony działa (`/`, `/o-nas`, `/oferta/audyt-strategiczny` itd.)
- [ ] Linki w nawigacji NIE zawierają `.html` ani `/index`
- [ ] **Każda sekcja makiety ma swój plik CSS w `styles/blocks/_<nazwa>.css`** (1:1 mapping na blok ACF dewelopera)
- [ ] **Klasy BEM zgodne z konwencją zespołu** — `.hero`, `.hero__title`, nie `.section--hero`
- [ ] **Wszystkie kolory przez `var(--c-*)`, `var(--bg-*)`, `var(--b-*)`** — żadnych hex w plikach blocks
- [ ] `style.css` zawiera `@import url()` dla każdego pliku w `styles/`, kolejność abstracts→base→layout→utilities→components→blocks
- [ ] `script.js` używa `<script type="module">` i importuje moduły z `scripts/modules/`
- [ ] Każdy moduł JS to klasa eksportowana, instancjonowana w `script.js`
- [ ] AOS zainicjalizowany z `{ once: true, delay: 90, duration: 450, offset: 160, easing: 'ease-out' }` — IDENTYCZNIE jak u dewelopera
- [ ] Każda `<section>` (poza hero) ma `data-aos="fade-up"`
- [ ] Kluczowe elementy wewnątrz sekcji (karty, kolumny, nagłówki) mają `data-aos="fade-up"` ze staggerem `data-aos-delay` (krok 80ms, max 320ms)
- [ ] NIE używasz `filter: blur()` ani glow w animacjach
- [ ] NIE używasz efektu magnetic hover (button podążający za kursorem) — standardowe stany hover z tokenów
- [ ] Zasady antyszablonowe z sekcji 14 spełnione: max 2 sekcje z rzędu "centered header + grid", min 1/3 sekcji home w wariantach asymetrycznych/edytorskich, rotacja teł i osi
- [ ] Swiper podłączony gdzie potrzebny (`.swiper`, `.swiper-wrapper`, `.swiper-slide`)
- [ ] Header i Footer otoczone komentarzami `<!-- ===== SITE HEADER START ===== -->`
- [ ] Logo (jeśli jest `logo.svg`/`logo.png`) w `assets/` i użyte w headerze + stopce
- [ ] Stopka kompletna (nawet jeśli dogenerowana)
- [ ] Podstrony `polityka-prywatnosci` i `regulamin` istnieją jako placeholdery
- [ ] Responsywność: 1920, 1440, 1280, 1024, 768, 416, 375
- [ ] `prefers-reduced-motion` wyłącza animacje
- [ ] Komunikaty w poprawnym języku (PL/EN spójnie)
- [ ] Tylko skala szarości (poza `--c-error` w walidacji)
- [ ] Wszystkie obrazy to zaślepki `.placeholder-media`
- [ ] Brak błędów w konsoli
- [ ] `data-project-id` w `<script src="/comments.js">` jest wypełniony rzeczywistą wartością
- [ ] **`KODER-HANDOFF.md` wygenerowany** — lista bloków, mapowanie plików, sugerowane pola ACF (sekcja 19)
- [ ] **`INICJALIZACJA.md` wygenerowany** — prompt startowy dla kolejnych sesji pracy w Cursorze (sekcja 20)

---

## 16. Jak czytać dokumenty wejściowe

Wymagany jest jeden plik: `copy.docx`. `architektura.docx` jest opcjonalny.

**Warianty:**
- **A (domyślny)** — tylko `copy.docx`. Wnioskujesz strukturę.
- **B** — `copy.docx` + `architektura.docx`. Architektura ma pierwszeństwo dla struktury, copy dla treści.
- **C** — jeden plik mieszany. Traktuj jak A.

**Procedura:**

1. Otwórz `copy.docx`. Jeśli się nie da → `pandoc copy.docx -o _working/copy.md` lub Python (`python-docx`).
2. Sprawdź `architektura.docx`. Jeśli istnieje — konwertuj analogicznie. Jeśli nie — wnioskuj strukturę (poniżej).
3. **Wypisz `_working/mapa-sekcji.md`** — lista podstron i sekcji z opisem co w każdej będzie i z którego fragmentu copy pochodzi.
4. Nie wymyślaj. Brak konkretnego tekstu → placeholder `[BRAK: opis]` + zapis w `_working/braki-tresci.md`.
5. Nie pomijaj nic.
6. **Filtruj uwagi redakcyjne** ("Teksty wymagają potwierdzenia", "Do weryfikacji"). NIE umieszczaj ich na makiecie. Jeśli cała sekcja to uwaga — placeholder `[TREŚĆ W PRZYGOTOWANIU]`.

### Wnioskowanie architektury (gdy tylko `copy.docx`)

1. **Identyfikacja podstron** — nagłówki "STRONA GŁÓWNA", "O NAS", separatory, wzmianki o nawigacji. Każda podstrona to URL + folder z `index.html`. Hierarchia URL = hierarchia informacji.
2. **Identyfikacja sekcji wewnątrz strony** — sygnały: H1/H2, zmiana tematu, lista 3-6 punktów (features), pytania (FAQ), cytat (testimonial), dane kontaktowe (kontakt), CTA na końcu (banner).
3. **Mapowanie na wzorce z sekcji 14** — wybór wariantu wg zasady rotacji.
4. **Nawigacja i stopka** — generuj jeśli brak.
5. **Weryfikacja z grafikiem** — przy niejednoznacznościach JEDNO zbiorcze pytanie PRZED kodowaniem.
6. **Zapisz architekturę** — `_working/architektura-wywnioskowana.md` z listą stron + sekcji + wariantów + uzasadnieniem.

---

## 17. Performance i accessibility

- Obrazy-zaślepki z `aspect-ratio` — zero CLS
- Fonty z `display=swap`
- Semantyczny HTML
- Alt / aria-label na zaślepkach
- Focus visible: `outline 2px solid var(--c-accent)` z offsetem
- Keyboard nav: Tab w logicznej kolejności
- Kontrast min 4.5:1 (tekst normalny), 3:1 (duży)
- Reduced motion (sekcja 10)

---

## 18. Co klient WALIDUJE w makiecie

| TAK | NIE |
|---|---|
| Układ i hierarchia informacji | Kolorystyka (jej nie ma — celowo) |
| Zachowania interaktywne | Konkretne zdjęcia (są zaślepki) |
| Kompletność treści | Finalna typografia (DM Sans to placeholder) |
| UX nawigacji | Drobne detale graficzne |

Pomaga rozmowom z klientem: "czemu tak szaro" → "celowo, projektujemy najpierw strukturę i hierarchię, kolor i obrazy podstawimy w kolejnym etapie".

---

## 19. Mapowanie makiety na WordPress / ACF (dla dewelopera)

Ta sekcja opisuje **jak deweloper przejmuje makietę i adaptuje ją do produkcyjnego WP theme'a**. Cursor generuje `KODER-HANDOFF.md` w roocie projektu na podstawie tej sekcji + konkretnej zawartości makiety.

### Mapping plików

| Makieta (statyczna) | WP theme (produkcja) |
|---|---|
| `<section class="hero">...</section>` w HTML | `template-parts/blocks/{kategoria}/hero.php` |
| `styles/blocks/_hero.css` | `assets/src/sass/blocks/_hero.scss` |
| `scripts/modules/hero.js` (opcjonalne) | `assets/src/js/modules/hero.js` (opcjonalne) |
| (deweloper generuje) | `acf-json/group_hero_block.json` |
| (deweloper rejestruje) | `acf_register_block_type()` w `inc/custom-blocks.php` |
| `<header class="site-header">` | `header.php` + `assets/src/sass/blocks/_site-header.scss` |
| `<footer class="site-footer">` | `footer.php` + `assets/src/sass/blocks/_site-footer.scss` |
| `style.css` (lista @import url) | `assets/src/sass/frontend.scss` (lista @import bez url() i podkreślenia) |
| `script.js` | `assets/src/js/frontend.js` |
| `styles/abstracts/_variables.css` | `assets/src/sass/abstracts/_variables.scss` (już istnieje — deweloper porównuje i dodaje brakujące) |
| `comments/`, `comments.js` | (nie kopiuje, artefakt makiety) |

### Konwersja CSS → SCSS

Deweloper kopiuje pliki z `styles/blocks/_hero.css` do `assets/src/sass/blocks/_hero.scss` i opcjonalnie:

1. Zmienia rozszerzenie `.css` → `.scss`
2. Konwersja zmiennych (find-replace, mechaniczna):
   - `var(--c-text)` → `$c-text`
   - `var(--c-gray-1)` → `$c-gray-1`
   - `var(--bg-white)` → `$bg-white`
   - `var(--global-radius)` → `$global-radius`
   - `var(--btn-transition)` → `$btn-transition`
   - `var(--z-lvl-4)` → `$z-lvl-4`
3. Media queries na mixiny (opcjonalnie):
   - `@media (min-width: 1024px)` → `@include bp(large)`
   - `@media (min-width: 768px)` → `@include bp(medium)`
4. Nesting (opcjonalnie) — można zostawić płaskie selektory, SCSS to skompiluje.

Alternatywnie deweloper może **zostawić CSS native** w `_hero.scss` (SCSS jest nadzbiorem CSS) — wszystko zadziała.

### Konwersja HTML → PHP block

Deweloper bierze sekcję `<section class="hero">...</section>` z `index.html` i tworzy `template-parts/blocks/global/hero.php` używając wzorca z paczki `empty-themes-2024-main`:

```php
<?php
$data = get_field('hero') ?: [];
$title    = $data['title']    ?? '';
$subtitle = $data['subtitle'] ?? '';
$image    = $data['image']    ?? null;
$button   = $data['button']   ?? null;

$classes = ['hero'];
if (!empty($block['className'])) { $classes[] = $block['className']; }
?>

<section class="<?php echo esc_attr(implode(' ', $classes)); ?>"
  <?php if (!empty($block['anchor'])) : ?>id="<?php echo esc_attr($block['anchor']); ?>"<?php endif; ?>
  data-aos="fade-up">
  <div class="container hero__inner">
    <div class="hero__content">
      <?php if ($title) : ?>
        <h1 class="hero__title h-display"><?php echo esc_html($title); ?></h1>
      <?php endif; ?>
      <?php if ($subtitle) : ?>
        <div class="hero__subtitle"><?php echo wp_kses_post($subtitle); ?></div>
      <?php endif; ?>
      <?php if (!empty($button['url'])) : ?>
        <a class="hero__button btn" href="<?php echo esc_url($button['url']); ?>">
          <?php echo esc_html($button['title']); ?>
        </a>
      <?php endif; ?>
    </div>
    <?php if (!empty($image['url'])) : ?>
      <div class="hero__media">
        <img class="hero__image" src="<?php echo esc_url($image['url']); ?>"
             alt="<?php echo esc_attr($image['alt'] ?: $title); ?>" loading="eager">
      </div>
    <?php endif; ?>
  </div>
</section>
```

### Sugerowane pola ACF (Cursor wypisuje w `KODER-HANDOFF.md`)

Dla każdej sekcji makiety Cursor wypisuje sugerowaną listę pól ACF na podstawie struktury HTML:

```markdown
## Blok: Hero (template-parts/blocks/global/hero.php)

Pola ACF (group_hero_block.json):
- title (text) — Tytuł hero (z h1)
- subtitle (wysiwyg) — Podtytuł (z div.hero__subtitle, treść może mieć formatowanie)
- image (image, return_format: array) — Obraz hero (z div.placeholder-media)
- button (link, return_format: array) — Przycisk CTA (z a.hero__button)
- eyebrow (text, opcjonalne) — Eyebrow nad tytułem (z p.eyebrow)
```

### Generowanie `KODER-HANDOFF.md`

Cursor generuje ten plik w roocie projektu na koniec budowy makiety. Plik zawiera:
1. Listę wszystkich bloków makiety
2. Mapping na plik PHP + plik SCSS + plik JS u dewelopera
3. Sugerowane pola ACF per blok
4. Listę globalnych elementów (header, footer)
5. Listę custom-properties → SCSS variables (do dodania jeśli brakuje u dewelopera)
6. Specyficzne uwagi (np. "blok testimonials używa Swiper — w produkcji już jest w stacku")

### Co deweloper robi krok po kroku (5 kroków)

1. **Skopiowanie folderu makiety na pulpit jako referencję.**
2. **Skopiowanie `styles/blocks/_*.css` → `assets/src/sass/blocks/_*.scss`** (mechaniczne).
3. **Konwersja zmiennych w plikach blocks** (find-replace `var(--x)` → `$x`).
4. **Dla każdej sekcji:** stworzenie `template-parts/blocks/{kat}/{blok}.php` na podstawie HTML z makiety, opakowanie pól w `get_field()`, dodanie `acf-json/group_{blok}_block.json`, rejestracja w `inc/custom-blocks.php`.
5. **Skopiowanie `scripts/modules/*.js` → `assets/src/js/modules/*.js`** (1:1, bez zmian).

Czas: 1-2 godziny dla średniej makiety (5-8 sekcji).

---

## 20. `INICJALIZACJA.md` — prompt startowy kolejnych sesji

Praca nad makietą nie kończy się na pierwszej budowie — po prezentacji klientowi przychodzą rundy poprawek, często w nowych sesjach Cursora, które nie mają kontekstu poprzednich. Dlatego **na koniec budowy makiety Cursor generuje plik `INICJALIZACJA.md` w roocie projektu**. Każdą kolejną sesję pracy zaczyna się od wklejenia zawartości tego pliku do czatu.

Cursor generuje plik według poniższego szablonu, podstawiając konkretne wartości projektu (nazwa, lista podstron, `data-project-id`):

````markdown
# INICJALIZACJA — [nazwa-projektu]

Wklej całość do nowego czatu Cursora (tryb Agent) PRZED pierwszym poleceniem poprawek.

---

Pracujesz nad istniejącą makietą funkcjonalną UX projektu **[nazwa-projektu]**.
To sesja POPRAWEK — makieta jest już zbudowana. Zanim cokolwiek zmienisz:

## KROK 1 — Przeczytaj dokumentację w tej kolejności
1. `.cursorrules` — reguły nadrzędne (stack, tokeny, BEM, partials)
2. `KODER-HANDOFF.md` — mapa bloków projektu (które sekcje istnieją, gdzie są ich pliki)
3. `_working/mapa-sekcji.md` — struktura stron i pochodzenie treści
4. `makieta-spec.md` — sięgaj gdy potrzebujesz szczegółu konwencji (tokeny: sekcja 4, animacje: 10, warianty układów: 14, partials: 25 w .cursorrules)

## KROK 2 — Żelazne zasady tej sesji
- Wspólne elementy (header, footer, mobile-menu, trust-bar, modal, scripts) edytuj WYŁĄCZNIE w `partials/`, potem `python scripts/build-html.py`
- NIE wymyślaj treści — zmiany tekstów tylko na wyraźne polecenie, nowe braki do `_working/braki-tresci.md`
- Tylko skala szarości, wszystkie wartości przez tokeny `var(--*)`, zaokrąglenia przez `var(--global-radius)` (8px)
- Każdy blok = osobny plik CSS w `styles/blocks/` — nowe sekcje dostają nowy plik i wpis w `style.css`
- AOS bez blur/glow, stagger elementów krokiem 80ms; bez magnetic hover
- Bez npm, bez build stepu, bez frameworków — stack: HTML + native CSS + vanilla JS + CDN
- `comments.js` w roocie z `data-project-id="[nazwa-projektu]"` — nie ruszaj

## KROK 3 — Po każdej rundzie zmian raportuj
- Lista zmienionych plików (pełne ścieżki)
- Co zmieniono w każdym z nich (1 linia na plik)
- Czy uruchomiono `build-html.py` (jeśli dotykałeś partials)
- Czy `KODER-HANDOFF.md` wymaga aktualizacji (nowy/usunięty/przebudowany blok → zaktualizuj od razu)

## Kontekst projektu
- Podstrony: [lista URL-i, np. `/`, `/o-nas`, `/oferta`, `/kontakt`, ...]
- Slider Swiper użyty w: [lista bloków lub "brak"]
- Uwagi specyficzne: [np. mega-menu w nawigacji, modal konsultacji, trust-bar — lub "brak"]

Potwierdź że przeczytałeś dokumentację i czekaj na polecenie poprawek.
````

Zasady:
- Plik generowany automatycznie na końcu pierwszej budowy (razem z `KODER-HANDOFF.md`)
- Po istotnych zmianach struktury (nowe podstrony, nowe bloki) Cursor aktualizuje sekcję "Kontekst projektu"
- `INICJALIZACJA.md` zostaje w repo (nie trafia do `.gitignore`) — korzysta z niego każdy, kto przejmuje projekt

---
