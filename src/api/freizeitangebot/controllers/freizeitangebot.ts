/**
 * freizeitangebot controller
 */

import { factories } from '@strapi/strapi';

// ----------------- helpers (unchanged) -----------------
// ... escapeHtml, renderTextNode, renderNodes, renderBlock, renderRichText ...

export default factories.createCoreController(
    'api::freizeitangebot.freizeitangebot',
    ({ strapi }) => ({

        async find(ctx) {
            const { data, meta } = await super.find(ctx);

            const mapped = data.map((entry: any) => {
                const rich = entry.Beschreibung;

                const html =
                    Array.isArray(rich) ? renderRichText(rich) : rich || '';

                return {
                    ...entry,
                    Beschreibung: html,
                };
            });

            return { data: mapped, meta };
        },

        async findOne(ctx) {
            const { data, meta } = await super.findOne(ctx);

            if (data) {
                const rich = data.Beschreibung;

                const html =
                    Array.isArray(rich) ? renderRichText(rich) : rich || '';

                data.Beschreibung = html;
            }

            return { data, meta };
        },
    })
);
