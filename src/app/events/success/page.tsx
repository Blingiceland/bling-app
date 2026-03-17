"use client";

import { CheckCircle, Mail, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [emailStatus, setEmailStatus] = useState<
        "idle" | "loading" | "sent" | "error"
    >("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSendEmail = async () => {
        if (!id) return;
        setEmailStatus("loading");
        try {
            const res = await fetch("/api/events/send-receipt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Villa við sendingu");
            setEmailStatus("sent");
        } catch (err: any) {
            console.error("Email error:", err);
            setErrorMsg(err.message);
            setEmailStatus("error");
        }
    };

    return (
        <div className="text-center space-y-6 animate-fade-in-up py-8">
            <div className="w-20 h-20 mx-auto bg-green-500/15 rounded-full flex items-center justify-center border-2 border-green-500/50 text-green-400">
                <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">
                Miðakaup staðfest!
            </h3>
            <p className="text-white/60 text-lg max-w-sm mx-auto">
                Takk fyrir! Greiðsla tókst og miðarnir þínir eru bókaðir.
            </p>
            <p className="text-white/40 text-sm max-w-sm mx-auto">
                Smelltu á hnappinn hér að neðan til að fá kvittun senda á
                netfangið þitt.
            </p>

            {id && (
                <div className="flex flex-col items-center justify-center gap-3 pt-6 border-t border-white/10 mt-6">
                    {emailStatus === "idle" && (
                        <button
                            onClick={handleSendEmail}
                            className="bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm"
                        >
                            <Mail className="w-5 h-5" />
                            Senda kvittun á netfang
                        </button>
                    )}

                    {emailStatus === "loading" && (
                        <div className="text-white/60 flex items-center gap-2 px-6 py-3">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Sendir póst...
                        </div>
                    )}

                    {emailStatus === "sent" && (
                        <div className="text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-xl text-sm">
                            ✅ Kvittun hefur verið send!
                        </div>
                    )}

                    {emailStatus === "error" && (
                        <div className="text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-xl text-sm">
                            Gat ekki sent póst: {errorMsg}
                            <button
                                onClick={() => setEmailStatus("idle")}
                                className="block mt-2 text-xs opacity-70 hover:opacity-100 underline mx-auto"
                            >
                                Reyna aftur
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="pt-8">
                <Link
                    href="/events"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Aftur á viðburði
                </Link>
            </div>
        </div>
    );
}

export default function EventSuccessPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
            <div className="w-full max-w-xl bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10">
                <Suspense
                    fallback={
                        <div className="text-center text-white/50 py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </div>
                    }
                >
                    <SuccessContent />
                </Suspense>
            </div>
        </div>
    );
}
