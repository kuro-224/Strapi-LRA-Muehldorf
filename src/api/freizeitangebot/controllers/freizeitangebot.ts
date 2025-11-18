/**
 * freizeitangebot controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
    'api::freizeitangebot.freizeitangebot',
    ({ strapi }) => ({
        // GET /api/freizeitangebote/html
        async html(ctx) {
            const rawEntries = await strapi.entityService.findMany(
                'api::freizeitangebot.freizeitangebot',
                {
                    populate: {
                        Bild: true,
                        Tags: true,
                    },
                    sort: { Titel: 'asc' },
                    // filters: { Aktiv: true }, // optionally only enabled items
                }
            );

            const entries = rawEntries as any[]; // relax TS typing here

            type FreizeitangebotDTO = {
                id: string;
                title: string;
                description: string;
                images: string[];
                thumbnails: string[];
                address: string;
                coordinates: { lat: number; lng: number } | null;
                enabled: boolean;
                tags: string[];
                cta_url: string;
                contact_email: string;
                contact_number: string;
                contact_website: string;
                last_updated: string;
            };

            const mapped: FreizeitangebotDTO[] = entries.map((entry) => {
                // --- coordinates ---
                const ort = entry.Ort as { lat?: number; lng?: number } | undefined;
                const coords =
                    ort &&
                    typeof ort.lat === 'number' &&
                    typeof ort.lng === 'number'
                        ? { lat: ort.lat, lng: ort.lng }
                        : null;

                // --- description: flatten Blocks into plain text ---
                let description = '';
                const beschreibung = entry.Beschreibung;
                if (Array.isArray(beschreibung)) {
                    const parts: string[] = [];
                    beschreibung.forEach((block: any) => {
                        if (Array.isArray(block.children)) {
                            const blockText = block.children
                                .filter(
                                    (c: any) =>
                                        c.type === 'text' && typeof c.text === 'string'
                                )
                                .map((c: any) => c.text)
                                .join('');
                            if (blockText.trim()) {
                                parts.push(blockText.trim());
                            }
                        }
                    });
                    description = parts.join('\n\n');
                }

                // --- images & thumbnails ---
                const bilder = Array.isArray(entry.Bild) ? entry.Bild : [];

                const images: string[] = bilder
                    .map((img: any) => {
                        return (
                            img?.formats?.small?.url ??
                            img?.url ??
                            ''
                        );
                    })
                    .filter((url: string) => !!url);

                const thumbnails: string[] = bilder
                    .map((img: any) => {
                        return (
                            img?.formats?.thumbnail?.url ??
                            img?.formats?.small?.url ??
                            img?.url ??
                            ''
                        );
                    })
                    .filter((url: string) => !!url);

                // --- tags ---
                const tagsRaw = Array.isArray(entry.Tags) ? entry.Tags : [];
                const tags: string[] = tagsRaw
                    .map((t: any) => t.Tagname)
                    .filter((t: any) => typeof t === 'string' && t.length > 0);

                return {
                    id: String(entry.id),
                    title: entry.Titel ?? '',
                    description,
                    images,
                    thumbnails,
                    address: entry.Adresse ?? '',
                    coordinates: coords,
                    enabled: entry.Aktiv ?? false,
                    tags,
                    cta_url: entry.Website ?? '',
                    contact_email: entry.Email ?? '',
                    contact_number: entry.Telefonnummer ?? '',
                    contact_website: entry.Kontakt_Website ?? '',
                    last_updated: entry.updatedAt ?? '',
                };
            });

            const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Freizeitangebote</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0;
      padding: 2rem;
      background: #f5f5f5;
    }
    h1 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: white;
      border-radius: 0.75rem;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .card img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      display: block;
    }
    .title {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 0;
    }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #e5f6ff;
      color: #0369a1;
      margin-left: 0.4rem;
    }
    .address {
      font-size: 0.9rem;
      color: #555;
    }
    .desc {
      font-size: 0.9rem;
      color: #333;
      white-space: pre-line;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.25rem;
    }
    .tag {
      font-size: 0.75rem;
      padding: 0.1rem 0.6rem;
      border-radius: 999px;
      background: #eef2ff;
      color: #3730a3;
    }
    .thumbs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.25rem;
    }
    .thumbs img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 0.4rem;
    }
    .links {
      font-size: 0.9rem;
    }
    .links a {
      color: #2563eb;
      text-decoration: none;
    }
    .links a:hover {
      text-decoration: underline;
    }
    .meta {
      font-size: 0.8rem;
      color: #777;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <h1>Freizeitangebote</h1>
  <div class="grid">
    ${mapped
                .map((item) => {
                    const mainImage = item.images[0] ?? '';
                    const coordsText = item.coordinates
                        ? `${item.coordinates.lat.toFixed(5)}, ${item.coordinates.lng.toFixed(5)}`
                        : '';

                    const tagsHtml = item.tags
                        .map((t) => `<span class="tag">${t}</span>`)
                        .join('');

                    const thumbsHtml = item.thumbnails
                        .map((url) => `<img src="${url}" alt="Thumbnail ${item.title}" loading="lazy" />`)
                        .join('');

                    const contactLines: string[] = [];
                    if (item.contact_email) {
                        contactLines.push(
                            `E-Mail: <a href="mailto:${item.contact_email}">${item.contact_email}</a>`
                        );
                    }
                    if (item.contact_number) {
                        contactLines.push(
                            `Telefon: <a href="tel:${item.contact_number}">${item.contact_number}</a>`
                        );
                    }
                    if (item.contact_website) {
                        contactLines.push(
                            `Kontakt-Webseite: <a href="${item.contact_website}" target="_blank" rel="noopener noreferrer">${item.contact_website}</a>`
                        );
                    }

                    const contactHtml = contactLines.length
                        ? `<div class="links">${contactLines.join('<br />')}</div>`
                        : '';

                    const ctaHtml = item.cta_url
                        ? `<div class="links">Mehr Infos: <a href="${item.cta_url}" target="_blank" rel="noopener noreferrer">${item.cta_url}</a></div>`
                        : '';

                    return `
        <article class="card">
          ${
                        mainImage
                            ? `<img src="${mainImage}" alt="${item.title}" loading="lazy" />`
                            : ''
                    }
          <h2 class="title">
            ${item.title}
            ${
                        item.enabled
                            ? '<span class="badge">aktiv</span>'
                            : '<span class="badge" style="background:#fee2e2;color:#b91c1c;">inaktiv</span>'
                    }
          </h2>

          ${
                        item.address
                            ? `<div class="address">${item.address}</div>`
                            : ''
                    }

          ${
                        item.description
                            ? `<p class="desc">${item.description}</p>`
                            : ''
                    }

          ${
                        tagsHtml
                            ? `<div class="tags">${tagsHtml}</div>`
                            : ''
                    }

          ${
                        thumbsHtml
                            ? `<div class="thumbs">${thumbsHtml}</div>`
                            : ''
                    }

          ${ctaHtml}
          ${contactHtml}

          <div class="meta">
            ID: ${item.id}
            ${
                        coordsText
                            ? ` · Koordinaten: ${coordsText}`
                            : ''
                    }
            ${
                        item.last_updated
                            ? ` · Zuletzt aktualisiert: ${item.last_updated}`
                            : ''
                    }
          </div>
        </article>`;
                })
                .join('')}
  </div>
</body>
</html>`;

            ctx.set('Content-Type', 'text/html; charset=utf-8');
            ctx.body = html;
        },
    })
);
