#!/usr/bin/env python3
"""
build-html.py — wstrzykuje treść partials/ do plików HTML projektu makiety.

Sposób działania:
  W każdym pliku HTML (oprócz partials/) znajduje markery:

    <!-- BEGIN PARTIAL: <nazwa> -->
    ... (treść wstrzykiwana - dowolna) ...
    <!-- END PARTIAL: <nazwa> -->

  Treść między markerami jest podmieniana na zawartość partials/<nazwa>.html.
  Markery zostają nietknięte - kolejne uruchomienie buildu znajdzie je ponownie.

Użycie:
  python scripts/build-html.py              # przebuduj wszystkie pliki HTML
  python scripts/build-html.py --check      # sprawdź czy HTML jest zsynchronizowany (exit 1 jeśli nie)
  python scripts/build-html.py --verbose    # dodatkowe informacje
  python scripts/build-html.py --dry-run    # pokaż co byłoby zmienione, ale nie zapisuj

Konwencje:
  - Skrypt uruchamiaj z roota projektu (folder zawierający partials/, scripts/, index.html itd.)
  - Partials z folderu partials/<nazwa>.html mapują się na markery PARTIAL: <nazwa>
  - Brakujący partial dla istniejącego markera → ostrzeżenie (kontynuuje)
  - Brak markerów dla istniejącego partial → OK (partial po prostu nieużywany w żadnym HTML)

Zaprojektowany pod współpracę z Cursor AI - po edycji partial Cursor sam uruchamia
ten skrypt zgodnie z zasadą w `.cursorrules`.

Wymaga: Python 3.7+ (tylko biblioteka standardowa).
"""

import argparse
import re
import sys
from pathlib import Path

# Markery
BEGIN_RE = re.compile(r'<!-- BEGIN PARTIAL: ([a-z0-9\-]+)(?:[^\n>]*)? -->', re.IGNORECASE)
END_RE = re.compile(r'<!-- END PARTIAL: ([a-z0-9\-]+) -->', re.IGNORECASE)

# Foldery które pomijamy podczas wyszukiwania HTML
EXCLUDE_DIRS = {'partials', 'node_modules', '_working', '.git', '.idea', '.vscode', 'dist', 'build'}


def find_project_root() -> Path:
    """Znajduje root projektu (folder zawierający partials/)."""
    cwd = Path.cwd()
    for candidate in [cwd] + list(cwd.parents):
        if (candidate / 'partials').is_dir():
            return candidate
    print("✗ Nie znaleziono folderu partials/ w bieżącym katalogu ani wyżej.", file=sys.stderr)
    print("  Uruchom skrypt z roota projektu makiety (tam gdzie jest partials/).", file=sys.stderr)
    sys.exit(2)


def load_partials(root: Path, verbose: bool = False) -> dict:
    """Wczytuje wszystkie partials/*.html do słownika {nazwa: zawartość}."""
    partials_dir = root / 'partials'
    partials = {}
    for f in sorted(partials_dir.glob('*.html')):
        name = f.stem
        content = f.read_text(encoding='utf-8').rstrip('\n')
        partials[name] = content
        if verbose:
            print(f"  load partial: {name} ({len(content):,} znaków)")
    return partials


def find_html_files(root: Path) -> list:
    """Znajduje wszystkie pliki .html w projekcie, pomijając EXCLUDE_DIRS."""
    files = []
    for path in root.rglob('*.html'):
        # Pomiń ścieżki zawierające EXCLUDE_DIRS
        rel = path.relative_to(root)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        files.append(path)
    return sorted(files)


def inject_partials(html: str, partials: dict, file_label: str = '', verbose: bool = False) -> tuple:
    """
    Wstrzykuje treść partials w odpowiednie markery.
    Zwraca: (new_html, num_injections, warnings)
    """
    warnings = []
    num_injections = 0

    # Znajdź wszystkie markery BEGIN PARTIAL
    cursor = 0
    output_parts = []

    while True:
        begin_match = BEGIN_RE.search(html, cursor)
        if not begin_match:
            output_parts.append(html[cursor:])
            break

        partial_name = begin_match.group(1)
        # Znajdź odpowiadający END PARTIAL (po begin_match)
        end_search_start = begin_match.end()
        end_match = END_RE.search(html, end_search_start)

        if not end_match:
            warnings.append(f"BEGIN PARTIAL: {partial_name} bez odpowiadającego END")
            output_parts.append(html[cursor:])
            break

        end_partial_name = end_match.group(1)
        if end_partial_name != partial_name:
            warnings.append(
                f"Niepasujące markery: BEGIN '{partial_name}' kontra END '{end_partial_name}'"
            )

        # Sprawdź czy mamy taki partial
        if partial_name not in partials:
            warnings.append(f"Brak pliku partials/{partial_name}.html (marker w {file_label})")
            # Zachowaj oryginalne markery + treść bez zmian
            output_parts.append(html[cursor:end_match.end()])
            cursor = end_match.end()
            continue

        # Wstrzyknij: zachowaj BEGIN marker, podmień treść, zachowaj END marker
        output_parts.append(html[cursor:begin_match.end()])
        output_parts.append('\n')
        output_parts.append(partials[partial_name])
        output_parts.append('\n')
        output_parts.append(end_match.group(0))

        cursor = end_match.end()
        num_injections += 1

    return ''.join(output_parts), num_injections, warnings


def main():
    parser = argparse.ArgumentParser(description='Wstrzykuje treść partials/ do plików HTML.')
    parser.add_argument('--check', action='store_true', help='Sprawdź czy HTML jest zsynchronizowany (exit 1 jeśli nie). Nie zapisuj.')
    parser.add_argument('--verbose', '-v', action='store_true', help='Dodatkowe informacje.')
    parser.add_argument('--dry-run', action='store_true', help='Pokaż co byłoby zmienione, ale nie zapisuj.')
    args = parser.parse_args()

    root = find_project_root()
    if args.verbose:
        print(f"Root projektu: {root}")

    # Wczytaj partials
    partials = load_partials(root, verbose=args.verbose)
    if not partials:
        print("✗ Folder partials/ jest pusty - nic do wstrzyknięcia.", file=sys.stderr)
        sys.exit(2)

    if args.verbose or args.check:
        print(f"Załadowano {len(partials)} partials: {', '.join(sorted(partials.keys()))}")

    # Znajdź pliki HTML
    html_files = find_html_files(root)
    if not html_files:
        print("✗ Nie znaleziono żadnych plików HTML w projekcie.", file=sys.stderr)
        sys.exit(2)

    if args.verbose:
        print(f"Znaleziono {len(html_files)} plików HTML")

    # Przetwórz każdy plik
    total_injections = 0
    total_changes = 0
    all_warnings = []
    changed_files = []
    unchanged_files = []
    out_of_sync = []

    for f in html_files:
        rel = f.relative_to(root)
        original = f.read_text(encoding='utf-8')
        new_html, injections, warnings = inject_partials(
            original, partials, file_label=str(rel), verbose=args.verbose
        )

        for w in warnings:
            all_warnings.append(f"  {rel}: {w}")

        if injections == 0:
            unchanged_files.append(rel)
            if args.verbose:
                print(f"  - {rel}: brak markerów partials")
            continue

        total_injections += injections

        if new_html != original:
            total_changes += 1
            changed_files.append(rel)
            if args.check:
                out_of_sync.append(rel)
            elif not args.dry_run:
                f.write_text(new_html, encoding='utf-8')
            if args.verbose:
                print(f"  ✓ {rel}: {injections} markerów, {'zmieniony' if new_html != original else 'bez zmian'}")
        else:
            if args.verbose:
                print(f"  · {rel}: {injections} markerów, bez zmian (już zsynchronizowany)")

    # Podsumowanie
    print()
    if args.check:
        if out_of_sync:
            print(f"✗ {len(out_of_sync)} plik(ów) HTML niezsynchronizowanych z partials/:")
            for f in out_of_sync:
                print(f"    {f}")
            print()
            print("  Uruchom: python scripts/build-html.py")
            sys.exit(1)
        else:
            print(f"✓ Wszystkie {len(html_files)} plików HTML zsynchronizowanych z partials/.")
    else:
        action = "Pokazano (dry-run)" if args.dry_run else "Zaktualizowano"
        if total_changes:
            print(f"✓ {action} {total_changes} plik(ów) HTML ({total_injections} wstrzyknięć partials)")
            if args.verbose or args.dry_run:
                for f in changed_files:
                    print(f"    {f}")
        else:
            print(f"✓ Wszystkie {len(html_files)} plików HTML już zsynchronizowanych - brak zmian.")

    if all_warnings:
        print()
        print(f"⚠ Ostrzeżenia ({len(all_warnings)}):")
        for w in all_warnings:
            print(w)


if __name__ == '__main__':
    main()
