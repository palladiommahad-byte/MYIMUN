import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_LANDING } from '../src/context/ConferenceContext';

const prisma = new PrismaClient();

/* ── Reference / config seed data (mirrors the app's original SEED_* constants) ── */

const COMMITTEES = [
    { name: 'United Nations Security Council', abbr: 'UNSC', capacity: 15, topics: 2, director: 'Dr. Sarah Al-Fayed', topicList: ['Cybersecurity Threats & State Actors', 'Nuclear Non-Proliferation Treaty'] },
    { name: 'World Health Organization', abbr: 'WHO', capacity: 45, topics: 3, director: 'Dr. James Kim', topicList: ['Pandemic Preparedness in 2030', 'Global Vaccine Access & Equity', 'Mental Health Crisis'] },
    { name: 'Disarmament & International Security', abbr: 'DISEC', capacity: 80, topics: 2, director: 'Ambassador Liu Zhang', topicList: ['Small Arms & Light Weapons Trafficking', 'Space Militarization'] },
    { name: 'United Nations Human Rights Council', abbr: 'UNHRC', capacity: 40, topics: 2, director: 'Prof. Amina Diallo', topicList: ['Digital Surveillance & Privacy Rights', 'Refugee & Stateless Persons Rights'] },
];

const PACKAGES = [
    { name: 'Non-Accommodation Plan', price: 150, currency: 'USD', description: 'For local delegates or those with their own accommodation. Covers all conference sessions.', features: ['Full conference access (3 days)', 'Delegate handbook & materials', 'All committee sessions', 'Networking lunches (Day 1 & 2)', 'Certificate of participation'], emoji: '📋', badge: '', hidden: false, color: '#3B7FFF' },
    { name: 'Accommodation Plan', price: 350, currency: 'USD', description: 'Includes 3-night hotel stay at the conference venue with daily breakfast.', features: ['Everything in Non-Accommodation Plan', '3 nights hotel accommodation', 'Daily breakfast included', 'Airport pickup & drop-off', 'Conference shuttle service'], emoji: '🏨', badge: 'Most Popular', hidden: false, color: '#7C5FFF' },
    { name: 'Full Experience Plan', price: 550, currency: 'USD', description: 'The ultimate MYIMUN experience with exclusive perks, VIP access, and all activities.', features: ['Everything in Accommodation Plan', 'Gala Night tickets (×2)', 'Guided City Tour (Day 4)', 'VIP seating at all ceremonies', 'Exclusive delegate gift bag', 'Priority committee selection'], emoji: '⭐', badge: 'Best Value', hidden: false, color: '#F59E0B' },
];

const SCHEDULE = [
    { day: 'Day 1', date: 'Friday, Oct 12', time: '08:00 AM', title: 'Registration & Kit Pickup', location: 'Grand Foyer', type: 'Logistics', description: 'Pick up your delegate handbook, badges, and placards.' },
    { day: 'Day 1', date: 'Friday, Oct 12', time: '10:00 AM', title: 'Opening Ceremony', location: 'Royal Auditorium', type: 'Keynote', description: 'Keynote by Secretary General and guest speaker.' },
    { day: 'Day 1', date: 'Friday, Oct 12', time: '01:30 PM', title: 'Committee Session I', location: 'Breakout Rooms', type: 'Session', description: 'Setting the agenda and opening speeches.' },
    { day: 'Day 2', date: 'Saturday, Oct 13', time: '09:00 AM', title: 'Committee Session II', location: 'Breakout Rooms', type: 'Session', description: 'Drafting working papers and forming blocs.' },
    { day: 'Day 2', date: 'Saturday, Oct 13', time: '08:00 PM', title: 'Gala Night', location: 'Poolside', type: 'Social', description: 'A magical evening under the stars with live music and dancing.' },
    { day: 'Day 3', date: 'Sunday, Oct 14', time: '12:30 PM', title: 'Closing Ceremony', location: 'Royal Auditorium', type: 'Keynote', description: 'Awards presentation for Best Delegate and Outstanding Delegations.' },
];

const EVENT = {
    title: 'MYIMUN 2026', subtitle: 'Model United Nations Conference', edition: '12th Annual Edition',
    startDate: '2026-09-15', endDate: '2026-09-18',
    venue: 'Royal Hotel Conference Center', address: '12 Boulevard Mohammed V', city: 'Casablanca', country: 'Morocco',
    description: 'MYIMUN 2026 is the 12th annual edition of our prestigious Model United Nations conference.',
    guidelines: [
        'All delegates must carry their official delegate badge at all times during the conference.',
        'Formal Western business attire or national formal dress is required for all committee sessions and ceremonies.',
        'All position papers must be submitted no later than two weeks before the conference starts.',
    ],
    bannerUrl: '', galleryUrls: [], hotel: null, agenda: [],
    published: true, registrationDeadline: '2026-08-15', capacity: 300,
    certEditionNumber: 8, certDateDisplay: 'September 15–18, 2026', certLocation: 'Marrakech',
    certSignatory: 'Mustapha Ait Mbark', letterEditionYear: '8th Annual Edition 2026',
};

const PAYMENT_SETTINGS = {
    fee: 150, currency: 'USD', bankName: 'MYIMUN Bank', accountName: 'MYIMUN Events Ltd.',
    accountNumber: '0001234567', iban: 'MA00 1234 5678 9012 3456', swift: 'MYIMMAMC',
    paypalEmail: 'payments@myimun.org',
    instructions: 'Please include your full name as the transfer reference. After paying, upload your receipt below for verification.',
};

const CONFERENCE_SETTINGS = {
    registrationOpen: true, allowPaperUploads: true, publicSchedule: true,
    maintenanceMode: false, secretaryAccess: true, managerAccess: true,
};

async function upsertSetting(key: string, value: unknown) {
    await prisma.appSetting.upsert({
        where: { key },
        update: { value: value as object },
        create: { key, value: value as object },
    });
}

async function main() {
    console.log('🌱 Seeding database…');

    // ── Demo accounts ──
    const adminHash = await bcrypt.hash('admin123', 10);
    const delegateHash = await bcrypt.hash('delegate123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@myimun.org' },
        update: {},
        create: { email: 'admin@myimun.org', fullName: 'Secretary General', passwordHash: adminHash, role: 'admin' },
    });
    await prisma.user.upsert({
        where: { email: 'delegate@myimun.org' },
        update: {},
        create: { email: 'delegate@myimun.org', fullName: 'Honorable Delegate', passwordHash: delegateHash, role: 'delegate', country: 'France', address: '123 Diplomatic Ave, New York, NY' },
    });
    console.log('  ✓ users (admin@myimun.org / admin123, delegate@myimun.org / delegate123)');

    // ── Committees ──
    for (const c of COMMITTEES) {
        await prisma.committee.upsert({
            where: { abbr: c.abbr },
            update: {},
            create: { name: c.name, abbr: c.abbr, capacity: c.capacity, topics: c.topics, director: c.director, topicList: c.topicList, waiting: Math.floor(Math.random() * 16) + 6 },
        });
    }
    console.log(`  ✓ ${COMMITTEES.length} committees`);

    // ── Packages (only if none exist) ──
    if ((await prisma.conferencePackage.count()) === 0) {
        for (const p of PACKAGES) await prisma.conferencePackage.create({ data: p });
        console.log(`  ✓ ${PACKAGES.length} packages`);
    }

    // ── Schedule (only if none exist) ──
    if ((await prisma.scheduleEvent.count()) === 0) {
        for (const s of SCHEDULE) await prisma.scheduleEvent.create({ data: s });
        console.log(`  ✓ ${SCHEDULE.length} schedule rows`);
    }

    // ── Event (only if none exist) ──
    if ((await prisma.conferenceEvent.count()) === 0) {
        await prisma.conferenceEvent.create({ data: EVENT });
        console.log('  ✓ conference event');
    }

    // ── Config singletons ──
    await upsertSetting('payment', PAYMENT_SETTINGS);
    await upsertSetting('conference', CONFERENCE_SETTINGS);
    await upsertSetting('landing', DEFAULT_LANDING);
    console.log('  ✓ settings (payment, conference, landing)');

    console.log('✅ Seed complete.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
