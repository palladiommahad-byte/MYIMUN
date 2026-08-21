export interface DelegateSupportData {
    email: string;
    emailNote: string;
    whatsappPhone: string;
    whatsappNote: string;
    emergencyPhone: string;
    emergencyNote: string;
    office: string;
    officeNote: string;
}

export const DEFAULT_DELEGATE_SUPPORT: DelegateSupportData = {
    email: 'secretariat@myimun.org',
    emailNote: 'Response time: < 24h',
    whatsappPhone: '+212 681 537 480',
    whatsappNote: 'Fastest way to reach the Secretariat',
    emergencyPhone: '+212 555 0192',
    emergencyNote: 'Available 24/7 during conference',
    office: 'Room 102, 1st Floor',
    officeNote: 'Main Conference Hall',
};

export function resolveDelegateSupport(saved: Partial<DelegateSupportData> | null | undefined): DelegateSupportData {
    return { ...DEFAULT_DELEGATE_SUPPORT, ...saved };
}
