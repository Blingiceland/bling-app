"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
    Calendar,
    Clock,
    MapPin,
    Ticket,
    ArrowLeft,
    LogIn,
    Minus,
    Plus,
    ShieldCheck,
    Users,
    Loader2,
} from "lucide-react";

interface EventDetail {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    pricePerTicket: number;
    totalTickets: number;
    ticketsSold: number;
    imageUrl?: string;
}

function formatISK(n: number) {
    return n.toLocaleString("is-IS") + " kr.";
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("is-IS", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [ticketCount, setTicketCount] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [paymentPayload, setPaymentPayload] = useState<{
        url: string;
        fields: Record<string, string>;
    } | null>(null);

    const eventId = params.id as string;

    useEffect(() => {
        if (eventId) fetchEvent();
    }, [eventId]);

    const fetchEvent = async () => {
        try {
            const res = await fetch("/api/events/list");
            const data = await res.json();
            if (data.events) {
                const found = data.events.find(
                    (e: EventDetail) => e.id === eventId
                );
                if (found) setEvent(found);
            }
        } catch (err) {
            console.error("Failed to fetch event:", err);
        }
        setLoading(false);
    };

    const remaining = event
        ? event.totalTickets - event.ticketsSold
        : 0;
    const soldOut = remaining <= 0;
    const totalPrice = event ? ticketCount * event.pricePerTicket : 0;

    const handlePurchase = async () => {
        if (!user || !event) return;
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/events/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: event.id,
                    ticketCount,
                    userId: user.uid,
                    userEmail: user.email,
                    userName: user.displayName || user.email,
                }),
            });
            const data = await res.json();

            if (data.success && data.paymentPayload) {
                setPaymentPayload(data.paymentPayload);
            } else {
                setError(data.error || "Villa kom upp við pöntun");
            }
        } catch {
            setError("Villa kom upp við að tengjast þjóni");
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </main>
        );
    }

    if (!event) {
        return (
            <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 px-6">
                <h1 className="text-2xl text-white font-bold">
                    Viðburður fannst ekki
                </h1>
                <Link
                    href="/events"
                    className="text-accent hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
                >
                    ← Til baka
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] relative overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-600/6 rounded-full blur-[180px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-400/4 rounded-full blur-[140px]" />
            </div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link
                        href="/events"
                        className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Viðburðir</span>
                    </Link>
                    {user && (
                        <div className="flex items-center gap-2">
                            {user.photoURL && (
                                <img
                                    src={user.photoURL}
                                    alt=""
                                    className="w-7 h-7 rounded-full border border-accent/30"
                                />
                            )}
                            <span className="text-white/50 text-sm">
                                {user.displayName?.split(" ")[0]}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-20">
                {/* Event info card */}
                <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-3xl overflow-hidden mb-8 animate-fade-in-up">
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-amber-500/0 via-amber-400/60 to-amber-500/0" />

                    {/* Event Hero Image */}
                    {event.imageUrl && (
                        <div className="relative h-64 md:h-80 overflow-hidden">
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/50 to-transparent" />
                        </div>
                    )}

                    <div className="p-8 md:p-12">
                        {/* Status badge */}
                        <div className="mb-6">
                            {soldOut ? (
                                <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider">
                                    Uppselt
                                </span>
                            ) : remaining <= 10 ? (
                                <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-bold uppercase tracking-wider">
                                    Fáir eftir — {remaining} miðar
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-bold uppercase tracking-wider">
                                    Í boði — {remaining} miðar eftir
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                            {event.title}
                        </h1>

                        {/* Description */}
                        {event.description && (
                            <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-2xl">
                                {event.description}
                            </p>
                        )}

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                <Calendar className="w-5 h-5 text-accent/70 mb-2" />
                                <span className="text-white/30 text-xs uppercase tracking-wider block mb-1">
                                    Dagsetning
                                </span>
                                <span className="text-white font-semibold text-sm">
                                    {formatDate(event.date)}
                                </span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                <Clock className="w-5 h-5 text-accent/70 mb-2" />
                                <span className="text-white/30 text-xs uppercase tracking-wider block mb-1">
                                    Tími
                                </span>
                                <span className="text-white font-semibold text-sm">
                                    kl. {event.time}
                                </span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                <MapPin className="w-5 h-5 text-accent/70 mb-2" />
                                <span className="text-white/30 text-xs uppercase tracking-wider block mb-1">
                                    Staðsetning
                                </span>
                                <span className="text-white font-semibold text-sm">
                                    {event.venue || "Dillon"}
                                </span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                <Users className="w-5 h-5 text-accent/70 mb-2" />
                                <span className="text-white/30 text-xs uppercase tracking-wider block mb-1">
                                    Miðafjöldi
                                </span>
                                <span className="text-white font-semibold text-sm">
                                    {event.ticketsSold} / {event.totalTickets} seld
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchase section */}
                {!soldOut && (
                    <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-3xl p-8 md:p-12 animate-fade-in-up delay-200"
                        style={{ opacity: 0, animationFillMode: "forwards" }}>

                        {/* Not logged in */}
                        {!authLoading && !user && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-6 border border-accent/20">
                                    <LogIn className="w-7 h-7 text-accent" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">
                                    Skráðu þig inn til að kaupa miða
                                </h3>
                                <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
                                    Notaðu Google reikninginn þinn til að skrá þig inn og
                                    kaupa miða á viðburðinn.
                                </p>
                                <button
                                    onClick={signInWithGoogle}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl group"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Skrá inn með Google
                                </button>
                            </div>
                        )}

                        {/* Logged in — purchase form */}
                        {user && !paymentPayload && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">
                                        Kaupa miða
                                    </h2>
                                    <p className="text-white/40 text-sm">
                                        Innskráð/ur sem{" "}
                                        <span className="text-accent">
                                            {user.email}
                                        </span>
                                    </p>
                                </div>

                                {/* Ticket count selector */}
                                <div>
                                    <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-3">
                                        Fjöldi miða
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() =>
                                                setTicketCount((c) =>
                                                    Math.max(1, c - 1)
                                                )
                                            }
                                            disabled={ticketCount <= 1}
                                            className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-accent/30 disabled:opacity-20 flex items-center justify-center transition-all"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <span className="text-4xl font-black text-white min-w-[3ch] text-center tabular-nums">
                                            {ticketCount}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setTicketCount((c) =>
                                                    Math.min(remaining, Math.min(10, c + 1))
                                                )
                                            }
                                            disabled={
                                                ticketCount >= remaining ||
                                                ticketCount >= 10
                                            }
                                            className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-accent/30 disabled:opacity-20 flex items-center justify-center transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-white/20 text-xs mt-2">
                                        Hámark 10 miðar per kaup
                                    </p>
                                </div>

                                {/* Price breakdown */}
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/50">
                                            {ticketCount}× miði á{" "}
                                            {formatISK(event.pricePerTicket)}
                                        </span>
                                        <span className="text-white/70">
                                            {formatISK(totalPrice)}
                                        </span>
                                    </div>
                                    <div className="border-t border-white/5 pt-3 flex justify-between">
                                        <span className="text-white font-bold">
                                            Samtals
                                        </span>
                                        <span className="text-2xl font-black text-accent">
                                            {formatISK(totalPrice)}
                                        </span>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handlePurchase}
                                    disabled={submitting}
                                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Vinnur...
                                        </>
                                    ) : (
                                        <>
                                            <Ticket className="w-4 h-4" />
                                            Ganga frá greiðslu — {formatISK(totalPrice)}
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-white/20 text-xs">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Örugg greiðsla í gegnum Teya
                                </div>
                            </div>
                        )}

                        {/* Payment redirect form (hidden, auto-submits or user clicks) */}
                        {user && paymentPayload && (
                            <div className="text-center py-8 space-y-6">
                                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4 border border-accent/20 animate-pulse-glow">
                                    <ShieldCheck className="w-7 h-7 text-accent" />
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    Pöntun skráð!
                                </h3>
                                <p className="text-white/50 text-sm max-w-sm mx-auto">
                                    Smelltu á hnappinn hér að neðan til að klára greiðsluna
                                    í öruggri greiðslugátt Teya.
                                </p>

                                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-sm">
                                    <div className="flex justify-between text-white/50 mb-1">
                                        <span>Viðburður</span>
                                        <span className="text-white font-semibold">
                                            {event.title}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-white/50 mb-1">
                                        <span>Fjöldi</span>
                                        <span className="text-white font-semibold">
                                            {ticketCount} miðar
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-white/5">
                                        <span className="text-white font-bold">
                                            Samtals
                                        </span>
                                        <span className="text-accent font-black text-lg">
                                            {formatISK(totalPrice)}
                                        </span>
                                    </div>
                                </div>

                                <form
                                    action={paymentPayload.url}
                                    method="POST"
                                >
                                    {Object.entries(paymentPayload.fields).map(
                                        ([key, value]) => (
                                            <input
                                                type="hidden"
                                                key={key}
                                                name={key}
                                                value={value}
                                            />
                                        )
                                    )}
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                                    >
                                        Greiða núna — {formatISK(totalPrice)}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
