# Programmer Manual Generator

Generate a complete programmer manual for any project type: Angular+PHP, PHP only, or HTML/CSS.

## Detection

First, detect the project type by checking what exists in the working directory:

```
Angular+PHP → angular.json + composer.json or tfg-php/ folder
PHP only    → composer.json or *.php files, no angular.json
HTML/CSS    → *.html + *.css files, no angular.json, no composer.json
```

Ask the user to confirm the detected type before proceeding.

## Angular + PHP projects

### Step 1 — Angular docs (Compodoc)

Ask: "¿Quieres la documentación Angular en **español** o **inglés**?"

Run from the Angular folder (`angular-tfg/` or wherever `angular.json` lives):

```bash
npx compodoc -p tsconfig.compodoc.json -d ../manual/angular \
  --theme material \
  --name "<Project Name> – Frontend" \
  --includes ../tfg-php/doc \
  --language <es-ES|en-US>
```

Requirements:
- `tsconfig.compodoc.json` must exist; if not, create it pointing to `src/tsconfig.app.json`.
- `tfg-php/doc/summary.json` must exist (array of `{title, file}` pointing to `.md` files in that folder). Create it if missing.
- If `@compodoc/compodoc` is not in devDependencies, run `npm install --save-dev @compodoc/compodoc` first.

### Step 2 — PHP docs (phpDocumentor)

Run from the PHP folder (`tfg-php/` or project root):

```bash
php phpDocumentor.phar run \
  -d src/ \
  -t manual/php \
  --title "<Project Name> – Backend"
```

If `phpDocumentor.phar` is not present, download it:
```bash
curl -L https://phpdoc.org/phpDocumentor.phar -o phpDocumentor.phar
```

### Step 3 — Cleanup

After generation, these folders/files are NOT needed for the final manual. Ask the user if they want to delete them, explaining what each is:

- `.phpdoc/` — phpDocumentor cache (regenerated each run)
- `.cache/` — Compodoc internal cache
- `phpDocumentor.phar` — the generator tool (can be re-downloaded)

If yes, delete them. If no, leave them.

### Step 4 — Report

Tell the user:
- Angular manual location: `manual/angular/index.html`
- PHP manual location: `manual/php/index.html`
- How to open: `start manual/angular/index.html` (Windows) or `open manual/angular/index.html` (Mac)

---

## PHP only projects

### Step 1 — PHP docs (phpDocumentor)

Same as Step 2 above.

### Step 2 — Check for additional markdown docs

Look for a `doc/` folder. If it exists and has `.md` files, tell the user Compodoc is not applicable but the markdown files can be linked from the PHP manual's README.

### Step 3 — Cleanup + Report

Same cleanup as above. Report:
- PHP manual location: `manual/php/index.html`

---

## HTML + CSS projects

Compodoc and phpDocumentor don't apply. Generate a **custom HTML programmer manual** instead.

### Step 1 — Gather project info

Read the following:
- All `.html` files → extract `<title>` and major sections (`<section>`, `<main>`, landmark headings)
- All `.css` files → extract CSS custom properties (`--*`), major selectors, and media queries
- Folder structure (1 level deep)
- Any `README.md` if present

### Step 2 — Generate manual

Create `manual-programador/index.html` following this structure:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual del Programador – [Project Name]</title>
  <style>
    /* Same sidebar + content layout as the user manual skill */
    /* Print styles: hide sidebar on print, content full width */
    @media print { nav { display: none; } main { margin: 0; } }
  </style>
</head>
<body>
  <nav><!-- table of contents sidebar --></nav>
  <main>
    <section id="estructura">Estructura de archivos y carpetas</section>
    <section id="html">Páginas HTML: descripción de cada archivo</section>
    <section id="css">Variables CSS, paleta de colores, breakpoints</section>
    <section id="componentes">Componentes reutilizables (si los hay)</section>
    <section id="dependencias">Librerías externas (CDN links encontrados)</section>
    <section id="despliegue">Instrucciones de despliegue / servidor</section>
  </main>
  <footer>Generado por Claude Code – [date]</footer>
</body>
</html>
```

Fill each section with the actual content found in Step 1.

### Step 3 — Report

Tell the user:
- Manual location: `manual-programador/index.html`
- How to print to PDF: open in browser → `Ctrl+P` → "Guardar como PDF"
- No cleanup needed (no artifacts generated)

---

## Notes

- Always generate manuals in a `manual/` subfolder at project root (or `manual-programador/` for HTML/CSS).
- Never overwrite existing manual content without asking.
- If the build fails (Compodoc or phpDocumentor), report the exact error and suggest a fix before retrying.
- The phpDocumentor.phar path may be at the project root or in the PHP subfolder — check both.
