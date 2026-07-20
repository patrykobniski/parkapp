# System partials (`partials/` + `scripts/build-html.py`)

Mechanizm zapobiegający desynchronizacji headera, stopki i innych wspólnych elementów między podstronami makiety.

## Po co to jest

Bez partials: zmiana w nagłówku wymaga manualnego skopiowania jej do 30, 50, 100 plików HTML. Łatwo o pomyłkę. Często rezultat: różne wersje headera na różnych podstronach — niedopuszczalne.

Z partials: edytujesz **jeden plik** w `partials/`. Uruchamiasz `python scripts/build-html.py`. Skrypt podmienia treść we wszystkich podstronach. Header wszędzie identyczny.

## Pliki w `partials/`

| Plik | Co to | Czy wymagany |
|---|---|---|
| `head.html` | zawartość `<head>` (meta, fonty, link do CSS) | tak |
| `trust-bar.html` | pasek pomocniczy nad headerem (telefon, AAA, drobne linki) | opcjonalny |
| `header.html` | desktop nav + mega-menu / mini-dropdown | tak |
| `mobile-menu.html` | drawer mobilny (hamburger) | tak |
| `consultation-modal.html` | modal kontaktu (gdy projekt go używa zamiast osobnej podstrony) | opcjonalny |
| `footer.html` | stopka | tak |
| `scripts.html` | skrypty na końcu `<body>` (AOS, Swiper, `script.js`, `comments.js`) | tak |

## Jak to działa technicznie

W każdym pliku HTML projektu (`index.html`, `o-nas/index.html`, ...) znajdują się markery:

```html
<!-- BEGIN PARTIAL: header -->
... (treść headera) ...
<!-- END PARTIAL: header -->
```

`scripts/build-html.py` przechodzi przez wszystkie pliki HTML w projekcie (pomija `partials/`, `_working/`, `node_modules/` itp.) i dla każdej pary markerów `BEGIN/END PARTIAL: <nazwa>` podmienia treść między nimi na zawartość `partials/<nazwa>.html`.

Markery zostają w plikach HTML — żeby kolejne uruchomienia buildu wiedziały gdzie wstrzykiwać.

## Workflow

### Pierwsza budowa projektu

1. Kopia `makieta-baseline/` jako folder nowego projektu
2. Cursor czyta `copy.docx` + `architektura.docx`
3. Uzupełnia `partials/header.html`, `partials/footer.html`, `partials/mobile-menu.html` (i pozostałe) konkretną nawigacją i danymi klienta
4. Generuje pliki HTML podstron z markerami partials (i konkretną treścią `<main>`)
5. Uruchamia `python scripts/build-html.py`
6. Sprawdza w przeglądarce

### Edycja wspólnego elementu (np. dodanie pozycji w menu)

1. **Edytuj WYŁĄCZNIE** odpowiedni plik w `partials/` (np. `partials/header.html` dla nawigacji)
2. **NIE edytuj** treści między markerami `BEGIN PARTIAL` / `END PARTIAL` w plikach HTML podstron
3. Uruchom `python scripts/build-html.py`
4. Commit: partial + zmiany w HTML w jednym commicie

### Edycja treści konkretnej podstrony (np. zmiana hero na home)

1. Edytuj plik HTML konkretnej podstrony (np. `index.html`)
2. **Edytuj tylko treść POZA markerami partials** (czyli `<main>`, sekcje specyficzne dla tej podstrony)
3. Nie uruchamiaj `build-html.py` (nic by nie zmienił, ale też nie zaszkodzi)

### Dodanie nowej podstrony

1. Stwórz folder `<slug>/` z `index.html`
2. W `index.html` użyj szablonu: head + markery partials + `<main>` + markery partials + scripts
3. **WAŻNE**: wszystkie markery partials muszą być obecne, nawet jeśli treść między nimi pusta. Build je wypełni.
4. Uruchom `python scripts/build-html.py`

## Komendy

```bash
# Standardowe użycie - przebuduj wszystkie HTML z partials
python scripts/build-html.py

# Verbose - pokaż które pliki są przetwarzane
python scripts/build-html.py --verbose

# Tylko sprawdź czy HTML jest zsynchronizowany - bez zapisu (przydatne w CI)
python scripts/build-html.py --check

# Pokaż co byłoby zmienione, ale nie zapisuj
python scripts/build-html.py --dry-run
```

`--check` zwraca exit code 1 gdy któryś HTML jest desynchronizowany — można podpiąć pod pre-commit hook lub CI.

## Konwencje

### Ścieżki w partials → absolutne URL

Partial header jest **identyczny** dla każdej podstrony — niezależnie od poziomu zagnieżdżenia. Dlatego ścieżki w partials muszą być absolutne:

```html
<!-- DOBRZE - działa z każdej podstrony -->
<a href="/o-nas">O nas</a>
<img src="/assets/logo.svg">

<!-- ŹLE - złamie się na zagnieżdżonych podstronach -->
<a href="o-nas/index.html">O nas</a>
<img src="../assets/logo.svg">
```

Działa to gdy strona jest serwowana z roota domeny (lub przez `npx serve .` / Live Server lokalnie). Bezpośrednie otwarcie pliku w przeglądarce (`file://`) nie zadziała — to jednak zgodne z konwencją zespołu (patrz `.cursorrules` zasada #5a).

### Tagi `<title>` i `<meta description>` są lokalne

`partials/head.html` NIE zawiera tagów `<title>` i `<meta name="description">` — każda podstrona ma własne. Markery partials w HTML są **PO** tych tagach:

```html
<head>
  <title>O nas — Nazwa Firmy</title>
  <meta name="description" content="Krótki opis podstrony...">

  <!-- BEGIN PARTIAL: head -->
  ... (meta charset, fonty, CSS - wspólne dla wszystkich) ...
  <!-- END PARTIAL: head -->
</head>
```

### Co NIE jest w partials

- Treść `<main>` — to specyficzne dla każdej podstrony
- Title i meta description — j.w.
- `<html>`, `<head>` (otwierające tagi), `<body>` (otwierające tagi)

Partial to zawsze **fragment HTML do wklejenia w konkretne miejsce** — nigdy pełna struktura strony.

## Dla zespołu deweloperskiego (WP)

`partials/` i `scripts/build-html.py` są **artefaktami etapu makiety**, podobnie jak `comments.js`.

Nie kopiujcie ich do produkcyjnego WordPress theme. Mapowanie:

| W makiecie | W produkcyjnym WP theme |
|---|---|
| `partials/header.html` | `header.php` |
| `partials/footer.html` | `footer.php` |
| `partials/mobile-menu.html` | część `header.php` lub osobny `template-parts/mobile-menu.php` |
| `partials/scripts.html` | `wp_enqueue_scripts()` w `functions.php` |
| `scripts/build-html.py` | nieistotne — WordPress ma własny system templates |
| Markery `<!-- BEGIN PARTIAL: -->` | usuwacie (template-parts dają wam to natywnie) |

Dostajecie finalne pliki HTML w paczce (po buildzie). Tam treść partials jest już wstrzyknięta, markery zostają — możecie je usunąć lub zignorować podczas parcelowania.

## Troubleshooting

**"Nie znaleziono folderu partials/"**  
Uruchom skrypt z roota projektu (folder zawierający `partials/`).

**"BEGIN PARTIAL: X bez odpowiadającego END"**  
Brakuje markera `<!-- END PARTIAL: X -->` w pliku HTML. Dopisz go.

**"Brak pliku partials/X.html (marker w plik.html)"**  
Marker odwołuje się do partial którego nie ma. Albo utwórz `partials/X.html`, albo usuń markery z HTML.

**Build przeszedł, ale na stronie nadal stara wersja**  
Hard refresh w przeglądarce (Cmd+Shift+R / Ctrl+Shift+R) — cache.
