export interface ContactSocialLink {
    id: string;
    platform: 'youtube' | 'facebook' | 'instagram' | 'linkedin' | 'other';
    label: string;
    url: string;
}

export interface ContactPageData {
    tag: string;
    heading: string;
    introduction: string;
    phone: string;
    hours: string;
    primaryEmail: string;
    primaryEmailNote: string;
    supportEmail: string;
    supportEmailNote: string;
    socials: ContactSocialLink[];
    formHeading: string;
    formIntroduction: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitLabel: string;
    successMessage: string;
    errorMessage: string;
}

export const DEFAULT_CONTACT_PAGE: ContactPageData = {
    tag: 'CONTACT US',
    heading: 'Got questions? Ideas? Get in touch!',
    introduction: "We'd love to hear from you! Whether you have a question about the conference, need help with registration, or want to collaborate, our team is ready to assist.",
    phone: '+212 713 133 601',
    hours: 'Call us: Mon - Fri 9:00 - 19:00',
    primaryEmail: 'contact@myimun.org',
    primaryEmailNote: 'Drop us a line anytime!',
    supportEmail: 'support@myimun.org',
    supportEmailNote: 'Get help anytime!',
    socials: [
        { id: 'social-youtube', platform: 'youtube', label: 'YouTube', url: '#' },
        { id: 'social-facebook', platform: 'facebook', label: 'Facebook', url: '#' },
        { id: 'social-instagram', platform: 'instagram', label: 'Instagram', url: '#' },
    ],
    formHeading: 'Make an online enquiry',
    formIntroduction: 'Fill out the form below to reach us',
    nameLabel: 'Name',
    namePlaceholder: 'Name',
    emailLabel: 'Email',
    emailPlaceholder: 'Email',
    messageLabel: 'Your Message',
    messagePlaceholder: 'Message',
    submitLabel: 'Send Message',
    successMessage: 'Your message has been received. We will get back to you shortly.',
    errorMessage: 'We could not send your message. Please try again.',
};

export function resolveContactPage(saved: Partial<ContactPageData> | null | undefined): ContactPageData {
    if (!saved) return DEFAULT_CONTACT_PAGE;
    return {
        ...DEFAULT_CONTACT_PAGE,
        ...saved,
        socials: Array.isArray(saved.socials) ? saved.socials : DEFAULT_CONTACT_PAGE.socials,
    };
}
