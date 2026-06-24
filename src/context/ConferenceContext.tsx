'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';

/* ── Types ── */
export interface Committee {
    id: number;
    name: string;
    abbr: string;
    delegates: number;
    topics: number;
    director: string;
    topicList: string[];
    logoUrl?: string;
}

export interface PositionPaper {
    id: number;
    delegateId: string;
    delegateName: string;
    committee: string;
    country: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    submittedAt: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
}

export interface CommitteeApplication {
    id: number;
    delegateId: string;
    delegateName: string;
    country: string;
    committeeAbbr: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    appliedAt: string;
    whyThisCommittee: string;
    preferredCountry: string;
    whyShouldWePickYou: string;
    assignedCountry?: string;
}

export interface EventAgendaItem {
    id: number; time: string; title: string; description: string; location: string;
    type: 'plenary' | 'committee' | 'break' | 'ceremony' | 'social' | 'other';
}
export interface EventDay { id: number; label: string; date: string; items: EventAgendaItem[]; }
export interface EventHotel {
    name: string; address: string; stars: number; phone: string; website: string;
    imageUrl: string; description: string; checkIn: string; checkOut: string;
    pricePerNight: string; bookingNote: string;
}
export interface ConferenceEvent {
    id: number; title: string; subtitle: string; edition: string;
    startDate: string; endDate: string; venue: string; address: string;
    city: string; country: string; description: string; guidelines: string[];
    bannerUrl: string; galleryUrls: string[];
    hotel: EventHotel | null; agenda: EventDay[];
    published: boolean; registrationDeadline: string; capacity: number; createdAt: string;
    certEditionNumber?: number;
    certDateDisplay?: string;
    certLocation?: string;
    certSignatory?: string;
    letterEditionYear?: string;
}

export interface ScheduleEvent {
    id: number;
    day: string;
    date: string;
    time: string;
    title: string;
    location: string;
    type: string;
    description: string;
}

export interface ChatMessage {
    id: number;
    text: string;
    sender: 'delegate' | 'admin';
    time: string;
}

export interface Conversation {
    id: number;
    delegateId: string;
    delegateName: string;
    delegateEmail: string;
    delegateCountry: string;
    subject: string;
    category: string;
    createdAt: string;
    lastMessageAt: string;
    messages: ChatMessage[];
    adminUnread: number;
    delegateUnread: number;
}

/// Notification center entry — `audience: 'staff'` rows are shared across every
/// admin/secretary/manager account; `audience: 'delegate'` rows are private to one delegate.
export interface AppNotification {
    id: number;
    audience: 'staff' | 'delegate';
    recipientId: string | null;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: string;
}

export interface Registration {
    id: number;
    delegateId: string;
    // Personal info
    fullName: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    heardFrom: string;
    // Experience
    firstTimeMun: boolean;       // first time participating in any MUN?
    attendedMyimunBefore: boolean; // participated in MYIMUN before?
    motivation: string;          // self-introduction & why they want to participate
    // ID document (passport / ID card for hotel reservation) — file lives in IndexedDB
    idDocName?: string;
    idDocSize?: number;
    idDocType?: string;
    idDocKey?: string;           // IndexedDB key to fetch the raw file
    // Participation type
    type: 'Individual' | 'Group';
    groupName?: string;
    groupSize?: number;
    institution?: string;
    // Status
    status: 'Pending' | 'Accepted' | 'Declined';
    declineReason?: string;
    submittedAt: string;
    // Payment
    paymentStatus: 'Unpaid' | 'Paid';
    // The delegate's account status (staff-only visibility) — 'inactive' means suspended platform-wide.
    accountStatus: 'active' | 'inactive';
}

export interface PaymentSubmission {
    id: number;
    delegateId: string;
    senderName: string;       // who actually paid (may be a parent)
    participantName: string;  // the delegate the payment is for
    amount: number;
    method: string;           // Bank Transfer, Credit Card, PayPal, Cash, Other
    packageId?: number;
    packageName?: string;
    // Receipt file lives in IndexedDB
    receiptName: string;
    receiptSize: number;
    receiptType: string;
    receiptKey: string;
    status: 'Pending' | 'Approved' | 'Declined';
    declineReason?: string;
    submittedAt: string;
}

export interface PaymentSettings {
    fee: number;
    currency: string;        // e.g. "USD", "$"
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
    swift: string;
    paypalEmail: string;
    instructions: string;    // free-text additional notes / other methods
}

export interface ConferenceSettings {
    registrationOpen: boolean;
    allowPaperUploads: boolean;
    publicSchedule: boolean;
    maintenanceMode: boolean;
    secretaryAccess: boolean;
    managerAccess: boolean;
}

export interface ConferencePackage {
    id: number;
    name: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
    emoji: string;
    logoUrl?: string;
    badge: string;
    hidden: boolean;
    color: string;
}

/* ── Landing page types ── */
export interface LandingHero {
    badge: string; headline: string; headlineAccent: string;
    subheadline: string; ctaPrimary: string; ctaSecondary: string;
    videoUrl: string; imageUrl: string;
    backgroundImages: string[]; // slideshow — cycles behind the hero when no video is set
    socialProofText: string; socialProofSub: string;
}
export interface LandingStat { value: number; suffix: string; label: string; }
export interface LandingAbout {
    eyebrow: string; title: string; titleAccent: string;
    body1: string; body2: string; tags: string[]; photo: string;
    testimonialName: string; testimonialRole: string;
}
export interface LandingConference {
    badge: string; eyebrow: string; title: string; body: string;
    date: string; location: string; delegates: string;
    checklist: string[]; ctaLabel: string; photo: string;
}
export interface LandingGallery { eyebrow: string; title: string; images: string[]; }
export interface LandingCommitteePhoto { committeeId: number; photo: string; }
export interface LandingTestimonial { name: string; role: string; quote: string; initials: string; }
export interface LandingCta { headline: string; subtext: string; ctaPrimary: string; ctaSecondary: string; }

/* ── New landing sections (the live redesigned landing page) ── */
export interface LandingTicker { text: string; }
export interface LandingWhoWeAre {
    tag: string; headingAccent: string; heading: string;
    stat1Prefix: string; stat1Value: string; stat1Label: string;
    stat2Prefix: string; stat2Value: string; stat2Label: string;
    body: string; cta: string; image: string;
}
export interface LandingPartner { name: string; image: string; }
export interface LandingPartners { heading: string; logos: LandingPartner[]; }
export interface LandingAnnouncement {
    tag: string; heading: string; subheading: string;
    paragraphs: string[]; bullets: string[]; cta: string; image: string;
}
export interface LandingGetStarted {
    tag: string; heading: string; cta: string; contactLabel: string; phone: string; image: string;
}
export interface LandingFaqItem { question: string; answer: string; }
export interface LandingFaq { tag: string; items: LandingFaqItem[]; }

export interface LandingFooterData {
    tagline: string; email: string; location: string;
    phone: string; hours: string; copyright: string;
}
export interface LandingPageData {
    hero: LandingHero;
    ticker: LandingTicker;
    whoWeAre: LandingWhoWeAre;
    partners: LandingPartners;
    announcement: LandingAnnouncement;
    getStarted: LandingGetStarted;
    faq: LandingFaq;
    // legacy sections (kept for the certificate date fallback + backwards compat)
    stats: [LandingStat, LandingStat, LandingStat, LandingStat];
    about: LandingAbout;
    conference: LandingConference;
    gallery: LandingGallery;
    committeePhotos: LandingCommitteePhoto[];
    testimonials: [LandingTestimonial, LandingTestimonial, LandingTestimonial];
    cta: LandingCta;
    footerData: LandingFooterData;
}

export const DEFAULT_LANDING: LandingPageData = {
    hero: {
        badge: 'Registration Open 2025',
        headline: 'Model United Nations',
        headlineAccent: 'MYIMUN',
        subheadline: 'MYIMUN is an international platform where youth simulate UN debates, represent countries, and develop diplomacy and leadership skills. Based in Morocco.',
        ctaPrimary: 'Register Now', ctaSecondary: 'Discover More',
        videoUrl: '', imageUrl: '',
        backgroundImages: [],
        socialProofText: '500+ Delegates', socialProofSub: 'from 50+ countries',
    },
    ticker: { text: "Registration is Closed. We'll be back soon." },
    whoWeAre: {
        tag: 'WHO WE ARE',
        headingAccent: 'MYIMUN :',
        heading: 'high-level debate, cultural exchange, and leadership growth.',
        stat1Prefix: '6th', stat1Value: 'Editions', stat1Label: 'And More',
        stat2Prefix: '', stat2Value: '+436', stat2Label: 'Participants',
        body: "Be part of Morocco's leading Model United Nations experience. Debate global issues, build leadership skills, and connect with passionate youth from across the world.",
        cta: 'Register Now', image: '',
    },
    partners: {
        heading: 'In Strategic Partnership With',
        logos: [
            { name: 'AL AKHAWAYN UNIVERSITY', image: '' },
            { name: 'United Nations', image: '/assets/010-un.png' },
            { name: 'MUN ENCG', image: '' },
            { name: 'ENCG CASABLANCA', image: '' },
        ],
    },
    announcement: {
        tag: "REGISTRATION IS CLOSED. WE'LL BE BACK SOON.",
        heading: 'MYIMUN Marrakech 2025 — Official Event Announcement',
        subheading: 'About the Conference',
        paragraphs: [
            'We are thrilled to announce the next edition of the **Moroccan Youth International Model United Nations** will take place in the vibrant city of **Marrakech October 2025**!',
            'Join passionate youth leaders, aspiring diplomats, and changemakers from around the world for four days of intense debate, cultural exchange, and unforgettable experiences.',
            "Whether you're a seasoned MUN participant or attending for the first time — MYIMUN is the place to challenge yourself, speak up, and shape tomorrow's global dialogue.",
        ],
        bullets: [
            'Opening & Closing Ceremonies',
            'Gala Night & Cultural Exchange',
            'Public Speaking & Diplomacy Workshops',
            'Guided Cultural Tour of Marrakech',
            'International Committees',
            'Diplomatic Dinner',
        ],
        cta: 'Register Now', image: '',
    },
    getStarted: {
        tag: 'GET STARTED TODAY',
        heading: 'Join us in Marrakech where youth lead, voices matter, and the world listens.',
        cta: 'Register Now', contactLabel: 'Message us:', phone: '+212 713 133 601', image: '',
    },
    faq: {
        tag: 'FREQUENTLY ASKED QUESTIONS',
        items: [
            { question: 'What Is MYIMUN?', answer: 'MYIMUN is the Moroccan Youth International Model United Nations — a youth conference where participants simulate UN committees, debate global issues, and develop diplomacy and leadership skills.' },
            { question: 'What Is Included In The Participation Fee?', answer: 'The fee includes access to all committee sessions, conference materials, networking events, and select meals during the conference days.' },
            { question: 'Who Can Participate In MYIMUN?', answer: 'Students and young people passionate about international affairs, public speaking, and diplomacy are welcome, regardless of prior MUN experience.' },
            { question: 'Can I Attend If I Live In Another City Or Country?', answer: 'Absolutely — MYIMUN welcomes delegates from across Morocco and around the world. Accommodation options are available for travelling participants.' },
            { question: 'How Can I Participate?', answer: 'Register through our online platform, complete your application, and once accepted, secure your spot by completing the participation fee.' },
            { question: 'Do I Need Previous Experience To Participate?', answer: 'No prior experience is required. We provide workshops and study materials to help first-time delegates feel confident and prepared.' },
            { question: 'Why Do Participants Need To Pay A Fee?', answer: 'The fee covers conference logistics, materials, venue, meals, and the activities that make the MYIMUN experience possible.' },
            { question: 'Can I Cancel My Registration?', answer: 'Cancellation policies are outlined during registration. Please contact our team directly for any cancellation or refund requests.' },
            { question: 'How Do I Prepare For MYIMUN?', answer: 'Once assigned a committee and country, research your topics, prepare a position paper, and review the provided study guides ahead of the conference.' },
            { question: 'Will I Receive A Certificate?', answer: 'Yes — all participants receive an official certificate of participation, and outstanding delegates are recognized with awards.' },
        ],
    },
    stats: [
        { value: 500, suffix: '+', label: 'Delegates' },
        { value: 50,  suffix: '+', label: 'Countries'  },
        { value: 12,  suffix: '',  label: 'Committees' },
        { value: 10,  suffix: '',  label: 'Awards'     },
    ],
    about: {
        eyebrow: 'About MYIMUN', title: 'What is', titleAccent: 'Model United Nations?',
        body1: 'Model United Nations (MUN) is an educational simulation where students learn about diplomacy, international relations, and the United Nations. Participants represent countries and work together to solve real-world problems.',
        body2: 'MYIMUN 2025 brings together the brightest young minds from across the globe in a premium conference experience designed to challenge, inspire, and connect.',
        tags: ['Global Issues', 'Public Speaking', 'Diplomacy', 'Leadership'],
        photo: '', testimonialName: 'Aminata Diop', testimonialRole: 'Best Delegate 2024 · Senegal',
    },
    conference: {
        badge: '⚡ Limited Spots Available', eyebrow: 'MYIMUN 2025 — Casablanca',
        title: 'Official Conference Announcement',
        body: 'MYIMUN 2025 is set to be our most ambitious edition yet — bringing together delegates from over 50 countries for four days of intensive debate, cultural exchange, and unforgettable experiences in the heart of Morocco.',
        date: 'September 15–18, 2025', location: 'Casablanca, Morocco', delegates: '500+ Delegates',
        checklist: ['Opening & Closing Ceremonies', 'Public Speaking Workshops', 'Live Hague Simulation', 'Cultural Exchange Evening', 'Diplomatic Dinners', 'Guided Tour of the Medina'],
        ctaLabel: 'Register Now', photo: '',
    },
    gallery: { eyebrow: 'Gallery', title: 'Moments from MYIMUN', images: [] },
    committeePhotos: [],
    testimonials: [
        { name: 'Sarah Johnson',  role: 'Delegate 2024 · UK',      quote: 'The most immersive MUN experience I have ever had. World-class organization and incredible debates that challenged me every step of the way.', initials: 'SJ' },
        { name: 'David Khoury',   role: 'Delegate 2024 · Lebanon', quote: 'Incredible debates, amazing social events, and a team that genuinely cares about every delegate. I made connections for life at MYIMUN.', initials: 'DK' },
        { name: 'Maria González', role: 'Chair 2024 · Spain',      quote: 'As a chair, I was blown away by the delegate quality and seamless logistics. MYIMUN sets the bar for what MUN should be.', initials: 'MG' },
    ],
    cta: {
        headline: 'Ready to Lead?',
        subtext: 'Secure your spot at MYIMUN 2025 — the most anticipated conference of the year. Limited places available.',
        ctaPrimary: 'Register Now', ctaSecondary: 'Learn More',
    },
    footerData: {
        tagline: 'Moroccan International Youth Model United Nations — shaping the next generation of global leaders.',
        email: 'info@myimun.org', location: 'Casablanca, Morocco',
        phone: '+212 713 133 601', hours: 'Monday to Friday: 9 am – 6 pm',
        copyright: '© 2025 MYIMUN  |  All Rights Reserved',
    },
};

/**
 * Browsers that saved landing-page state before the hero redesign have a `hero`
 * object with no `backgroundImages` field — that's the version marker. Treat
 * that as stale and adopt the fresh hero defaults instead of merging onto it,
 * so the new copy/layout actually shows up without the admin re-typing everything.
 * Any other saved landing-page section (about, gallery, etc.) is left untouched.
 */
function resolveLandingPage(saved: Partial<LandingPageData> | undefined): LandingPageData {
    if (!saved) return DEFAULT_LANDING;
    const heroIsStale = !saved.hero || !Array.isArray(saved.hero.backgroundImages);
    return {
        ...DEFAULT_LANDING,
        ...saved,
        hero:         heroIsStale ? DEFAULT_LANDING.hero : { ...DEFAULT_LANDING.hero, ...saved.hero },
        // New redesigned sections — merge each onto defaults so older saved state gains them.
        ticker:       { ...DEFAULT_LANDING.ticker,       ...saved.ticker },
        whoWeAre:     { ...DEFAULT_LANDING.whoWeAre,     ...saved.whoWeAre },
        partners:     { ...DEFAULT_LANDING.partners,     ...saved.partners },
        announcement: { ...DEFAULT_LANDING.announcement, ...saved.announcement },
        getStarted:   { ...DEFAULT_LANDING.getStarted,   ...saved.getStarted },
        faq:          { ...DEFAULT_LANDING.faq,          ...saved.faq },
        footerData:   { ...DEFAULT_LANDING.footerData,   ...saved.footerData },
    };
}

/* ── Seed data ── */
const SEED_COMMITTEES: Committee[] = [
    { id: 1, name: 'United Nations Security Council', abbr: 'UNSC', delegates: 15, topics: 2, director: 'Dr. Sarah Al-Fayed', topicList: ['Cybersecurity Threats & State Actors', 'Nuclear Non-Proliferation Treaty'] },
    { id: 2, name: 'World Health Organization',        abbr: 'WHO',  delegates: 45, topics: 3, director: 'Dr. James Kim',      topicList: ['Pandemic Preparedness in 2030', 'Global Vaccine Access & Equity', 'Mental Health Crisis'] },
    { id: 3, name: 'Disarmament & International Security', abbr: 'DISEC', delegates: 80, topics: 2, director: 'Ambassador Liu Zhang', topicList: ['Small Arms & Light Weapons Trafficking', 'Space Militarization'] },
    { id: 4, name: 'United Nations Human Rights Council', abbr: 'UNHRC', delegates: 40, topics: 2, director: 'Prof. Amina Diallo', topicList: ['Digital Surveillance & Privacy Rights', 'Refugee & Stateless Persons Rights'] },
];

const SEED_SCHEDULE: ScheduleEvent[] = [
    { id: 101, day: 'Day 1', date: 'Friday, Oct 12',   time: '08:00 AM', title: 'Registration & Kit Pickup',  location: 'Grand Foyer',      type: 'Logistics', description: 'Pick up your delegate handbook, badges, and placards.' },
    { id: 102, day: 'Day 1', date: 'Friday, Oct 12',   time: '10:00 AM', title: 'Opening Ceremony',           location: 'Royal Auditorium', type: 'Keynote',   description: 'Keynote by Secretary General and guest speaker Dr. Amina J. Mohammed.' },
    { id: 103, day: 'Day 1', date: 'Friday, Oct 12',   time: '12:00 PM', title: 'Networking Lunch',           location: 'Gardens',          type: 'Break',     description: 'A casual lunch to meet fellow delegates before sessions begin.' },
    { id: 104, day: 'Day 1', date: 'Friday, Oct 12',   time: '01:30 PM', title: 'Committee Session I',        location: 'Breakout Rooms',   type: 'Session',   description: 'Setting the agenda and opening speeches.' },
    { id: 105, day: 'Day 2', date: 'Saturday, Oct 13', time: '09:00 AM', title: 'Committee Session II',       location: 'Breakout Rooms',   type: 'Session',   description: 'Drafting working papers and forming blocs.' },
    { id: 106, day: 'Day 2', date: 'Saturday, Oct 13', time: '12:00 PM', title: 'Lunch Symposium',            location: 'Banquet Hall',     type: 'Special',   description: "Panel: 'The Future of Digital Diplomacy' with industry experts." },
    { id: 107, day: 'Day 2', date: 'Saturday, Oct 13', time: '02:00 PM', title: 'Committee Session III',      location: 'Breakout Rooms',   type: 'Session',   description: 'Introduction of draft resolutions and amendment debates.' },
    { id: 108, day: 'Day 2', date: 'Saturday, Oct 13', time: '08:00 PM', title: 'Gala Night',                 location: 'Poolside',         type: 'Social',    description: 'A magical evening under the stars with live music and dancing.' },
    { id: 109, day: 'Day 3', date: 'Sunday, Oct 14',   time: '09:30 AM', title: 'Committee Session IV',       location: 'Breakout Rooms',   type: 'Session',   description: "Voting on resolutions. Final chance to secure your country's interests." },
    { id: 110, day: 'Day 3', date: 'Sunday, Oct 14',   time: '12:30 PM', title: 'Closing Ceremony',           location: 'Royal Auditorium', type: 'Keynote',   description: 'Awards presentation for Best Delegate and Outstanding Delegations.' },
    { id: 111, day: 'Day 3', date: 'Sunday, Oct 14',   time: '02:00 PM', title: 'Farewell Tea',               location: 'Lobby Lounge',     type: 'Social',    description: 'Say goodbye to new friends and exchange contacts.' },
    { id: 112, day: 'Day 4', date: 'Monday, Oct 15',   time: '10:00 AM', title: 'City Tour (Optional)',        location: 'Medina Entrance',  type: 'Excursion', description: 'Guided tour of the historic Medina, Souks, and Bahia Palace.' },
    { id: 113, day: 'Day 4', date: 'Monday, Oct 15',   time: '02:00 PM', title: 'Airport Transfers',           location: 'Hotel Lobby',      type: 'Logistics', description: 'Shuttles departing every hour for RAK Airport.' },
];

const SEED_CONVERSATIONS: Conversation[] = [
    {
        id: 9001, delegateId: '123', delegateName: 'Honorable Delegate',
        delegateEmail: 'delegate@myimun.org', delegateCountry: 'France',
        subject: 'Visa Application Support', category: 'Logistics',
        createdAt: 'Yesterday, 9:00 AM', lastMessageAt: '10:30 AM',
        adminUnread: 0, delegateUnread: 0,
        messages: [
            { id: 1, text: 'Hello, I need an official invitation letter for my visa application. Could you please provide one?', sender: 'delegate', time: 'Yesterday, 9:00 AM' },
            { id: 2, text: 'Hi, we are processing your request. It should be ready by tomorrow.', sender: 'admin', time: 'Yesterday, 2:00 PM' },
            { id: 3, text: 'Please find attached your official invitation letter. Safe travels!', sender: 'admin', time: '10:30 AM' },
        ],
    },
    {
        id: 9002, delegateId: '123', delegateName: 'Honorable Delegate',
        delegateEmail: 'delegate@myimun.org', delegateCountry: 'France',
        subject: 'Position Paper Feedback', category: 'Committee',
        createdAt: 'Mon, 4:00 PM', lastMessageAt: 'Yesterday',
        adminUnread: 0, delegateUnread: 1,
        messages: [
            { id: 1, text: "I've submitted my position paper. When can I expect feedback?", sender: 'delegate', time: 'Mon, 4:00 PM' },
            { id: 2, text: 'Great work on the paper. A few comments on the policy proposals have been added.', sender: 'admin', time: 'Yesterday, 11:15 AM' },
        ],
    },
];

const SEED_PACKAGES: ConferencePackage[] = [
    {
        id: 1001, name: 'Non-Accommodation Plan', price: 150, currency: 'USD',
        description: 'For local delegates or those with their own accommodation. Covers all conference sessions.',
        features: ['Full conference access (3 days)', 'Delegate handbook & materials', 'All committee sessions', 'Networking lunches (Day 1 & 2)', 'Certificate of participation'],
        emoji: '📋', badge: '', hidden: false, color: '#3B7FFF',
    },
    {
        id: 1002, name: 'Accommodation Plan', price: 350, currency: 'USD',
        description: 'Includes 3-night hotel stay at the conference venue with daily breakfast.',
        features: ['Everything in Non-Accommodation Plan', '3 nights hotel accommodation', 'Daily breakfast included', 'Airport pickup & drop-off', 'Conference shuttle service'],
        emoji: '🏨', badge: 'Most Popular', hidden: false, color: '#7C5FFF',
    },
    {
        id: 1003, name: 'Full Experience Plan', price: 550, currency: 'USD',
        description: 'The ultimate MYIMUN experience with exclusive perks, VIP access, and all activities.',
        features: ['Everything in Accommodation Plan', 'Gala Night tickets (×2)', 'Guided City Tour (Day 4)', 'VIP seating at all ceremonies', 'Exclusive delegate gift bag', 'Priority committee selection'],
        emoji: '⭐', badge: 'Best Value', hidden: false, color: '#F59E0B',
    },
];

const SEED_EVENTS: ConferenceEvent[] = [{
    id: 1, title: 'MYIMUN 2026', subtitle: 'Model United Nations Conference', edition: '12th Annual Edition',
    startDate: '2026-09-15', endDate: '2026-09-18',
    venue: 'Royal Hotel Conference Center', address: '12 Boulevard Mohammed V', city: 'Casablanca', country: 'Morocco',
    description: 'MYIMUN 2026 is the 12th annual edition of our prestigious Model United Nations conference. Bringing together over 300 delegates from across the globe to engage in high-level diplomatic simulations, debate pressing international issues, and forge lifelong connections.\n\nThis year\'s theme focuses on "Global Resilience: Building a Sustainable Future Together." Delegates will explore the most critical challenges facing our world — from climate action and economic inequality to cybersecurity and public health — and draft concrete resolutions to address them.',
    guidelines: [
        'All delegates must carry their official delegate badge at all times during the conference.',
        'Formal Western business attire or national formal dress is required for all committee sessions and ceremonies.',
        'Mobile phones must be set to silent mode during all committee sessions and formal events.',
        'Delegates are expected to maintain decorum and respect all persons at all times.',
        'All position papers must be submitted no later than two weeks before the conference starts.',
        'Delegates must attend all scheduled sessions — three or more unexcused absences may result in disqualification from awards.',
        'Photography and video recording are not permitted during formal voting procedures.',
        'All conference materials and resources remain the intellectual property of MYIMUN.',
        'Delegate accommodation bookings must be made through the official hotel partner using the provided promo code.',
        'Any violations of the code of conduct will result in immediate disqualification.',
    ],
    bannerUrl: '', galleryUrls: [],
    hotel: {
        name: 'Royal Atlantic Hotel', address: '14 Avenue des FAR, Casablanca 20000', stars: 5,
        phone: '+212 522 000 000', website: 'www.royalatlantic.ma', imageUrl: '',
        description: 'Our official conference hotel offers luxurious 5-star accommodation steps away from the main venue. Delegates enjoy exclusive conference rates, complimentary buffet breakfast, high-speed Wi-Fi, and full access to hotel amenities including rooftop pool, state-of-the-art fitness center, and wellness spa.',
        checkIn: '14:00', checkOut: '12:00', pricePerNight: '$120 / night',
        bookingNote: 'Use code MYIMUN2026 when booking online or by phone to receive the exclusive delegate rate. Rooms are limited — we strongly advise booking early to secure your preferred room type.',
    },
    agenda: [
        { id: 1, label: 'Day 1', date: '2026-09-15', items: [
            { id: 1, time: '09:00', title: 'Delegate Registration & Welcome', description: 'Pick up your badge, welcome pack, and connect with fellow delegates.', location: 'Main Lobby', type: 'ceremony' },
            { id: 2, time: '11:00', title: 'Opening Ceremony', description: 'Official opening with keynote speeches from the Secretary-General and distinguished guests.', location: 'Grand Ballroom', type: 'ceremony' },
            { id: 3, time: '13:00', title: 'Lunch Break', description: 'Buffet lunch provided for all registered delegates.', location: 'Hotel Restaurant', type: 'break' },
            { id: 4, time: '14:30', title: 'First Committee Session', description: 'Delegates deliver opening speeches and introduce their national positions on agenda items.', location: 'Committee Rooms', type: 'committee' },
            { id: 5, time: '18:00', title: 'Welcome Networking Reception', description: 'Meet delegates and secretariat staff over light refreshments on the rooftop.', location: 'Rooftop Terrace', type: 'social' },
        ]},
        { id: 2, label: 'Day 2', date: '2026-09-16', items: [
            { id: 6, time: '09:00', title: 'Morning Committee Sessions', description: 'Moderated caucuses, formal debate, and amendment procedures.', location: 'Committee Rooms', type: 'committee' },
            { id: 7, time: '12:30', title: 'Lunch Break', description: '', location: 'Hotel Restaurant', type: 'break' },
            { id: 8, time: '14:00', title: 'Afternoon Committee Sessions', description: 'Unmoderated caucuses and collaborative working paper drafting.', location: 'Committee Rooms', type: 'committee' },
            { id: 9, time: '19:30', title: 'Delegate Gala Dinner', description: 'Black-tie formal dinner featuring live music and cultural performances.', location: 'Grand Ballroom', type: 'social' },
        ]},
        { id: 3, label: 'Day 3', date: '2026-09-17', items: [
            { id: 10, time: '09:00', title: 'Committee Sessions & Voting', description: 'Final debate rounds, amendments, and formal voting procedures on all resolutions.', location: 'Committee Rooms', type: 'committee' },
            { id: 11, time: '12:30', title: 'Lunch Break', description: '', location: 'Hotel Restaurant', type: 'break' },
            { id: 12, time: '14:00', title: 'City Cultural Tour', description: 'Guided tour of the Old Medina and Hassan II Mosque — one of the world\'s largest mosques.', location: 'City Center', type: 'social' },
            { id: 13, time: '18:00', title: 'Plenary Session', description: 'All delegates reconvene to review and formally adopt committee resolutions.', location: 'Grand Ballroom', type: 'plenary' },
        ]},
        { id: 4, label: 'Day 4', date: '2026-09-18', items: [
            { id: 14, time: '10:00', title: 'Closing Ceremony', description: 'Award presentations, Best Delegate recognition, and farewell addresses from the Secretariat.', location: 'Grand Ballroom', type: 'ceremony' },
            { id: 15, time: '12:00', title: 'Farewell Lunch', description: 'Final meal together before delegates depart.', location: 'Hotel Restaurant', type: 'break' },
            { id: 16, time: '14:00', title: 'Delegate Check-out & Departure', description: 'Hotel check-out and farewell.', location: 'Main Lobby', type: 'other' },
        ]},
    ],
    published: true, registrationDeadline: '2026-08-15', capacity: 300, createdAt: '2026-01-01',
    certEditionNumber: 8,
    certDateDisplay: 'September 15–18, 2026',
    certLocation: 'Marrakech',
    certSignatory: 'Mustapha Ait Mbark',
    letterEditionYear: '8th Annual Edition 2026',
}];

const SEED_CONFERENCE_SETTINGS: ConferenceSettings = {
    registrationOpen: true,
    allowPaperUploads: true,
    publicSchedule: true,
    maintenanceMode: false,
    secretaryAccess: true,
    managerAccess: true,
};

const SEED_PAYMENT_SETTINGS: PaymentSettings = {
    fee: 150,
    currency: 'USD',
    bankName: 'MYIMUN Bank',
    accountName: 'MYIMUN Events Ltd.',
    accountNumber: '0001234567',
    iban: 'MA00 1234 5678 9012 3456',
    swift: 'MYIMMAMC',
    paypalEmail: 'payments@myimun.org',
    instructions: 'Please include your full name as the transfer reference. After paying, upload your receipt below for verification.',
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/* ── localStorage helpers ── */
const STORE_KEY = 'myimun_conference_v1';

interface StoredState {
    committees: Committee[];
    papers: PositionPaper[];
    applications: CommitteeApplication[];
    waitingCounts: Record<string, number>;
    scheduleEvents: ScheduleEvent[];
    conversations: Conversation[];
    registrations: Registration[];
    payments: PaymentSubmission[];
    paymentSettings: PaymentSettings;
    packages: ConferencePackage[];
    events: ConferenceEvent[];
    landingPage: LandingPageData;
    conferenceSettings: ConferenceSettings;
}

function readStorage(): StoredState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORE_KEY);
        return raw ? (JSON.parse(raw) as StoredState) : null;
    } catch { return null; }
}

function stripBlobs(state: StoredState): StoredState {
    const lp = state.landingPage ?? DEFAULT_LANDING;
    return {
        ...state,
        papers: state.papers.map(p =>
            p.fileUrl.startsWith('data:') ? { ...p, fileUrl: '' } : p
        ),
        events: state.events.map(ev => ({
            ...ev,
            bannerUrl: ev.bannerUrl.startsWith('data:') ? '' : ev.bannerUrl,
            galleryUrls: ev.galleryUrls.filter(u => !u.startsWith('data:')),
            hotel: ev.hotel && ev.hotel.imageUrl.startsWith('data:')
                ? { ...ev.hotel, imageUrl: '' }
                : ev.hotel,
        })),
        landingPage: {
            ...lp,
            hero: { ...lp.hero, imageUrl: lp.hero.imageUrl.startsWith('data:') ? '' : lp.hero.imageUrl },
            about: { ...lp.about, photo: lp.about.photo.startsWith('data:') ? '' : lp.about.photo },
            conference: { ...lp.conference, photo: lp.conference.photo.startsWith('data:') ? '' : lp.conference.photo },
            gallery: { ...lp.gallery, images: lp.gallery.images.filter(u => !u.startsWith('data:')) },
            committeePhotos: lp.committeePhotos.map(cp =>
                cp.photo.startsWith('data:') ? { ...cp, photo: '' } : cp
            ),
        },
    };
}

function writeStorage(state: StoredState) {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
        // Quota exceeded — strip heavy base64 blobs (PDFs, event images) and retry
        // so critical small data (registrations, payments, applications) still persists.
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(stripBlobs(state)));
        } catch { /* give up */ }
    }
}

function initWaiting(committees: Committee[], existing: Record<string, number> = {}): Record<string, number> {
    const result = { ...existing };
    committees.forEach(c => {
        if (!(c.abbr in result)) result[c.abbr] = rand(6, 21);
    });
    return result;
}

function nowStr() {
    return new Date().toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* ── Context type ── */
interface ConferenceCtx {
    committees: Committee[];
    addCommittee:    (c: Omit<Committee, 'id'>) => void;
    updateCommittee: (id: number, patch: Partial<Committee>) => void;
    deleteCommittee: (id: number) => void;

    papers: PositionPaper[];
    submitPaper:       (p: Omit<PositionPaper, 'id' | 'status' | 'submittedAt'>) => void;
    updatePaperStatus: (id: number, status: 'Approved' | 'Rejected') => void;
    getPapersForDelegate: (delegateId: string) => PositionPaper[];

    applications: CommitteeApplication[];
    applyToCommittee:           (delegateId: string, delegateName: string, country: string, committeeAbbr: string, whyThisCommittee: string, preferredCountry: string, whyShouldWePickYou: string) => void;
    updateApplicationStatus:    (id: number, status: 'Approved' | 'Rejected') => void;
    withdrawApplication:        (id: number) => void;
    reassignApplication:        (id: number, newCommitteeAbbr: string) => void;
    assignCountryToDelegate:    (appId: number, country: string) => void;
    getApplicationForDelegate:   (delegateId: string) => CommitteeApplication | undefined;
    getApplicationsForCommittee: (abbr: string) => CommitteeApplication[];

    waitingCounts: Record<string, number>;

    scheduleEvents: ScheduleEvent[];
    addScheduleEvent:    (e: Omit<ScheduleEvent, 'id'>) => void;
    updateScheduleEvent: (id: number, patch: Partial<Omit<ScheduleEvent, 'id'>>) => void;
    deleteScheduleEvent: (id: number) => void;

    conversations: Conversation[];
    startConversation:  (delegateId: string, delegateName: string, delegateEmail: string, delegateCountry: string, subject: string, category: string, firstMessage: string) => void;
    sendChatMessage:    (conversationId: number, text: string, sender: 'delegate' | 'admin') => void;
    markRead:           (conversationId: number, role: 'admin' | 'delegate') => void;
    getConversationsForDelegate: (delegateId: string) => Conversation[];

    notifications: AppNotification[];
    markNotificationRead:     (id: number) => void;
    markAllNotificationsRead: () => void;
    refreshNotifications:     () => void;

    registrations: Registration[];
    submitRegistration:       (data: Omit<Registration, 'id' | 'status' | 'submittedAt' | 'paymentStatus' | 'declineReason'>) => void;
    updateRegistrationStatus: (id: number, status: 'Accepted' | 'Declined', declineReason?: string) => void;
    markRegistrationPaid:     (id: number) => void;
    getRegistrationForDelegate: (delegateId: string) => Registration | undefined;

    payments: PaymentSubmission[];
    submitPayment:        (data: Omit<PaymentSubmission, 'id' | 'status' | 'submittedAt' | 'declineReason'>) => void;
    updatePaymentStatus:  (id: number, status: 'Approved' | 'Declined', declineReason?: string) => void;
    getPaymentForDelegate: (delegateId: string) => PaymentSubmission | undefined;

    paymentSettings: PaymentSettings;
    updatePaymentSettings: (patch: Partial<PaymentSettings>) => void;

    packages: ConferencePackage[];
    addPackage:    (p: Omit<ConferencePackage, 'id'>) => void;
    updatePackage: (id: number, patch: Partial<ConferencePackage>) => void;
    deletePackage: (id: number) => void;

    deleteDelegate: (delegateId: string) => void;
    suspendDelegate: (delegateId: string, suspended: boolean) => Promise<void>;

    events: ConferenceEvent[];
    addEvent:    (e: Omit<ConferenceEvent, 'id' | 'createdAt'>) => void;
    updateEvent: (id: number, patch: Partial<ConferenceEvent>) => void;
    deleteEvent: (id: number) => void;

    landingPage: LandingPageData;
    updateLandingPage: (patch: Partial<LandingPageData>) => void;

    conferenceSettings: ConferenceSettings;
    updateConferenceSettings: (patch: Partial<ConferenceSettings>) => void;
}

const ConferenceContext = createContext<ConferenceCtx | undefined>(undefined);

export const ConferenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    // Seed fallbacks render public pages instantly; real data is fetched from the API below.
    const [committees,     setCommittees]     = useState<Committee[]>(SEED_COMMITTEES);
    const [papers,         setPapers]         = useState<PositionPaper[]>([]);
    const [applications,   setApplications]   = useState<CommitteeApplication[]>([]);
    const [waitingCounts,  setWaitingCounts]  = useState<Record<string, number>>({});
    const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(SEED_SCHEDULE);
    const [conversations,  setConversations]  = useState<Conversation[]>([]);
    const [notifications,  setNotifications]  = useState<AppNotification[]>([]);
    const [registrations,  setRegistrations]  = useState<Registration[]>([]);
    const [payments,       setPayments]       = useState<PaymentSubmission[]>([]);
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(SEED_PAYMENT_SETTINGS);
    const [packages,       setPackages]       = useState<ConferencePackage[]>(SEED_PACKAGES);
    const [events,         setEvents]         = useState<ConferenceEvent[]>(SEED_EVENTS);
    const [landingPage,    setLandingPage]    = useState<LandingPageData>(DEFAULT_LANDING);
    const [conferenceSettings, setConferenceSettings] = useState<ConferenceSettings>(SEED_CONFERENCE_SETTINGS);

    /* ── Mappers: server record → client shape ── */
    const fmt = (iso: string) => { try { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };
    const mapCommittee = (r: any): Committee => ({ id: r.id, name: r.name, abbr: r.abbr, delegates: r.capacity, topics: r.topics, director: r.director, topicList: r.topicList ?? [], logoUrl: r.logoUrl ?? undefined });
    const mapPaper = (r: any): PositionPaper => ({ id: r.id, delegateId: r.delegateId, delegateName: r.delegateName, committee: r.committee, country: r.country, status: r.status, submittedAt: fmt(r.submittedAt), fileName: r.fileName, fileUrl: r.fileKey ? `/api/files/${r.fileKey}` : '', fileSize: r.fileSize ?? 0 });
    const mapReg = (r: any): Registration => ({ ...r, submittedAt: fmt(r.submittedAt) });
    const mapPay = (r: any): PaymentSubmission => ({ ...r, submittedAt: fmt(r.submittedAt) });
    const mapApp = (r: any): CommitteeApplication => ({ ...r, appliedAt: fmt(r.appliedAt) });
    const mapNotification = (r: any): AppNotification => ({ ...r, createdAt: fmt(r.createdAt) });
    const mapConvo = (r: any): Conversation => ({
        id: r.id, delegateId: r.delegateId, delegateName: r.delegateName, delegateEmail: r.delegateEmail,
        delegateCountry: r.delegateCountry, subject: r.subject, category: r.category,
        createdAt: fmt(r.createdAt), lastMessageAt: fmt(r.lastMessageAt),
        adminUnread: r.adminUnread, delegateUnread: r.delegateUnread,
        messages: (r.messages ?? []).map((m: any) => ({ id: m.id, text: m.text, sender: m.sender, time: fmt(m.createdAt) })),
    });

    const applyCommittees = useCallback((rows: any[]) => {
        setCommittees(rows.map(mapCommittee));
        setWaitingCounts(Object.fromEntries(rows.map((r: any) => [r.abbr, r.waiting ?? 0])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Fetch helpers ── */
    const getData = async (url: string) => {
        try { const res = await fetch(url); if (!res.ok) return null; const j = await res.json(); return j?.ok ? j.data : null; } catch { return null; }
    };
    const send = async (method: string, url: string, body?: unknown) => {
        const res = await fetch(url, {
            method,
            headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.ok === false) throw new Error(j?.error || 'Request failed');
        return j.data;
    };
    const refreshCommittees = useCallback(async () => { const c = await getData('/api/committees'); if (c) applyCommittees(c); }, [applyCommittees]);

    /* ── Initial load: public config always; per-user data when signed in ── */
    const loadPublic = useCallback(async () => {
        const [c, e, pk, sc, pay, conf, land] = await Promise.all([
            getData('/api/committees'), getData('/api/events'), getData('/api/packages'),
            getData('/api/schedule'), getData('/api/settings/payment'),
            getData('/api/settings/conference'), getData('/api/settings/landing'),
        ]);
        if (c) applyCommittees(c);
        if (e) setEvents(e);
        if (pk) setPackages(pk);
        if (sc) setScheduleEvents(sc);
        if (pay) setPaymentSettings({ ...SEED_PAYMENT_SETTINGS, ...pay });
        if (conf) setConferenceSettings({ ...SEED_CONFERENCE_SETTINGS, ...conf });
        if (land) setLandingPage(resolveLandingPage(land));
    }, [applyCommittees]);

    useEffect(() => { loadPublic(); }, [loadPublic]);

    /* ── Refetch every per-user data domain at once. Used on login and again
       whenever the SSE stream below tells us something changed on the
       other side (admin <-> delegate), so the UI updates instantly instead
       of waiting for a manual page reload. ── */
    const refreshAll = useCallback(async () => {
        const [r, p, pa, ap, cv, nf] = await Promise.all([
            getData('/api/registrations'), getData('/api/payments'), getData('/api/papers'),
            getData('/api/applications'), getData('/api/conversations'), getData('/api/notifications'),
        ]);
        setRegistrations((r ?? []).map(mapReg));
        setPayments((p ?? []).map(mapPay));
        setPapers((pa ?? []).map(mapPaper));
        setApplications((ap ?? []).map(mapApp));
        setConversations((cv ?? []).map(mapConvo));
        setNotifications((nf ?? []).map(mapNotification));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let alive = true;
        if (!user) {
            setRegistrations([]); setPayments([]); setPapers([]); setApplications([]); setConversations([]); setNotifications([]);
            return;
        }
        (async () => { if (alive) await refreshAll(); })();
        return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    /* ── Live updates: subscribe to the SSE stream so the instant a delegate
       or staff action fires a notification on the other side, that side
       refetches and the UI reflects it with no manual refresh. Falls back
       to a slow safety-net poll in case the stream is blocked (proxy/extension). ── */
    const refreshNotifications = useCallback(async () => {
        const nf = await getData('/api/notifications');
        if (nf) setNotifications(nf.map(mapNotification));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!user) return;
        const es = new EventSource('/api/notifications/stream');
        es.onmessage = (e) => { if (e.data === 'update') refreshAll(); };
        return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        if (!user) return;
        const id = setInterval(refreshAll, 60000);
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const markNotificationRead = async (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await send('PATCH', `/api/notifications/${id}`, {}).catch(() => {});
    };
    const markAllNotificationsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await send('PATCH', '/api/notifications', { action: 'markAllRead' }).catch(() => {});
    };

    // Debounced save for the landing page (the editor mutates it on every keystroke).
    const landingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const saveLanding = (value: LandingPageData) => {
        clearTimeout(landingTimer.current);
        landingTimer.current = setTimeout(() => { send('PUT', '/api/settings/landing', value).catch(() => {}); }, 600);
    };

    /* ── Committees ── */
    const addCommittee = async (c: Omit<Committee, 'id'>) => {
        await send('POST', '/api/committees', { name: c.name, abbr: c.abbr, capacity: c.delegates, topics: c.topics, director: c.director, topicList: c.topicList, logoUrl: c.logoUrl });
        await refreshCommittees();
    };
    const updateCommittee = async (id: number, patch: Partial<Committee>) => {
        const body: Record<string, unknown> = { ...patch };
        if ('delegates' in patch) { body.capacity = patch.delegates; delete body.delegates; }
        await send('PATCH', `/api/committees/${id}`, body);
        await refreshCommittees();
    };
    const deleteCommittee = async (id: number) => {
        await send('DELETE', `/api/committees/${id}`);
        await refreshCommittees();
    };

    /* ── Papers ── */
    const submitPaper = async (p: Omit<PositionPaper, 'id' | 'status' | 'submittedAt'>) => {
        const fileKey = p.fileUrl?.startsWith('/api/files/') ? p.fileUrl.slice('/api/files/'.length) : undefined;
        const row = await send('POST', '/api/papers', { delegateName: p.delegateName, committee: p.committee, country: p.country, fileName: p.fileName, fileKey, fileSize: p.fileSize });
        const mapped = mapPaper(row);
        setPapers(prev => {
            const idx = prev.findIndex(x => x.delegateId === mapped.delegateId && x.committee === mapped.committee);
            if (idx >= 0) { const u = [...prev]; u[idx] = mapped; return u; }
            return [...prev, mapped];
        });
    };
    const updatePaperStatus = async (id: number, status: 'Approved' | 'Rejected') => {
        const row = await send('PATCH', `/api/papers/${id}`, { status });
        setPapers(prev => prev.map(p => p.id === id ? mapPaper(row) : p));
    };
    const getPapersForDelegate = (delegateId: string) =>
        papers.filter(p => p.delegateId === delegateId);

    /* ── Applications ── */
    const applyToCommittee = async (_delegateId: string, delegateName: string, country: string, committeeAbbr: string, whyThisCommittee: string, preferredCountry: string, whyShouldWePickYou: string) => {
        const row = await send('POST', '/api/applications', { delegateName, country, committeeAbbr, whyThisCommittee, preferredCountry, whyShouldWePickYou });
        const mapped = mapApp(row);
        setApplications(prev => {
            const idx = prev.findIndex(a => a.delegateId === mapped.delegateId);
            if (idx >= 0) { const u = [...prev]; u[idx] = mapped; return u; }
            return [...prev, mapped];
        });
    };
    const assignCountryToDelegate = async (appId: number, country: string) => {
        const row = await send('PATCH', `/api/applications/${appId}`, { action: 'assignCountry', country });
        setApplications(prev => prev.map(a => a.id === appId ? mapApp(row) : a));
    };
    const updateApplicationStatus = async (id: number, status: 'Approved' | 'Rejected') => {
        const row = await send('PATCH', `/api/applications/${id}`, { action: status === 'Approved' ? 'approve' : 'reject' });
        setApplications(prev => prev.map(a => a.id === id ? mapApp(row) : a));
        if (status === 'Approved') await refreshCommittees();
    };
    const withdrawApplication = async (id: number) => {
        const row = await send('PATCH', `/api/applications/${id}`, { action: 'withdraw' });
        setApplications(prev => prev.map(a => a.id === id ? mapApp(row) : a));
    };
    const reassignApplication = async (id: number, newCommitteeAbbr: string) => {
        const row = await send('PATCH', `/api/applications/${id}`, { action: 'reassign', committeeAbbr: newCommitteeAbbr });
        setApplications(prev => prev.map(a => a.id === id ? mapApp(row) : a));
        await refreshCommittees();
    };
    const getApplicationForDelegate = (delegateId: string) =>
        applications.find(a => a.delegateId === delegateId);
    const getApplicationsForCommittee = (abbr: string) =>
        applications.filter(a => a.committeeAbbr === abbr);

    /* ── Schedule ── */
    const addScheduleEvent = async (e: Omit<ScheduleEvent, 'id'>) => {
        const row = await send('POST', '/api/schedule', e);
        setScheduleEvents(prev => [...prev, row]);
    };
    const updateScheduleEvent = async (id: number, patch: Partial<Omit<ScheduleEvent, 'id'>>) => {
        const row = await send('PATCH', `/api/schedule/${id}`, patch);
        setScheduleEvents(prev => prev.map(e => e.id === id ? row : e));
    };
    const deleteScheduleEvent = async (id: number) => {
        await send('DELETE', `/api/schedule/${id}`);
        setScheduleEvents(prev => prev.filter(e => e.id !== id));
    };

    /* ── Conversations / Chat ── */
    const startConversation = async (
        _delegateId: string, _delegateName: string, _delegateEmail: string,
        _delegateCountry: string, subject: string, category: string, firstMessage: string,
    ) => {
        const row = await send('POST', '/api/conversations', { subject, category, firstMessage });
        setConversations(prev => [mapConvo(row), ...prev]);
    };
    const sendChatMessage = async (conversationId: number, text: string, _sender: 'delegate' | 'admin') => {
        const row = await send('PATCH', `/api/conversations/${conversationId}`, { action: 'message', text });
        setConversations(prev => prev.map(c => c.id === conversationId ? mapConvo(row) : c));
    };
    const markRead = async (conversationId: number, _role: 'admin' | 'delegate') => {
        const row = await send('PATCH', `/api/conversations/${conversationId}`, { action: 'markRead' });
        setConversations(prev => prev.map(c => c.id === conversationId ? mapConvo(row) : c));
    };
    const getConversationsForDelegate = (delegateId: string) =>
        conversations.filter(c => c.delegateId === delegateId);

    /* ── Registrations ── */
    const submitRegistration = async (data: Omit<Registration, 'id' | 'status' | 'submittedAt' | 'paymentStatus' | 'declineReason'>) => {
        const { delegateId: _ignore, ...payload } = data as Registration;
        const row = await send('POST', '/api/registrations', payload);
        const mapped = mapReg(row);
        setRegistrations(prev => {
            const idx = prev.findIndex(r => r.delegateId === mapped.delegateId);
            if (idx >= 0) { const u = [...prev]; u[idx] = mapped; return u; }
            return [...prev, mapped];
        });
    };
    const updateRegistrationStatus = async (id: number, status: 'Accepted' | 'Declined', declineReason?: string) => {
        const row = await send('PATCH', `/api/registrations/${id}`, status === 'Accepted' ? { action: 'accept' } : { action: 'decline', declineReason });
        setRegistrations(prev => prev.map(r => r.id === id ? mapReg(row) : r));
    };
    const markRegistrationPaid = async (id: number) => {
        const row = await send('PATCH', `/api/registrations/${id}`, { action: 'markPaid' });
        setRegistrations(prev => prev.map(r => r.id === id ? mapReg(row) : r));
    };
    const getRegistrationForDelegate = (delegateId: string) =>
        registrations.find(r => r.delegateId === delegateId);

    /* ── Payments ── */
    const submitPayment = async (data: Omit<PaymentSubmission, 'id' | 'status' | 'submittedAt' | 'declineReason'>) => {
        const { delegateId: _ignore, ...payload } = data as PaymentSubmission;
        const row = await send('POST', '/api/payments', payload);
        const mapped = mapPay(row);
        setPayments(prev => {
            const idx = prev.findIndex(p => p.delegateId === mapped.delegateId);
            if (idx >= 0) { const u = [...prev]; u[idx] = mapped; return u; }
            return [mapped, ...prev];
        });
    };
    const updatePaymentStatus = async (id: number, status: 'Approved' | 'Declined', declineReason?: string) => {
        const pay = payments.find(p => p.id === id);
        const row = await send('PATCH', `/api/payments/${id}`, status === 'Approved' ? { action: 'approve' } : { action: 'decline', declineReason });
        setPayments(prev => prev.map(p => p.id === id ? mapPay(row) : p));
        if (pay) {
            const newStatus: 'Paid' | 'Unpaid' = status === 'Approved' ? 'Paid' : 'Unpaid';
            setRegistrations(prev => prev.map(r => r.delegateId === pay.delegateId ? { ...r, paymentStatus: newStatus } : r));
        }
    };
    const getPaymentForDelegate = (delegateId: string) =>
        payments.find(p => p.delegateId === delegateId);

    const updatePaymentSettings = async (patch: Partial<PaymentSettings>) => {
        const next = { ...paymentSettings, ...patch };
        setPaymentSettings(next);
        await send('PUT', '/api/settings/payment', next).catch(() => {});
    };

    /* ── Packages ── */
    const addPackage = async (p: Omit<ConferencePackage, 'id'>) => {
        const row = await send('POST', '/api/packages', p);
        setPackages(prev => [...prev, row]);
    };
    const updatePackage = async (id: number, patch: Partial<ConferencePackage>) => {
        const row = await send('PATCH', `/api/packages/${id}`, patch);
        setPackages(prev => prev.map(p => p.id === id ? row : p));
    };
    const deletePackage = async (id: number) => {
        await send('DELETE', `/api/packages/${id}`);
        setPackages(prev => prev.filter(p => p.id !== id));
    };

    /* ── Events ── */
    const addEvent = async (e: Omit<ConferenceEvent, 'id' | 'createdAt'>) => {
        const row = await send('POST', '/api/events', e);
        setEvents(prev => [...prev, row]);
    };
    const updateEvent = async (id: number, patch: Partial<ConferenceEvent>) => {
        const row = await send('PATCH', `/api/events/${id}`, patch);
        setEvents(prev => prev.map(e => e.id === id ? row : e));
    };
    const deleteEvent = async (id: number) => {
        await send('DELETE', `/api/events/${id}`);
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    const updateLandingPage = (patch: Partial<LandingPageData>) =>
        setLandingPage(prev => { const next = { ...prev, ...patch }; saveLanding(next); return next; });

    const updateConferenceSettings = async (patch: Partial<ConferenceSettings>) => {
        const next = { ...conferenceSettings, ...patch };
        setConferenceSettings(next);
        await send('PUT', '/api/settings/conference', next).catch(() => {});
    };

    const deleteDelegate = async (delegateId: string) => {
        await send('DELETE', `/api/delegates/${delegateId}`).catch(() => {});
        setRegistrations(prev => prev.filter(r => r.delegateId !== delegateId));
        setPayments(prev => prev.filter(p => p.delegateId !== delegateId));
        setConversations(prev => prev.filter(c => c.delegateId !== delegateId));
        setApplications(prev => prev.filter(a => a.delegateId !== delegateId));
        setPapers(prev => prev.filter(p => p.delegateId !== delegateId));
    };

    /** Suspend/reactivate a delegate's account — blocks them from every authenticated route immediately. */
    const suspendDelegate = async (delegateId: string, suspended: boolean) => {
        await send('PATCH', `/api/delegates/${delegateId}`, { status: suspended ? 'inactive' : 'active' });
        setRegistrations(prev => prev.map(r => r.delegateId === delegateId ? { ...r, accountStatus: suspended ? 'inactive' : 'active' } : r));
    };

    const ctxValue = useMemo(() => ({
        committees, addCommittee, updateCommittee, deleteCommittee,
        papers, submitPaper, updatePaperStatus, getPapersForDelegate,
        applications, applyToCommittee, updateApplicationStatus, withdrawApplication, reassignApplication, assignCountryToDelegate,
        getApplicationForDelegate, getApplicationsForCommittee,
        waitingCounts,
        scheduleEvents, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent,
        conversations, startConversation, sendChatMessage, markRead, getConversationsForDelegate,
        notifications, markNotificationRead, markAllNotificationsRead, refreshNotifications,
        registrations, submitRegistration, updateRegistrationStatus, markRegistrationPaid, getRegistrationForDelegate,
        payments, submitPayment, updatePaymentStatus, getPaymentForDelegate,
        paymentSettings, updatePaymentSettings,
        packages, addPackage, updatePackage, deletePackage,
        events, addEvent, updateEvent, deleteEvent,
        landingPage, updateLandingPage,
        deleteDelegate, suspendDelegate,
        conferenceSettings, updateConferenceSettings,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [committees, papers, applications, waitingCounts, scheduleEvents, conversations, notifications,
         registrations, payments, paymentSettings, packages, events, landingPage, conferenceSettings]);

    return (
        <ConferenceContext.Provider value={ctxValue}>
            {children}
        </ConferenceContext.Provider>
    );
};

export const useConference = () => {
    const ctx = useContext(ConferenceContext);
    if (!ctx) throw new Error('useConference must be used within ConferenceProvider');
    return ctx;
};
