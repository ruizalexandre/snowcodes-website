import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://snowcodes.fr',
    server: { port: Number(process.env.PORT) || 4321 },
    i18n: {
        locales: ['fr', 'en'],
        defaultLocale: 'fr',
        routing: { prefixDefaultLocale: false },
    },
});
