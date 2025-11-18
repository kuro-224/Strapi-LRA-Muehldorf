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
                    },
                    sort: { Titel: 'asc' },
                    // filters: { Aktiv: true }, // optional: only active ones
                }
            );

            // Loosen typings so TS stops complaining about JSONValue / BlocksValue etc.
            const entries = rawEntries as any[];

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
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }
    .address {
      font-size: 0.9rem;
      color: #555;
    }
    .desc {
      font-size: 0.9rem;
      color: #333;
    }
    .meta {
      font-size: 0.85rem;
      color: #777;
      margin-top: auto;
    }
    .link {
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .link a {
      color: #2563eb;
      text-decoration: none;
    }
    .link a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>Freizeitangebote</h1>
  <div class="grid">
    ${entries
                .map((entry) => {
                    const titel: string = entry.Titel ?? '';

                    // Ort is stored as JSON, so we treat it as a simple object
                    const ort = entry.Ort as { lat?: number; lng?: number } | undefined;
                    const lat =
                        ort && typeof ort.lat === 'number' ? ort.lat : undefined;
                    const lng =
                        ort && typeof ort.lng === 'number' ? ort.lng : undefined;

                    const adresse: string = entry.Adresse ?? '';
                    const website: string = entry.Website ?? '';

                    // Beschreibung: extract a simple text from first paragraph
                    let descriptionText = '';
                    const beschreibung = entry.Beschreibung;
                    if (Array.isArray(beschreibung) && beschreibung.length > 0) {
                        const firstParagraph = beschreibung[0];
                        if (firstParagraph && Array.isArray(firstParagraph.children)) {
                            const textNode = firstParagraph.children.find(
                                (c: any) =>
                                    c.type === 'text' &&
                                    typeof c.text === 'string' &&
                                    c.text.trim().length > 0
                            );
                            if (textNode) {
                                descriptionText = textNode.text;
                            }
                        }
                    }

                    // Bild: first image, prefer medium -> small -> original
                    const bilder = entry.Bild as any[] | undefined;
                    const firstImage =
                        Array.isArray(bilder) && bilder.length > 0 ? bilder[0] : undefined;

                    const imageUrl: string =
                        firstImage?.formats?.medium?.url ??
                        firstImage?.formats?.small?.url ??
                        firstImage?.url ??
                        '';

                    const imageTag = imageUrl
                        ? `<img src="${imageUrl}" alt="${titel}" loading="lazy" />`
                        : '';

                    const coordsText =
                        lat != null && lng != null
                            ? `(${lat.toFixed(5)}, ${lng.toFixed(5)})`
                            : '';

                    const websiteLink = website
                        ? `<div class="link">Website: <a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a></div>`
                        : '';

                    return `
        <article class="card">
          ${imageTag}
          <h2 class="title">${titel}</h2>
          ${
                        adresse
                            ? `<div class="address">${adresse}</div>`
                            : ''
                    }
          ${
                        descriptionText
                            ? `<p class="desc">${descriptionText}</p>`
                            : ''
                    }
          ${websiteLink}
          <div class="meta">
            ID: ${entry.id}${coordsText ? ` · Koordinaten: ${coordsText}` : ''}
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
