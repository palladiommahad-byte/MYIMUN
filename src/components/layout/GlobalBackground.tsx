import React from 'react';

export default function GlobalBackground() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[-1] bg-[#0B0F16]"
        >
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#0B0F16_0%,#111827_52%,#101418_100%)]" />
        </div>
    );
}
