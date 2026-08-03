export interface AboutPartner {
    id: string;
    name: string;
    image: string;
}

export interface AboutFeature {
    id: string;
    title: string;
    body: string;
}

export interface AboutHistoryEntry {
    id: string;
    year: string;
    title: string;
    location: string;
    date: string;
    body: string;
    image: string;
}

export interface AboutPageData {
    missionTag: string;
    missionHeading: string;
    missionBody: string;
    missionImage: string;
    partnersHeading: string;
    partners: AboutPartner[];
    whyTag: string;
    whyHeading: string;
    features: AboutFeature[];
    historyTag: string;
    historyHeading: string;
    historyIntro: string;
    history: AboutHistoryEntry[];
}

export const DEFAULT_ABOUT_PAGE: AboutPageData = {
    missionTag: 'WHO WE ARE',
    missionHeading: 'Our mission is to create a space where students from all backgrounds come together to simulate the United Nations',
    missionBody: "At MYIMUN, we believe today's youth are tomorrow's global leaders. Through realistic UN simulations, we aim to sharpen participants' public speaking, negotiation, research, and leadership skills in a diverse, inclusive, and intellectually stimulating environment.",
    missionImage: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1000&q=85',
    partnersHeading: 'In Strategic Partnership With',
    partners: [
        { id: 'partner-a', name: 'AL AKHAWAYN UNIVERSITY', image: '' },
        { id: 'partner-un', name: 'UNITED NATIONS', image: '/assets/010-un.png' },
        { id: 'partner-encg', name: 'MUN ENCG', image: '' },
        { id: 'partner-myimun', name: 'MYIMUN NETWORK', image: '/assets/MYIMUN-BLUE-LOGO-VERTICAL.png' },
    ],
    whyTag: 'WHY CHOOSE MYIMUN?',
    whyHeading: 'We go beyond a typical Model UN conference.',
    features: [
        { id: 'feature-speaking', title: 'Public Speaking & Diplomacy', body: 'We train youth in confident communication, crisis handling, and persuasive diplomacy, skills they carry into school, careers, and leadership roles.' },
        { id: 'feature-academic', title: 'Academic Excellence', body: 'Our committees are led by experienced chairs and secretariat members, with carefully curated agendas based on real UN resolutions and current global issues.' },
        { id: 'feature-growth', title: 'Recognition & Growth', body: 'All delegates receive professional certificates. Award winners gain distinction in their academic and extracurricular records, with selected work shared for future chairs.' },
        { id: 'feature-safe', title: 'Safe & Inclusive Environment', body: 'We are committed to a respectful, harassment-free space. Delegates of all backgrounds are welcomed and encouraged to express their ideas openly.' },
        { id: 'feature-career', title: 'Career & Leadership Development', body: "It is a launchpad. Alumni have gone on to study at top universities, join youth parliaments, and intern at global organizations." },
        { id: 'feature-real', title: 'Real-World Preparation', body: 'We simulate not only debate but real diplomatic procedures, helping delegates understand international law, protocol, and multilateral decision-making.' },
    ],
    historyTag: 'MYIMUN HISTORY',
    historyHeading: 'Previous Conferences',
    historyIntro: 'Discover our previous conferences and see how MYIMUN has grown year after year.',
    history: [
        {
            id: 'history-2022-marrakech', year: '2022', title: 'MYIMUN First Step!',
            location: 'Marrakech, Morocco', date: '09th - 12th August 2022',
            body: 'Our first edition marked a bold and prestigious debut, setting a high standard for future conferences. Hosted in a luxurious hotel, this landmark event welcomed international delegates and launched a journey of youth diplomacy in Morocco.',
            image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85',
        },
        {
            id: 'history-2023-rabat', year: '2023', title: 'MYIMUN Rabat 2023',
            location: 'Rabat, Morocco', date: '25th - 28th May 2023',
            body: "A four-day conference in Morocco's capital brought together passionate youth for diplomacy, cultural exchange, and dynamic UN simulations. Delegates engaged in high-level debates across multiple committees and developed global awareness, critical thinking, and collaboration.",
            image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
        },
        {
            id: 'history-2023-marrakech', year: '2023', title: 'MYIMUN Marrakech 2023',
            location: 'Marrakech, Morocco', date: '18th - 21st August 2023',
            body: "This edition brought a vibrant blend of diplomacy and cultural immersion to one of Morocco's most iconic cities. Delegates explored global challenges through engaging committee sessions, crisis simulations, and collaborative debate.",
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=85',
        },
        {
            id: 'history-2024-tangier', year: '2024', title: 'MYIMUN Tangier 2024',
            location: 'Tangier, Morocco', date: '09th - 12th February 2024',
            body: 'A unique diplomatic experience in the gateway city between Africa and Europe. Delegates gathered in Tangier to explore pressing international issues through dynamic UN simulations and innovative debate.',
            image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=85',
        },
        {
            id: 'history-2024-marrakech', year: '2024', title: 'MYIMUN Marrakech 2024',
            location: 'Marrakech, Morocco', date: '19th - 22nd October 2024',
            body: 'An exceptional four-day diplomatic experience hosted in a prestigious hotel. Delegates enjoyed high-level debate, world-class hospitality, cultural immersion, vibrant networking, and unforgettable social activities.',
            image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=85',
        },
    ],
};

export function resolveAboutPage(saved: Partial<AboutPageData> | null | undefined): AboutPageData {
    if (!saved) return DEFAULT_ABOUT_PAGE;
    return {
        ...DEFAULT_ABOUT_PAGE,
        ...saved,
        partners: Array.isArray(saved.partners) ? saved.partners : DEFAULT_ABOUT_PAGE.partners,
        features: Array.isArray(saved.features) ? saved.features : DEFAULT_ABOUT_PAGE.features,
        history: Array.isArray(saved.history) ? saved.history : DEFAULT_ABOUT_PAGE.history,
    };
}
