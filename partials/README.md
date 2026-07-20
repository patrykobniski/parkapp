# `partials/` — wspólne fragmenty HTML

Każdy plik w tym folderze odpowiada jednemu współdzielonemu elementowi makiety (header, footer, mobile-menu itd.). Zawartość partial trafia do każdej podstrony makiety przez markery komentarzy w HTML — patrz `FRAGMENTS.md` w roocie projektu po pełną instrukcję.

## Pliki w tym folderze

| Plik | Rola | Wymagany? |
|---|---|---|
| `head.html` | zawartość `<head>` (meta, fonty, CSS) | tak |
| `trust-bar.html` | pasek pomocniczy nad headerem (telefon, AAA, drobne linki) | opcjonalny |
| `header.html` | desktop nav + mega-menu | tak |
| `mobile-menu.html` | drawer mobilny | tak |
| `consultation-modal.html` | modal konsultacji (jeśli projekt go używa) | opcjonalny |
| `footer.html` | stopka | tak |
| `scripts.html` | skrypty na końcu `<body>` (AOS, Swiper, `script.js`, `comments.js`) | tak |

## Zasada żelazna

**Edycja partials → uruchomienie `python scripts/build-html.py`**. Bez tego zmiana nie trafi do plików HTML.

Nigdy nie edytuj headera/footera/innych wspólnych części bezpośrednio w `index.html` lub innych podstronach — to złamie synchronizację.
