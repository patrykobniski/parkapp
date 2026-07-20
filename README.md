# ParkApp — prototyp pakietu weekendowego

Statyczny prototyp HTML/CSS/JS flow zakupu pakietu **„4 kolejne weekendy”** w aplikacji ParkApp.

## Podgląd lokalny

```bash
npx serve .
```

Otwórz: [http://localhost:3000](http://localhost:3000)

## GitHub Pages

Po włączeniu Pages (branch `main`, folder `/`) prototyp dostępny pod:

`https://patrykobniski.github.io/parkapp/`

## Flow

1. **Szczegóły parkingu** — zwykła rezerwacja + pakiet cenowy (Całodobowy) + pakiet cykliczny
2. **Szczegóły pakietu** — wybór startu, lista 4 terminów, miejsce, sprawdzenie dostępności
3. **Stany dostępności** — loading / sukces / alternatywa / brak miejsc
4. **Podsumowanie** → **Potwierdzenie**

Terminy generowane dynamicznie (`scripts/package-dates.js`). Stan flow w `sessionStorage`.

## UX — dwa typy pakietów

| Sekcja | Cel |
|--------|-----|
| Lepsza stawka na ten termin | Obniżka ceny **bieżącej** rezerwacji (np. Całodobowy) |
| Parkujesz tutaj regularnie? | Osobny produkt — **4 osobne rezerwacje** weekendowe |

Po wyborze pakietu cyklicznego górny pasek pokazuje: `Pakiet · 4 weekendy` + zakres dat.
