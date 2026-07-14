# Test seed media (images + documents)

Committed WebP images and PDFs used by `npm run db:test` / `db:test:reseed`.
Seeding copies these files into `uploads/` in ~1 second — **no network downloads**.

## Layout

```
seed-assets/
  vehicles/       mercedes-benz-190sl-roadster-1.webp, …-ownership.pdf, …
  machinery/
  buildings/
  land/
  auctions/       premium-vehicles-collection-july-2025-catalog.pdf, …
```

**Images:** `{slug}-{n}.webp` (e.g. `ford-mustang-fastback-3.webp`)  
**Documents:** `{slug}-{document-key}.pdf` (e.g. `ford-mustang-fastback-ownership.pdf`)

Slugs are derived from asset titles in the catalog (`helpers.mjs`).

## Usage

```bash
# Normal test seed (copies from seed-assets → uploads → database)
npm run db:test:reseed

# Rebuild seed-assets after changing catalog or refreshing source images
npm run seed-assets:build
```

`seed-assets:build` requires `sharp` (devDependency) and existing JPEGs in `uploads/assets/images/` from a prior download seed, or images you add manually.

## Git

Commit this folder to the repo. `uploads/` stays gitignored — it is regenerated on every test seed.
