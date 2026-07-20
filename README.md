# ParkApp — prototyp pakietu weekendowego

Statyczny prototyp HTML/CSS/JS flow zakupu pakietu **„4 kolejne weekendy”** w aplikacji ParkApp.

## Deploy automatyczny (GitHub Actions → FTP)

Każdy push na branch `main` wrzuca pliki na **https://ux.dev-jaaqob.pl/parkapp/**

Workflow: `.github/workflows/deploy-ftp.yml`  
Status deployów: repo → [**Actions**](https://github.com/patrykobniski/parkapp/actions)

### Jednorazowa konfiguracja (Secrets)

W GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Wartość |
|--------|---------|
| `FTP_SERVER` | `ftp.dev-jaaqob.pl` |
| `FTP_USERNAME` | `ux_jaaqob@ux.dev-jaaqob.pl` |
| `FTP_PASSWORD` | *(hasło FTP — tylko w Secrets, nigdy w repo)* |

Po zapisaniu secretów: **Actions → Deploy to UX server (FTP) → Run workflow**  
(albo zrób dowolny push na `main`).

---

## Podgląd lokalny

```bash
npx serve .
```

Otwórz: [http://localhost:3000](http://localhost:3000)

## GitHub Pages

Po włączeniu Pages (branch `main`, folder `/`) prototyp dostępny pod:

`https://patrykobniski.github.io/parkapp/`

## Flow

0. **Ustaw czas** — mapa + bottom sheet (termin zwykłej rezerwacji)
1. **Mapa z listą parkingów** — wyniki dla wybranego czasu, chip u góry do edycji terminu
2. **Szczegóły parkingu** — zwykła rezerwacja + pakiet cenowy + pakiet cykliczny
3. **Szczegóły pakietu** — wybór startu, lista 4 terminów, miejsce, sprawdzenie dostępności
4. **Stany dostępności** — loading / sukces / alternatywa / brak miejsc
5. **Podsumowanie** → **Potwierdzenie**

„Zrezygnuj z pakietu cyklicznego” na wizytówce przywraca termin z kroku 0.

Terminy generowane dynamicznie (`scripts/package-dates.js`). Stan flow w `sessionStorage`.

## UX — dwa typy pakietów

| Sekcja | Cel |
|--------|-----|
| Lepsza stawka na ten termin | Obniżka ceny **bieżącej** rezerwacji (np. Całodobowy) |
| Parkujesz tutaj regularnie? | Osobny produkt — **4 osobne rezerwacje** weekendowe |

Po wyborze pakietu cyklicznego górny pasek pokazuje: `Pakiet · 4 weekendy` + zakres dat.
