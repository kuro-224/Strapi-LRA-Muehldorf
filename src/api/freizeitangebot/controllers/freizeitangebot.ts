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
    text = escapeHtml(text).replace(/\n/g, '<br />');

    if (node.code) text = `<code>${text}</code>`;
    if (node.bold) text = `<strong>${text}</strong>`;
    if (node.italic) text = `<em>${text}</em>`;
    if (node.underline) text = `<u>${text}</u>`;
    if (node.strikethrough || node.strike || node.striked)
        text = `<s>${text}</s>`;

    return text;
};

const renderNodes = (nodes: any[] = []): string =>
    nodes
        .map((node) => {
            if (!node) return '';

            if (node.type === 'text' || typeof node.text === 'string') {
                const content = renderTextNode(node);
                return content.trim() ? content : '';
            }

            if (node.type === 'link') {
                const content = renderNodes(node.children || []);
                if (!content.trim()) return '';

                const href = escapeHtml(node.url || '#');
                const target = escapeHtml(node.target || '_blank');
                const rel = escapeHtml(node.rel || 'noopener noreferrer');

                return `<a href="${href}" target="${target}" rel="${rel}">${content}</a>`;
            }

            if (node.type === 'image') {
                const src = escapeHtml(node.url || node.src || '');
                if (!src) return '';
                const alt = escapeHtml(node.alt || '');
                return `<img src="${src}" alt="${alt}" />`;
            }

            if (Array.isArray(node.children)) {
                return renderNodes(node.children);
            }

            return '';
        })
        .join('');

const renderBlock = (block: any): string => {
    const childrenHtml = renderNodes(block?.children || []);

    if (block.type === 'paragraph') {
        if (!childrenHtml.trim()) return '';
        return `<p>${childrenHtml}</p>`;
    }

    if (block.type?.startsWith('heading')) {
        let level = block.level || 2;
        if (level < 1 || level > 6) level = 2;
        if (!childrenHtml.trim()) return '';
        return `<h${level}>${childrenHtml}</h${level}>`;
    }

    if (block.type === 'list') {
        const tag = block.format === 'ordered' || block.ordered ? 'ol' : 'ul';
        const items = (block.children || [])
            .map((li: any) => renderBlock(li))
            .filter(Boolean)
            .join('');
        if (!items.trim()) return '';
        return `<${tag}>${items}</${tag}>`;
    }

    if (block.type === 'list-item') {
        if (!childrenHtml.trim()) return '';
        return `<li>${childrenHtml}</li>`;
    }

    if (block.type === 'quote' || block.type === 'blockquote') {
        if (!childrenHtml.trim()) return '';
        return `<blockquote>${childrenHtml}</blockquote>`;
    }

    if (block.type === 'code' || block.type === 'code-block') {
        if (!childrenHtml.trim()) return '';
        return `<pre><code>${childrenHtml}</code></pre>`;
    }

    return childrenHtml;
};

const renderRichText = (blocks: any[]): string => {
    if (!Array.isArray(blocks)) return '';
    return blocks.map((b) => renderBlock(b)).join('\n');
};

// ----------------- controller -----------------

export default factories.createCoreController(
    'api::freizeitangebot.freizeitangebot',
    // ❌ no "super" here
    ({ strapi }) => ({

        async find(ctx) {
            // ✅ use "super" directly inside the method
            const { data, meta } = await super.find(ctx);

            const mapped = (data || []).map((entry: any) => {
                const rich = entry.Beschreibung;
                const html =
                    Array.isArray(rich) ? renderRichText(rich) : (rich || '');

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
                    Array.isArray(rich) ? renderRichText(rich) : (rich || '');

                data.Beschreibung = html;
            }

            return { data, meta };
        },

    })
);
