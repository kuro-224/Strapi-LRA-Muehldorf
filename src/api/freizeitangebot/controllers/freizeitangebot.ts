/**
 * freizeitangebot controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
    'api::freizeitangebot.freizeitangebot',
    ({ strapi }) => ({
        async html(ctx) {
            const rawEntries = await strapi.entityService.findMany(
                'api::freizeitangebot.freizeitangebot',
                {
                    populate: { Bild: true, Tags: true },
                    sort: { Titel: "asc" }
                }
            );

            const entries = rawEntries as any[];

            // Mapping to English attribute model
            const mapped = entries.map((entry) => {
                const ort = entry.Ort ?? {};

                const coords =
                    typeof ort.lat === 'number' && typeof ort.lng === 'number'
                        ? { lat: ort.lat, lng: ort.lng }
                        : null;

                // -- flatten description blocks --
                let description = '';
                if (Array.isArray(entry.Beschreibung)) {
                    const parts: string[] = [];
                    entry.Beschreibung.forEach((block: any) => {
                        if (Array.isArray(block.children)) {
                            const blockText = block.children
                                .filter((c: any) => c.type === 'text')
                                .map((c: any) => c.text)
                                .join('');
                            if (blockText.trim()) parts.push(blockText);
                        }
                    });
                    description = parts.join('\n\n');
                }

                // -- images --
                const bilder = Array.isArray(entry.Bild) ? entry.Bild : [];

                const images = bilder
                    .map((img: any) => img?.formats?.small?.url ?? img?.url ?? '')
                    .filter((x) => !!x);

                const thumbnails = bilder
                    .map(
                        (img: any) =>
                            img?.formats?.thumbnail?.url ??
                            img?.formats?.small?.url ??
                            img?.url ??
                            ''
                    )
                    .filter((x) => !!x);

                // -- tags --
                const tags =
                    Array.isArray(entry.Tags) ?
                        entry.Tags.map((t: any) => t.Tagname).filter(Boolean)
                        : [];

                return {
                    id: String(entry.id),
                    title: entry.Titel ?? "",
                    description,
                    images,
                    thumbnails,
                    address: entry.Adresse ?? "",
                    coordinates: coords,
                    enabled: entry.Aktiv ?? false,
                    tags,
                    cta_url: entry.Website ?? "",
                    contact_email: entry.Email ?? "",
                    contact_number: entry.Telefonnummer ?? "",
                    contact_website: entry.Kontakt_Website ?? "",
                    last_updated: entry.updatedAt ?? "",
                };
            });

            // ---- HTML Output using English attribute names ----
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Activities</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: system-ui; padding: 2rem; background: #f5f5f5; }
    h1 { margin: 0 0 1.5rem 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 1.5rem; }
    .card { background: #fff; padding: 1rem; border-radius: .75rem; box-shadow: 0 2px 8px #0001; display: flex; flex-direction: column; gap: .75rem; }
    .card img { width: 100%; border-radius: .5rem; }
    .title { font-size: 1.2rem; font-weight: 600; margin: 0; }
    .badge { font-size: .75rem; background: #e0f7ff; color: #0369a1; padding: .15rem .5rem; border-radius: 999px; margin-left: .4rem; }
    .desc { white-space: pre-line; }
    .tag { padding: .15rem .6rem; background: #eef2ff; color: #3730a3; font-size: .75rem; border-radius: 999px; margin-right: .25rem; }
    .thumbs img { width: 60px; height: 60px; object-fit: cover; border-radius: .4rem; }
    .meta { font-size: .8rem; color: #666; margin-top: .5rem; }
  </style>
</head>
<body>
  <h1>Activities</h1>

  <div class="grid">
    ${mapped
                .map((item) => {
                    const coordsText = item.coordinates
                        ? `${item.coordinates.lat.toFixed(5)}, ${item.coordinates.lng.toFixed(
                            5
                        )}`
                        : '';

                    return `
      <article class="card">

        ${item.images[0] ? `<img src="${item.images[0]}" alt="${item.title}" />` : ''}

        <h2 class="title">
          ${item.title}
          ${
                        item.enabled
                            ? `<span class="badge">enabled</span>`
                            : `<span class="badge" style="background:#fee2e2;color:#b91c1c;">disabled</span>`
                    }
        </h2>

        ${item.address ? `<div><strong>Address:</strong> ${item.address}</div>` : ''}

        ${item.description ? `<div class="desc"><strong>Description:</strong> ${item.description}</div>` : ''}

        ${
                        item.tags.length
                            ? `<div><strong>Tags:</strong> ${item.tags
                                .map((t) => `<span class="tag">${t}</span>`)
                                .join('')}</div>`
                            : ''
                    }

        ${
                        item.thumbnails.length
                            ? `<div class="thumbs"><strong>Thumbnails:</strong><br>${item.thumbnails
                                .map((url) => `<img src="${url}" />`)
                                .join('')}</div>`
                            : ''
                    }

        ${
                        item.cta_url
                            ? `<div><strong>Website:</strong> <a href="${item.cta_url}" target="_blank">${item.cta_url}</a></div>`
                            : ''
                    }

        ${
                        item.contact_email || item.contact_number || item.contact_website
                            ? `<div><strong>Contact:</strong><br>
               ${item.contact_email ? `Email: ${item.contact_email}<br>` : ''}
               ${item.contact_number ? `Phone: ${item.contact_number}<br>` : ''}
               ${
                                item.contact_website
                                    ? `Website: <a href="${item.contact_website}" target="_blank">${item.contact_website}</a>`
                                    : ''
                            }
             </div>`
                            : ''
                    }

        <div class="meta">
          <strong>ID:</strong> ${item.id} <br>
          ${
                        coordsText
                            ? `<strong>Coordinates:</strong> ${coordsText} <br>`
                            : ''
                    }
          <strong>Last Updated:</strong> ${item.last_updated}
        </div>
      </article>
    `;
                })
                .join('')}
  </div>
</body>
</html>
`;

            ctx.set('Content-Type', 'text/html; charset=utf-8');
            ctx.body = html;
        },
    })
);
