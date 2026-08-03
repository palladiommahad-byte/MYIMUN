export interface CommitteeShowcaseItem {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    image: string;
}

export interface CommitteePageData {
    tag: string;
    heading: string;
    introduction: string;
    committees: CommitteeShowcaseItem[];
}

export const DEFAULT_COMMITTEE_PAGE: CommitteePageData = {
    tag: 'MYIMUN COMMITTEES',
    heading: 'Where Diplomacy Happens!',
    introduction: 'MYIMUN committees cover global and regional issues, from peace and health to development and cooperation.',
    committees: [
        {
            id: 'showcase-unsc',
            name: 'United Nations Security Council',
            abbreviation: 'UNSC',
            description: 'Responsible for maintaining international peace and security. Debates focus on conflict resolution, peacekeeping, and global threats.',
            image: '/assets/010-un.png',
        },
        {
            id: 'showcase-who',
            name: 'World Health Organization',
            abbreviation: 'WHO',
            description: 'A specialized agency focusing on global health challenges, pandemics, vaccine access, and strengthening healthcare systems worldwide.',
            image: '/assets/011-world.png',
        },
        {
            id: 'showcase-unhrc',
            name: 'United Nations Human Rights Council',
            abbreviation: 'UNHRC',
            description: 'Deals with the promotion and protection of human rights around the world, including violations, humanitarian crises, and freedom issues.',
            image: '/assets/010-un.png',
        },
        {
            id: 'showcase-fao',
            name: 'Food and Agriculture Organization',
            abbreviation: 'FAO',
            description: 'A UN body dedicated to ending hunger, achieving food security, improving nutrition, and promoting sustainable agriculture worldwide.',
            image: '/assets/011-world.png',
        },
        {
            id: 'showcase-unep',
            name: 'United Nations Environment Programme',
            abbreviation: 'UNEP',
            description: 'Leads discussions on climate change, sustainability, pollution control, and preserving biodiversity across the globe.',
            image: '/assets/011-world.png',
        },
        {
            id: 'showcase-arab-league',
            name: 'The League of Arab States',
            abbreviation: 'Arab League',
            description: 'A regional organization of Arab countries that addresses political, economic, and cultural issues while promoting unity, cooperation, and joint action.',
            image: '/assets/011-world.png',
        },
    ],
};

export function resolveCommitteePage(saved: Partial<CommitteePageData> | null | undefined): CommitteePageData {
    if (!saved) return DEFAULT_COMMITTEE_PAGE;
    return {
        ...DEFAULT_COMMITTEE_PAGE,
        ...saved,
        committees: Array.isArray(saved.committees) ? saved.committees : DEFAULT_COMMITTEE_PAGE.committees,
    };
}
