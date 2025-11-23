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
                const content = renderTextNode(node);
                return content.trim() ? content : '';
            }

            // link
            if (node.type === 'link') {
                const content = renderNodes(node.children || []);
                if (!content.trim()) return ''; // prevent empty <a></a>

                const href = escapeHtml(node.url || '#');
                const target = node.target || '_blank';
                const rel = node.rel || 'noopener noreferrer';

                return `<a href="${href}" target="${escapeHtml(
                    target
                )}" rel="${escapeHtml(rel)}">${content}</a>`;
            }

            // image
            if (node.type === 'image') {
                const src = escapeHtml(node.url || node.src || '');
                if (!src) return '';
                const alt = escapeHtml(node.alt || '');
                return `<img src="${src}" alt="${alt}" />`;
            }

            // default / container nodes
            if (Array.isArray(node.children)) {
                return renderNodes(node.children);
            }

            return '';
        })
        .join('');

const renderBlock = (block: any): string => {
    const childrenHtml = renderNodes(block.children || []);

    // skip empty paragraphs completely
    if (block.type === 'paragraph') {
        if (!childrenHtml.trim()) return '';
        return `<p>${childrenHtml}</p>`;
    }

    // headings
    if (
        block.type === 'heading' ||
        block.type === 'heading-one' ||
        block.type === 'heading-two' ||
        block.type === 'heading-three' ||
        block.type === 'heading-four' ||
        block.type === 'heading-five' ||
        block.type === 'heading-six'
    ) {
        let level: number = block.level || 2;

        if (block.type === 'heading-one') level = 1;
        if (block.type === 'heading-two') level = 2;
        if (block.type === 'heading-three') level = 3;
        if (block.type === 'heading-four') level = 4;
        if (block.type === 'heading-five') level = 5;
        if (block.type === 'heading-six') level = 6;

        if (level < 1 || level > 6) level = 2;

        if (!childrenHtml.trim()) return '';
        return `<h${level}>${childrenHtml}</h${level}>`;
    }

    // lists
    if (block.type === 'list') {
        const tag = block.format === 'ordered' || block.ordered ? 'ol' : 'ul';
        const itemsHtml = (block.children || [])
            .map((li: any) => renderBlock(li))
            .filter(Boolean)
            .join('');
        if (!itemsHtml.trim()) return '';
        return `<${tag}>${itemsHtml}</${tag}>`;
    }

    if (block.type === 'list-item') {
        if (!childrenHtml.trim()) return '';
        return `<li>${childrenHtml}</li>`;
    }

    // quotes
    if (block.type === 'quote' || block.type === 'blockquote') {
        if (!childrenHtml.trim()) return '';
        return `<blockquote>${childrenHtml}</blockquote>`;
    }

    // code block
    if (block.type === 'code' || block.type === 'code-block') {
        if (!childrenHtml.trim()) return '';
        return `<pre><code>${childrenHtml}</code></pre>`;
    }

    // fallback
    return childrenHtml;
};

const renderRichText = (blocks: any[]): string => {
    if (!Array.isArray(blocks)) return '';
    return blocks.map((block) => renderBlock(block)).join('\n');
};

// ----------------- controller -----------------

export default factories.createCoreController(
    'api::freizeitangebot.freizeitangebot',
    ({ strapi }) => ({
        // Override list endpoint: GET /api/freizeitangebots
        async find(ctx) {
            // call the core controller
            // @ts-ignore - super is injected by Strapi
            const { data, meta } = await super.find(ctx);

            const mapped = data.map((entry: any) => {
                const attrs = entry.attributes || {};
                const rich = attrs.Beschreibung;

                const html =
                    Array.isArray(rich) ? renderRichText(rich) : rich || '';

                return {
                    ...entry,
                    attributes: {
                        ...attrs,
                        Beschreibung: html, // <-- now HTML string
                    },
                };
            });

            return { data: mapped, meta };
        },

        // Override single endpoint: GET /api/freizeitangebots/:id
        async findOne(ctx) {
            // @ts-ignore - super is injected by Strapi
            const result = await super.findOne(ctx);

            if (result?.data?.attributes) {
                const attrs = result.data.attributes;
                const rich = attrs.Beschreibung;

                const html =
                    Array.isArray(rich) ? renderRichText(rich) : rich || '';

                result.data.attributes = {
                    ...attrs,
                    Beschreibung: html, // <-- HTML string here too
                };
            }

            return result;
        },
    })
);
