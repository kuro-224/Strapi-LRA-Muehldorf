/**
 * freizeitangebot controller
 */

import { factories } from '@strapi/strapi';

// ----------------- helpers -----------------

const escapeHtml = (str: string = '') =>
    str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const renderTextNode = (node: any): string => {
    let text = typeof node.text === 'string' ? node.text : '';

    // keep line breaks
    text = escapeHtml(text).replace(/\n/g, '<br />');

    // inline marks
    if (node.code) {
        text = `<code>${text}</code>`;
    }
    if (node.bold) {
        text = `<strong>${text}</strong>`;
    }
    if (node.italic) {
        text = `<em>${text}</em>`;
    }
    if (node.underline) {
        text = `<u>${text}</u>`;
    }
    if (node.strikethrough || node.strike || node.striked) {
        text = `<s>${text}</s>`;
    }

    return text;
};

const renderNodes = (nodes: any[] = []): string =>
    nodes
        .map((node) => {
            if (!node) return '';

            // plain text
            if (node.type === 'text' || typeof node.text === 'string') {
                return renderTextNode(node);
            }

            // link
            if (node.type === 'link') {
                const href = escapeHtml(node.url || '#');
                const target = node.target || '_blank';
                const rel = node.rel || 'noopener noreferrer';
                const content = renderNodes(node.children || []) || href;

                return `<a href="${href}" target="${escapeHtml(
                    target
                )}" rel="${escapeHtml(rel)}">${content}</a>`;
            }

            // image in richtext (if you ever use it)
            if (node.type === 'image') {
                const src = escapeHtml(node.url || node.src || '');
                if (!src) return '';
                const alt = escapeHtml(node.alt || '');
                return `<img src="${src}" alt="${alt}" />`;
            }

            // fallback
            if (Array.isArray(node.children)) {
                return renderNodes(node.children);
            }

            return '';
        })
        .join('');

const renderBlock = (block: any): string => {
    const childrenHtml = renderNodes(block.children || []);

    switch (block.type) {
        case 'paragraph':
            return `<p>${childrenHtml}</p>`;

        // headings
        case 'heading':
        case 'heading-one':
        case 'heading-two':
        case 'heading-three':
        case 'heading-four':
        case 'heading-five':
        case 'heading-six': {
            let level: number = block.level || 2;

            if (block.type === 'heading-one') level = 1;
            if (block.type === 'heading-two') level = 2;
            if (block.type === 'heading-three') level = 3;
            if (block.type === 'heading-four') level = 4;
            if (block.type === 'heading-five') level = 5;
            if (block.type === 'heading-six') level = 6;

            if (level < 1 || level > 6) level = 2;
            return `<h${level}>${childrenHtml}</h${level}>`;
        }

        // lists
        case 'list': {
            const tag = block.format === 'ordered' || block.ordered ? 'ol' : 'ul';
            const itemsHtml = (block.children || [])
                .map((li: any) => renderBlock(li))
                .join('');
            return `<${tag}>${itemsHtml}</${tag}>`;
        }

        case 'list-item':
            return `<li>${childrenHtml}</li>`;

        // quotes
        case 'quote':
        case 'blockquote':
            return `<blockquote>${childrenHtml}</blockquote>`;

        // code block
        case 'code-block':
        case 'code':
            return `<pre><code>${childrenHtml}</code></pre>`;

        default:
            return childrenHtml;
    }
};

const renderRichText = (blocks: any[]): string => {
    if (!Array.isArray(blocks)) return '';
    return blocks.map((block) => renderBlock(block)).join('\n');
};

// map Strapi entry -> Listing shape
const mapEntryToListing = (entry: any) => {
    const ort = entry.Ort ?? {};

    const coordinates =
        typeof ort.lat === 'number' && typeof ort.lng === 'number'
            ? { lat: ort.lat, lng: ort.lng }
            : undefined;

    const descriptionHtml = renderRichText(entry.Beschreibung || []);

    const bilder = Array.isArray(entry.Bild) ? entry.Bild : [];

    // medium images for images[]
    const images: string[] = bilder
        .map(
            (img: any) =>
                img?.formats?.medium?.url ??
                img?.formats?.small?.url ??
                img?.url ??
                ''
        )
        .filter(Boolean);

    // thumbnail_* for thumbnails[]
    const thumbnails: string[] = bilder
        .map(
            (img: any) =>
                img?.formats?.thumbnail?.url ??
                img?.formats?.small?.url ??
                img?.url ??
                ''
        )
        .filter(Boolean);

    const tags: string[] = Array.isArray(entry.Tags)
        ? entry.Tags.map((t: any) => t.Tagname).filter(Boolean)
        : [];

    return {
        id: String(entry.id),
        title: entry.Titel ?? '',
        description: descriptionHtml, // HTML string

        images,
        thumbnails,

        address: entry.Adresse ?? undefined,
        coordinates,
        enabled: entry.Aktiv ?? false,

        tags,

        cta_url: entry.Website ?? undefined,
        contact_email: entry.Email ?? undefined,
        contact_phone: entry.Telefonnummer ?? undefined,
        contact_website: entry.Kontakt_Website ?? undefined,

        last_updated: entry.updatedAt ?? '',
    };
};

// ----------------- controller -----------------

export default factories.createCoreController(
    'api::freizeitangebot.freizeitangebot',
    ({ strapi }) => ({
        /**
         * HTML endpoint: renders Listing[] as cards
         * e.g. GET /freizeitangebots/html
         */
        async html(ctx) {
            const rawEntries = await strapi.entityService.findMany(
                'api::freizeitangebot.freizeitangebot',
                {
                    populate: {
                        Tags: true,
                        Bild: { populate: '*' },
                    },
                    sort: { Titel: 'asc' },
                }
            );

            const entries = rawEntries as any[];
            const listings = entries.map(mapEntryToListing);

            const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Freizeitangebote</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 2rem; background: #f5f5f5; }
    h1 { margin: 0 0 1.5rem 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 1.5rem; }
    .card { background: #fff; padding: 1rem; border-radius: .75rem; box-shadow: 0 2px 8px #0001; display: flex; flex-direction: column; gap: .75rem; }
    .card img.main { width: 100%; border-radius: .5rem; }
    .title { font-size: 1.2rem; font-weight: 600; margin: 0; }
    .badge { font-size: .75rem; background: #e0f7ff; color: #0369a1; padding: .15rem .5rem; border-radius: 999px; margin-left: .4rem; }
    .badge.badge-disabled { background:#fee2e2;color:#b91c1c; }
    .desc p { margin: .25rem 0; }
    .desc a { color: #2563eb; text-decoration: underline; }
    .desc code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background:#f3f4f6; padding:2px 4px; border-radius:4px; }
    .desc pre { background:#0f172a; color:#e5e7eb; padding:.75rem; border-radius:.5rem; overflow:auto; }
    .desc ul, .desc ol { padding-left: 1.25rem; margin: .25rem 0 .5rem; }
    .desc blockquote { border-left: 3px solid #e5e7eb; padding-left: .75rem; margin: .5rem 0; color:#4b5563; }
    .tag { padding: .15rem .6rem; background: #eef2ff; color: #3730a3; font-size: .75rem; border-radius: 999px; margin-right: .25rem; display:inline-block; margin-top:.25rem; }
    .thumbs img { width: 60px; height: 60px; object-fit: cover; border-radius: .4rem; margin-right:.25rem; margin-top:.25rem; }
    .meta { font-size: .8rem; color: #666; margin-top: .5rem; }
  </style>
</head>
<body>
  <h1>Freizeitangebote</h1>

  <div class="grid">
    ${listings
                .map((item) => {
                    const coordsText = item.coordinates
                        ? `${item.coordinates.lat.toFixed(5)}, ${item.coordinates.lng.toFixed(
                            5
                        )}`
                        : '';

                    return `
      <article class="card">

        ${item.images[0] ? `<img class="main" src="${item.images[0]}" alt="${escapeHtml(item.title)}" />` : ''}

        <h2 class="title">
          ${escapeHtml(item.title)}
          ${
                        item.enabled
                            ? `<span class="badge">aktiv</span>`
                            : `<span class="badge badge-disabled">inaktiv</span>`
                    }
        </h2>

        ${
                        item.address
                            ? `<div><strong>Adresse:</strong> ${escapeHtml(item.address)}</div>`
                            : ''
                    }

        ${
                        item.description
                            ? `<div class="desc"><strong>Beschreibung:</strong> ${item.description}</div>`
                            : ''
                    }

        ${
                        item.tags.length
                            ? `<div><strong>Tags:</strong> ${item.tags
                                .map((t: string) => `<span class="tag">${escapeHtml(t)}</span>`)
                                .join('')}</div>`
                            : ''
                    }

        ${
                        item.thumbnails.length
                            ? `<div class="thumbs"><strong>Bilder:</strong><br>${item.thumbnails
                                .map((url: string) => `<img src="${url}" alt="" />`)
                                .join('')}</div>`
                            : ''
                    }

        ${
                        item.cta_url
                            ? `<div><strong>Website:</strong> <a href="${item.cta_url}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                                item.cta_url
                            )}</a></div>`
                            : ''
                    }

        ${
                        item.contact_email || item.contact_phone || item.contact_website
                            ? `<div><strong>Kontakt:</strong><br>
               ${
                                item.contact_email
                                    ? `Email: ${escapeHtml(item.contact_email)}<br>`
                                    : ''
                            }
               ${
                                item.contact_phone
                                    ? `Telefon: ${escapeHtml(item.contact_phone)}<br>`
                                    : ''
                            }
               ${
                                item.contact_website
                                    ? `Website: <a href="${item.contact_website}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                                        item.contact_website
                                    )}</a>`
                                    : ''
                            }
             </div>`
                            : ''
                    }

        <div class="meta">
          <strong>ID:</strong> ${item.id} <br>
          ${
                        coordsText
                            ? `<strong>Koordinaten:</strong> ${coordsText} <br>`
                            : ''
                    }
          <strong>Zuletzt aktualisiert:</strong> ${escapeHtml(item.last_updated)}
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
