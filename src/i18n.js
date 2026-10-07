// Page copy per locale. French is the default (served at /), English at /en/.
// French typography: \u00a0 is a non-breaking space (before « : », between a number and its unit).

// Legal notice facts, shared by both locales (source: RCS Carcassonne; host: GitHub Pages).
const company = {
    address: '10 rue Gaston Leroux, 11600 Conques-sur-Orbiel',
    rcs: 'Carcassonne 908 464 076',
    siret: '908 464 076 00029',
    vat: 'FR21908464076',
    host: 'GitHub, Inc.',
    hostAddress: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107',
    hostPhone: '+1 877 448 4820',
};

export const ui = {
    fr: {
        name: 'Français',
        description: 'SNOWCODES — Développement web et mobile, motion design et sites éditables par IA, pour les particuliers et les professionnels. Code. Create. Explore. Everything matters.',
        home: 'SNOWCODES — Accueil',
        language: 'Langue',
        nav: { reel: 'Showreel', services: 'Services', specs: 'Fiche technique', manifesto: 'Manifeste', showcase: 'Showcase', contact: 'Contact' },
        available: 'Disponible',
        heroSub: 'Développement web et mobile, motion design et sites éditables par IA.',
        stage: 'Animation\u00a0: un balayage de lumière dévoile le logo SNOWCODES, composé de pixels',
        stats: { since: 'Depuis', response: 'Délai de réponse', custom: 'Sur mesure' },
        write: 'Nous écrire',
        discover: 'Découvrir',
        reel: {
            title: 'Quinze secondes, zéro vidéo.',
            lead: 'Typographie cinétique, fluides, 3D, particules\u00a0: chaque image est calculée en direct, dans votre navigateur.',
            alt: 'Showreel SNOWCODES de 15\u00a0secondes, calculé en temps réel',
            play: 'Lecture',
            pause: 'Pause',
            seek: 'Position dans le showreel',
            chapters: ['Typographie', 'Cinétique', 'Fluide', '3D', 'Particules', 'Montage', 'Logo'],
        },
        services: {
            title: 'Conçu pour durer.',
            lead: 'Du code au mouvement, une seule exigence\u00a0: chaque détail compte, du premier commit à la mise en production.',
            items: [
                {
                    title: 'Développement sur mesure',
                    text: 'Développement web et mobile axé sur la qualité et la performance. Nous travaillons avec précision, en anticipant les évolutions, pour des solutions pérennes dès le premier jour.',
                    stat: 'Web · Mobile',
                    tags: 'API · Architecture',
                },
                {
                    title: 'Motion design',
                    text: 'Interfaces animées, logos et identités en mouvement, expériences interactives. Des animations fluides au service de votre message, comme sur cette page.',
                    stat: '60\u00a0fps',
                    tags: 'Logos · Interfaces · Interactions',
                },
                {
                    title: 'Sites éditables par IA',
                    text: 'Des sites statiques rapides et sécurisés, que vous mettez à jour vous-même\u00a0: il suffit de le demander à une IA. Pour les particuliers comme pour les professionnels.',
                    stat: 'Pour tous',
                    tags: 'Particuliers · Professionnels',
                },
                {
                    title: 'Maîtrise technologique',
                    text: 'Mobile avec Flutter, web avec Angular et React. Plus de 10\u00a0ans d’expérience pour livrer des solutions performantes sur chaque plateforme.',
                    stat: '+\u00a0de 10\u00a0ans',
                    tags: 'Flutter · Angular · React',
                },
                {
                    title: 'Code augmenté par l’IA',
                    text: 'Claude Code, Codex, Cursor, Grok Bot\u00a0: nous travaillons avec les meilleurs agents IA, intégrés à nos processus, pour livrer plus vite sans rien céder sur la qualité.',
                    stat: 'Agents IA',
                    tags: 'Claude Code · Codex · Cursor · Grok Bot',
                },
                {
                    title: 'Accompagnement continu',
                    text: 'De la première ligne de code à la mise en production. Un suivi rigoureux, itératif, aligné sur vos objectifs.',
                    stat: '<\u00a048\u00a0h',
                    tags: 'Conseil · Suivi · Production',
                },
            ],
        },
        specs: {
            title: 'Sous le capot.',
            lead: 'Des technologies éprouvées, choisies pour la performance et la longévité de vos produits.',
            rows: [
                { label: 'Mobile', tags: ['Flutter'] },
                { label: 'Web', tags: ['Angular', 'React'] },
                { label: 'Backend', tags: ['API', 'Cloud', 'Architecture'] },
                { label: 'Motion design', value: 'Animation web, interfaces et identités visuelles' },
                { label: 'Intelligence artificielle', tags: ['Claude Code', 'Codex', 'Cursor', 'Grok Bot'] },
                { label: 'Sites statiques', value: 'Éditables par IA, pour particuliers et professionnels' },
                { label: 'Méthode', value: 'Itérative, du cadrage à la mise en production' },
                { label: 'Délai de réponse', value: 'Moins de 48\u00a0heures' },
                { label: 'Localisation', value: 'France · depuis 2021' },
            ],
        },
        showcase: {
            title: 'Nos expérimentations.',
            lead: 'Prototypes, études de mouvement et idées en cours : ce que nous explorons quand personne ne nous le demande.',
            all: 'Voir tout le showcase',
        },
        manifesto: 'Trois verbes, une seule règle. Nous construisons des logiciels comme on façonne un objet\u00a0: avec patience, retenue et attention à chaque détail. Rien de superflu, rien d’oublié.',
        contact: {
            title: 'Parlons de votre projet.',
            lead: 'Particulier ou professionnel, décrivez-nous votre besoin\u00a0: nous vous répondons sous 48\u00a0heures.',
            since: 'Depuis',
            location: 'Localisation',
        },
        legal: {
            title: 'Mentions légales',
            show: 'Afficher',
            lead: 'Informations prévues par la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique.',
            sections: [
                {
                    title: 'Éditeur du site',
                    rows: [
                        { label: 'Dénomination', value: 'SNOWCODES' },
                        { label: 'Forme juridique', value: 'SARL au capital de 1 000 €' },
                        { label: 'Siège social', value: `${company.address}, France` },
                        { label: 'RCS', value: company.rcs },
                        { label: 'SIRET', value: company.siret },
                        { label: 'TVA intracommunautaire', value: company.vat },
                        { label: 'E-mail', reveal: 'mail' },
                        { label: 'Téléphone', reveal: 'tel' },
                        { label: 'Directeur de la publication', value: 'Alexandre Ruiz, gérant' },
                    ],
                },
                {
                    title: 'Hébergement',
                    rows: [
                        { label: 'Hébergeur', value: company.host },
                        { label: 'Adresse', value: `${company.hostAddress}, États-Unis` },
                        { label: 'Téléphone', value: company.hostPhone },
                    ],
                },
                {
                    title: 'Propriété intellectuelle',
                    text: [
                        'Sauf mention contraire, l’ensemble des contenus de ce site (textes, visuels, animations, logo et code) est la propriété de SNOWCODES. Toute reproduction, même partielle, sans autorisation écrite préalable est interdite. Les marques citées appartiennent à leurs propriétaires respectifs.',
                    ],
                },
                {
                    title: 'Données personnelles et cookies',
                    text: [
                        'Ce site ne dépose aucun cookie et n’utilise aucun outil de mesure d’audience, de publicité ou de suivi. Il ne contient aucun formulaire.',
                        'Lors de votre visite, votre adresse IP est transmise à notre hébergeur GitHub, qui la conserve à des fins de sécurité. GitHub étant établi aux États-Unis, ce transfert est encadré par le Data Privacy Framework UE–États-Unis, auquel GitHub adhère (<a href="https://www.dataprivacyframework.gov/participant/6174">inscription vérifiée le 7 octobre 2026</a>). Aucune autre requête n’est envoyée à un service tiers.',
                        'Si vous nous écrivez par e-mail, SNOWCODES utilise vos données uniquement pour vous répondre et assurer le suivi de nos échanges. Elles ne sont ni vendues ni cédées à des tiers.',
                        'Vous pouvez demander l’accès, la rectification ou l’effacement de vos données en écrivant à l’adresse ci-dessus. Vous pouvez aussi adresser une réclamation à la <a href="https://www.cnil.fr">CNIL</a>.',
                    ],
                },
            ],
        },
    },

    en: {
        name: 'English',
        description: 'SNOWCODES — Web and mobile development, motion design and AI-editable websites, for individuals and businesses. Code. Create. Explore. Everything matters.',
        home: 'SNOWCODES — Home',
        language: 'Language',
        nav: { reel: 'Showreel', services: 'Services', specs: 'Specs', manifesto: 'Manifesto', showcase: 'Showcase', contact: 'Contact' },
        available: 'Available',
        heroSub: 'Web and mobile development, motion design and AI-editable websites.',
        stage: 'Animation: a sweep of light unveils the SNOWCODES logo, made of pixels',
        stats: { since: 'Since', response: 'Response time', custom: 'Custom-built' },
        write: 'Get in touch',
        discover: 'Discover',
        reel: {
            title: 'Fifteen seconds. Zero video.',
            lead: 'Kinetic type, fluids, 3D, particles: every frame is computed live, right in your browser.',
            alt: '15-second SNOWCODES showreel, rendered in real time',
            play: 'Play',
            pause: 'Pause',
            seek: 'Showreel position',
            chapters: ['Typography', 'Kinetic', 'Fluid', '3D', 'Particles', 'Cuts', 'Logo'],
        },
        services: {
            title: 'Built to last.',
            lead: 'From code to motion, one standard: every detail matters, from the first commit to production.',
            items: [
                {
                    title: 'Custom development',
                    text: 'Web and mobile development focused on quality and performance. We work with precision and anticipate change, delivering durable solutions from day one.',
                    stat: 'Web · Mobile',
                    tags: 'API · Architecture',
                },
                {
                    title: 'Motion design',
                    text: 'Animated interfaces, logos and brand identities in motion, interactive experiences. Smooth animation that serves your message, just like on this page.',
                    stat: '60\u00a0fps',
                    tags: 'Logos · Interfaces · Interactions',
                },
                {
                    title: 'AI-editable websites',
                    text: 'Fast, secure static websites you update yourself: just ask an AI. For individuals and businesses alike.',
                    stat: 'For everyone',
                    tags: 'Individuals · Businesses',
                },
                {
                    title: 'Technical mastery',
                    text: 'Mobile with Flutter, web with Angular and React. Over 10\u00a0years of experience delivering high-performance software on every platform.',
                    stat: '10+ years',
                    tags: 'Flutter · Angular · React',
                },
                {
                    title: 'AI-augmented coding',
                    text: 'Claude Code, Codex, Cursor, Grok Bot: we work with the best AI agents, built into our process, to ship faster without compromising on quality.',
                    stat: 'AI agents',
                    tags: 'Claude Code · Codex · Cursor · Grok Bot',
                },
                {
                    title: 'Ongoing support',
                    text: 'From the first line of code to production. Rigorous, iterative follow-through, aligned with your goals.',
                    stat: '<\u00a048\u00a0h',
                    tags: 'Consulting · Support · Production',
                },
            ],
        },
        specs: {
            title: 'Under the hood.',
            lead: 'Proven technologies, chosen for the performance and longevity of your products.',
            rows: [
                { label: 'Mobile', tags: ['Flutter'] },
                { label: 'Web', tags: ['Angular', 'React'] },
                { label: 'Backend', tags: ['API', 'Cloud', 'Architecture'] },
                { label: 'Motion design', value: 'Web animation, interfaces and brand identities' },
                { label: 'Artificial intelligence', tags: ['Claude Code', 'Codex', 'Cursor', 'Grok Bot'] },
                { label: 'Static websites', value: 'AI-editable, for individuals and businesses' },
                { label: 'Method', value: 'Iterative, from scoping to production' },
                { label: 'Response time', value: 'Under 48\u00a0hours' },
                { label: 'Location', value: 'France · since 2021' },
            ],
        },
        showcase: {
            title: 'Our experiments.',
            lead: 'Prototypes, motion studies and work in progress: what we explore when nobody asks us to.',
            all: 'See the full showcase',
        },
        manifesto: 'Three verbs, one rule. We build software the way you would shape an object: with patience, restraint and attention to every detail. Nothing superfluous, nothing forgotten.',
        contact: {
            title: 'Let’s talk about your project.',
            lead: 'Whether you’re an individual or a business, tell us what you need: we’ll get back to you within 48\u00a0hours.',
            since: 'Since',
            location: 'Based in',
        },
        legal: {
            title: 'Legal notice',
            show: 'Show',
            lead: 'Information required by French law (Loi n° 2004-575 of 21 June 2004 on confidence in the digital economy).',
            sections: [
                {
                    title: 'Publisher',
                    rows: [
                        { label: 'Company name', value: 'SNOWCODES' },
                        { label: 'Legal form', value: 'SARL (limited liability company), share capital €1,000' },
                        { label: 'Registered office', value: `${company.address}, France` },
                        { label: 'Trade register (RCS)', value: company.rcs },
                        { label: 'SIRET', value: company.siret },
                        { label: 'EU VAT number', value: company.vat },
                        { label: 'Email', reveal: 'mail' },
                        { label: 'Phone', reveal: 'tel' },
                        { label: 'Publication director', value: 'Alexandre Ruiz, managing director' },
                    ],
                },
                {
                    title: 'Hosting',
                    rows: [
                        { label: 'Host', value: company.host },
                        { label: 'Address', value: `${company.hostAddress}, United States` },
                        { label: 'Phone', value: company.hostPhone },
                    ],
                },
                {
                    title: 'Intellectual property',
                    text: [
                        'Unless stated otherwise, all content on this site (text, visuals, animations, logo and code) is the property of SNOWCODES. Any reproduction, even partial, without prior written consent is prohibited. Trademarks mentioned belong to their respective owners.',
                    ],
                },
                {
                    title: 'Personal data and cookies',
                    text: [
                        'This site sets no cookies and uses no analytics, advertising or tracking tools. It contains no forms.',
                        'When you visit, your IP address is sent to our host GitHub, which stores it for security purposes. As GitHub is based in the United States, this transfer is covered by the EU–US Data Privacy Framework, in which GitHub participates (<a href="https://www.dataprivacyframework.gov/participant/6174">listing checked on 7 October 2026</a>). No other requests are made to third-party services.',
                        'If you email us, SNOWCODES uses your data only to reply and follow up on our conversation. It is never sold or shared with third parties.',
                        'You can request access to, correction or deletion of your data by writing to the address above. You may also lodge a complaint with the <a href="https://www.cnil.fr/en">CNIL</a>, the French data protection authority.',
                    ],
                },
            ],
        },
    },
};
