// Experiments shown on /showcase, newest first. Add one: copy an entry, fill both locales.
// href: where the card leads (a page of the site, or a self-contained demo in public/lab/<slug>/).
export const experiments = [
    {
        year: 2026,
        tags: ['Canvas 2D', 'Oscilloscope', 'Motion'],
        fr: {
            title: 'Le studio à l’oscilloscope',
            text: 'Un seul faisceau trace toute la présentation du studio\u00a0: texte vectoriel, figures de Lissajous et phosphore vert qui s’estompe. Aucune vidéo, tout est calculé en direct.',
            href: '/lab/oscillo-studio/index.html',
        },
        en: {
            title: 'The studio, on an oscilloscope',
            text: 'A single beam traces the whole studio story: vector type, Lissajous figures and fading green phosphor. No video, everything is computed live.',
            href: '/lab/oscillo-studio/index.html?lang=en',
        },
    },
    {
        year: 2026,
        tags: ['CSS', 'Riso', 'Motion'],
        fr: {
            title: 'Le studio en risographie',
            text: 'La présentation du studio imprimée en trois encres, et animée\u00a0: passes d’impression, trames qui respirent, bandeaux qui défilent. Scrollez vite, l’encre glisse.',
            href: '/lab/riso-studio/index.html',
        },
        en: {
            title: 'The studio, risograph-printed',
            text: 'The studio’s story printed in three inks, in motion: print passes, breathing halftones, scrolling bands. Scroll fast and the ink slips.',
            href: '/lab/riso-studio/index.html?lang=en',
        },
    },
    {
        year: 2026,
        tags: ['Canvas 2D', 'Particules', 'Motion'],
        fr: {
            title: 'Matrice de lumière',
            text: 'Le logo SNOWCODES en pixels, dans un studio plongé dans le noir : un balayage de lumière le dévoile, puis un reflet glisse dessus de temps en temps. Sous le curseur, les pixels s’écartent, chauffent, puis reprennent leur place.',
            href: '/#top',
        },
        en: {
            title: 'Matrix of light',
            text: 'The SNOWCODES logo in pixels, in a pitch-dark studio: a sweep of light unveils it, then a glint glides over it now and then. Under the cursor, the pixels part, warm up, then settle back.',
            href: '/en/#top',
        },
    },
];
