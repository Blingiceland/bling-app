"use client";

import { XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
    return (
        <div className="text-center space-y-6 animate-fade-in-up py-8">
            <div className="w-20 h-20 mx-auto bg-red-500/15 rounded-full flex items-center justify-center border-2 border-red-500/50 text-red-400">
                <XCircle className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">
                Greiðsla mistókst
            </h3>
            <p className="text-white/60 text-lg max-w-sm mx-auto">
                Því miður tókst ekki að gjaldfæra kortið þitt. Vinsamlegast
                reyndu aftur.
            </p>

            <div className="pt-8">
                <Link
                    href="/events"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Reyna aftur
                </Link>
            </div>
        </div>
    );
}

export default function EventErrorPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
            <div className="w-full max-w-xl bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10">
                <Suspense
                    fallback={
                        <div className="text-center text-white/50">Hleður...</div>
                    }
                >
                    <ErrorContent />
                </Suspense>
            </div>
        </div>
    );
}
