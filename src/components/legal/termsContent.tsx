import React from 'react';
import Link from 'next/link';

export const TERMS_LAST_UPDATED = 'June 24, 2026';

/** Delegate Terms & Conditions — shared by the Terms page and the signed contract view. */
export const TERMS_SECTIONS: { title: string; body: React.ReactNode }[] = [
    {
        title: '1. Acceptance of Terms',
        body: 'By creating a delegate account, registering for a MYIMUN (Moroccan International Youth Model United Nations) event, or otherwise using this platform, you agree to be bound by these Terms & Conditions. If you do not agree, please do not register or use the platform.',
    },
    {
        title: '2. Eligibility & Registration',
        body: 'Registration requires accurate personal information (name, contact details, country, and a valid ID document for hotel reservation purposes). Submitting a registration does not guarantee a seat — all applications are reviewed and must be approved by the secretariat before payment and full platform access are unlocked.',
    },
    {
        title: '3. Conference Participation',
        body: 'Once accepted and your committee/country assignment is confirmed by the secretariat, you are expected to act in good faith as a delegate: submit required position papers by the published deadlines, attend sessions, and represent your assigned country professionally during committee proceedings.',
    },
    {
        title: '4. Payments & Packages',
        body: (
            <>
                Conference packages must be paid in full according to the chosen package. All payments must be made exclusively through the official channels provided on this platform — using the bank account details published on your Payments page, or as instructed directly by the treasury agent assigned to your registration. MYIMUN is not responsible for funds sent to any other account, intermediary, or unofficial channel.
                <br /><br />
                <strong style={{ color: '#111827' }}>Payment and Refund Policy</strong>
                <br /><br />
                <strong style={{ color: '#111827' }}>1. Non-Refundability of Participation Fees</strong>
                <br />
                All participation fees are non-refundable once the payment has been confirmed and approved, subject to the terms outlined below.
                <br /><br />
                <strong style={{ color: '#111827' }}>2. Organizational Commitments Following Payment</strong>
                <br />
                Once payment has been confirmed, MYIMUN begins making the necessary arrangements for the delegate, including hotel accommodation reservations, preparation of conference documents and materials, and allocation of the human resources, logistical support, and services associated with participation.
                <br /><br />
                <strong style={{ color: '#111827' }}>3. Cancellation by the Delegate</strong>
                <br />
                Participation fees will not be refunded, in whole or in part, if a delegate cancels their participation, is unable to attend, has their visa application rejected, or is removed from the conference for violating the applicable rules and regulations, subject to applicable laws.
                <br /><br />
                <strong style={{ color: '#111827' }}>4. Conference Cancellation or Postponement by the Organization</strong>
                <br />
                If MYIMUN cancels the conference entirely, participants will be informed of the procedures for refunding participation fees, in accordance with applicable laws and the organization&apos;s legal obligations.
                <br /><br />
                If the conference is postponed or rescheduled, participants will be informed of the relevant details and the available arrangements concerning their registrations.
                <br /><br />
                <strong style={{ color: '#111827' }}>5. Force Majeure and Exceptional Circumstances</strong>
                <br />
                MYIMUN reserves the right to take appropriate organizational measures in cases of force majeure or exceptional circumstances beyond its control, while respecting applicable laws and the legal rights of participants.
                <br /><br />
                <strong style={{ color: '#111827' }}>6. Acknowledgment and Acceptance of the Policy</strong>
                <br />
                Please read and carefully understand this policy before completing your payment. By completing the payment, you acknowledge that you have read and agreed to the participation terms and conditions, to the extent permitted by applicable law.
                <br /><br />
                Payment receipts are manually reviewed by our secretariat team; access to paid features and your package benefits unlock only once a receipt is approved. If you have any questions about a payment or the bank details before submitting, contact the secretariat through Contact Support.
            </>
        ),
    },
    {
        title: '5. Code of Conduct',
        body: 'Harassment, discrimination, plagiarism in position papers, or disruptive behavior during sessions will not be tolerated and may result in suspension from the conference without refund, at the sole discretion of the secretariat.',
    },
    {
        title: '6. Intellectual Property',
        body: 'Position papers, resolutions, and other materials you submit remain your intellectual property, but you grant MYIMUN a non-exclusive license to store, review, and use them for conference administration and archival purposes.',
    },
    {
        title: '7. Limitation of Liability',
        body: 'MYIMUN and its organizers are not liable for indirect, incidental, or consequential damages arising from your participation, travel, or accommodation arrangements related to the conference.',
    },
    {
        title: '8. Changes to These Terms',
        body: 'We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms.',
    },
    {
        title: '9. Contact',
        body: <>Questions about these Terms can be sent through <Link href="/dashboard/contact" style={{ color: '#3B7FFF', fontWeight: 600 }}>Contact Support</Link>.</>,
    },
];
