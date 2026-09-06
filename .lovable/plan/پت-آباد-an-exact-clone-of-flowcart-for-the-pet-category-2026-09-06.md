# پت‌آباد — an exact clone of Flowcart for the pet category

New routes: `/petabad` (desktop) and `/m/petabad` (mobile). Everything else in the project stays untouched — Flowcart (`/gptcommerce`, `/m/gptcommerce`) and Shift are not modified.

## What the dataset gives us

The uploaded workbook has one sheet, 15 columns, ~1,700 pet products:  
name, short description, long description, price, original price, image URL, in-stock, subcategory, category, species, brand, origin country, weight, taxonomy (3 levels), specifications (key:value pairs in Persian).

Notes from reviewing the rows: prices are plain numbers, "Original Price" is mostly `Null`, `inStock` is yes/no, images are single URLs from petabad.com, and taxonomy/specifications are Persian text that needs parsing into structured fields (weight, species, flavour, brand, origin country, dimensions).

## What gets built

1. **Its own catalog** — a separate pet products table with all the fields Flowcart has, plus species, origin country, weight, taxonomy levels and structured specs. Full Persian text search and AI similarity search of its own, so pet data never mixes with the electronics catalog.
2. **Data import** — the Excel file is imported and cleaned: Persian text normalised, prices/stock converted, brands tidied, taxonomy and specification strings split into real fields, then search data and AI embeddings generated for all rows.
3. **AI search tech stack (same as Flowcart, but pet-specific)**
  - Persian-normalised `search_vector` tsvector on name, description, category, brand, species and tags.
  - Trigram (pg_trgm) indexes on name and brand for typo-tolerant matching.
  - `embedding vector(3072)` column populated with `google/gemini-embedding-2` via the Lovable AI Gateway, using halfvec HNSW cosine index.
  - `pet_hybrid_search` SQL function combining full-text rank, vector cosine similarity and trigram overlap, with the same filters Flowcart uses (category, subcategory, brand, price range, in-stock, min rating).
  - `pet_question_facets` SQL function for data-grounded clarifying questions: candidate count, price quantiles, distinct brands, species and tags derived from the actual filtered catalog.
4. **Its own assistant** — a separate pet shopping agent with a pet-specific personality and vocabulary (species, life stage, breed size, food type, sensitivities, grooming, toys, health), and its own data-grounded clarifying questions (budget ranges, brands and options derived from the actual pet catalog, like Flowcart does today).
5. **Cloned storefront** — the full desktop and mobile Flowcart experience duplicated for پت‌آباد: chat landing, chat mode, product cards, quick view, product details, cart sidebar, checkout steps, addresses, OTP login, order history, account panel, footer. Same journeys, same behaviour, no new features.
6. **Pet-customised content** — landing headline and subtitle, input placeholders and typing animation texts, quick-action chips, landing product carousels (e.g. غذای گربه, غذای سگ, اسنک و تشویقی, لوازم بهداشتی, اسباب‌بازی, تخفیف‌دارها), empty states, loading texts, and all example prompts written for pet shopping.
7. **Orange identity** — the whole colour system switches from Flowcart's blue/purple to orange, with the same flat/minimal style, 1px strokes, RTL layout and Farsi digits. Name shown everywhere is پت‌آباد. Your uploaded logo file is used for the wordmark (landing header, footer, chat header) at the same sizes Flowcart uses, and a matching mark for the assistant avatar. If you have a separate square icon-only version of the پت‌آباد logo, send it and I'll use it for the avatar and favicon; otherwise I'll derive the avatar from the uploaded logo.

## Technical notes

- New `pet_products` table (public read, service-role write) with GIN full-text index on normalised Persian text, trigram index on name/brand, and a vector index for embeddings; import runs through a one-off script/edge function using the service role.
- New RPCs mirroring the current ones: `pet_hybrid_search` and `pet_question_facets` (candidate counts, price quantiles, brands, species, tags) so clarifying-question options stay grounded in real data.
- New edge function `petabad-agent`, structurally identical to `gpt-commerce-agent` (same tool schema, product memory, reference resolution, sanitisation, response types, cart fast paths) but pointed at the pet table/RPCs with a pet master prompt. `gpt-commerce-agent` is not edited.
- Frontend cloned into `src/features/petabad/` and `src/components/petabad/`, with pages `PetAbad.tsx` and `MobilePetAbad.tsx` and a `petabad.config.ts` holding brand name, copy, chips, carousel definitions and category vocabulary. Scoped `--pa-*` orange tokens in a dedicated stylesheet — no global theme changes.
- Storage keys namespaced `petabad-*` so carts, baskets and sessions stay isolated from Flowcart.
- Reused shared primitives (chat UI atoms, WanderingEyes loader, TypingText, ShiningText) are imported, not forked, unless they hardcode Flowcart branding — those get pet variants.

## Order of work

1. Table + indexes + RPCs, import and validate the 1,700 rows, generate embeddings.
2. `petabad-agent` with pet prompt and grounded questions; test search/clarification quality against real data.
3. Clone desktop + mobile frontend, apply orange system, logo and pet copy.
4. Browser-test both routes end to end (discovery, clarifying cards, cart, checkout, login) and confirm Flowcart/Shift are unaffected.