# Project: Medium-artikelen migreren naar GitHub Pages (Jekyll)

## Doel
Oude Medium-artikelen omzetten naar markdown en publiceren als statische blog via GitHub Pages. Er komt geen CMS: alles staat als markdown en bestanden in deze repo.

## Stack
- **Jekyll**, standaard gebouwd door GitHub Pages (geen eigen build-workflow tenzij nodig)
- Theme: `minima` (kan later vervangen worden door bijv. Chirpy)
- Plugins: alleen plugins die GitHub Pages standaard ondersteunt (`jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap`)

## Repostructuur
```
_config.yml          # site-instellingen
_posts/              # artikelen: JJJJ-MM-DD-slug.md
assets/images/       # afbeeldingen, per artikel een submap: assets/images/<slug>/
index.md             # homepage met lijst van posts
about.md             # over-pagina
medium-export/       # ruwe Medium-export (HTML), niet gepubliceerd
scripts/             # conversiescripts
```
Neem `medium-export/` en `scripts/` op in `exclude:` in `_config.yml`.

## Conventies voor artikelen
- Bestandsnaam: `_posts/JJJJ-MM-DD-slug.md`. De datum is de originele Medium-publicatiedatum.
- Slug: kleine letters, koppeltekens, geen speciale tekens.
- Front matter:
  ```yaml
  ---
  layout: post
  title: "Originele titel"
  date: JJJJ-MM-DD
  tags: [tag1, tag2]
  description: "Korte samenvatting (1 zin)"
  original_url: "https://medium.com/..."
  ---
  ```
- Codeblokken altijd met taalaanduiding (```` ```python ````).
- Afbeeldingen lokaal opslaan, nooit hotlinken naar Medium's CDN (`miro.medium.com`).
- Embeds (Gist, YouTube, tweets) vervangen door een link of een inline codeblok.

## Migratieproces
1. Medium-export (Settings → Security and apps → Download your information) uitpakken in `medium-export/`. Posts staan in `posts/*.html`.
2. Drafts overslaan: bestanden waarvan de naam met `draft_` begint.
3. Per post de HTML omzetten naar markdown (script in `scripts/`, bijv. Python met `markdownify`/`beautifulsoup4` of `pandoc`).
4. Titel, datum en canonical URL uit de HTML halen en in de front matter zetten.
5. Afbeeldingen downloaden naar `assets/images/<slug>/` en links herschrijven.
6. Elk resultaat handmatig controleren op codeblokken, lijsten, koppen en afbeeldingen.

## Lokaal testen
```bash
bundle install
bundle exec jekyll serve
```
De site draait op http://localhost:4000.

## Werkafspraken
- Kort en zakelijk communiceren.
- Doorvragen als iets onduidelijk is; geen ongevraagde extra features of richtingen voorstellen.
- Bestaande artikelinhoud niet herschrijven of "verbeteren". Alleen de opmaak omzetten.
