import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <main
            className="min-h-svh w-full px-6 py-10 flex items-center justify-center"
            style={{ background: '#070D19', color: '#FFFFFF', fontFamily: '"Outfit", sans-serif' }}
        >
            <div className="w-full max-w-lg text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/assets/MYIMUN-WHITE-LOGO-VERTICAL.png"
                    alt="MYIMUN"
                    className="mx-auto h-[104px] w-[166px] object-contain sm:h-[118px] sm:w-[188px]"
                />

                <p className="mt-7 text-sm font-bold uppercase text-blue-400 sm:text-base">
                    Error 404
                </p>
                <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
                    Page not found
                </h1>
                <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-400 sm:text-lg">
                    The page you are looking for may have moved, expired, or never existed.
                </p>

                <Link
                    href="/"
                    className="mx-auto mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
                >
                    <ArrowLeft size={18} aria-hidden="true" />
                    Back to home
                </Link>
            </div>
        </main>
    );
}
