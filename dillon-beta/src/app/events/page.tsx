"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
    Calendar,
    Clock,
    MapPin,
    Ticket,
    LogIn,
    LogOut,
    ChevronRight,
    Music,
    Sparkles,
} from "lucide-react";

interface EventItem {
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
    status: string;
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

export default function EventsPage() {
    const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events/list");
            const data = await res.json();
            if (data.events) setEvents(data.events);
        } catch (err) {
            console.error("Failed to fetch events:", err);
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-[#050505] relative overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-600/8 rounded-full blur-[160px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-400/5 rounded-full blur-[160px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-900/3 rounded-full blur-[200px]" />
            </div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Music className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                        <span className="text-white font-bold text-lg tracking-[0.15em] uppercase">
                            Dillon
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {authLoading ? (
                            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                        ) : user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    {user.photoURL && (
                                        <img
                                            src={user.photoURL}
                                            alt=""
                                            className="w-8 h-8 rounded-full border border-accent/30"
                                        />
                                    )}
                                    <span className="text-white/70 text-sm hidden sm:block">
                                        {user.displayName?.split(" ")[0]}
                                    </span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Útskrá</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={signInWithGoogle}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium hover:bg-white/10 hover:border-accent/30 transition-all"
                            >
                                <LogIn className="w-4 h-4" />
                                Innskrá
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative z-10 pt-32 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full mb-8 animate-fade-in-up">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span className="text-accent text-xs font-bold uppercase tracking-[0.2em]">
                            Viðburðir á Dillon
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight animate-fade-in-up delay-100"
                        style={{ opacity: 0, animationFillMode: "forwards" }}>
                        Viðburðir &{" "}
                        <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                            Miðasala
                        </span>
                    </h1>
                    <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed animate-fade-in-up delay-200"
                        style={{ opacity: 0, animationFillMode: "forwards" }}>
                        Finndu næsta viðburð, veldu fjölda miða og kláraðu kaupin á öruggan hátt.
                    </p>
                </div>
            </section>

            {/* Events Grid */}
            <section className="relative z-10 px-6 pb-24">
                <div className="max-w-5xl mx-auto">
                    {loading ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-72 bg-white/5 rounded-2xl animate-pulse border border-white/5"
                                />
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                                <Calendar className="w-8 h-8 text-white/20" />
                            </div>
                            <h3 className="text-xl text-white/40 font-semibold mb-2">
                                Engir viðburðir í boði
                            </h3>
                            <p className="text-white/20 text-sm">
                                Nýir viðburðir verða auglýstir fljótlega!
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {events.map((event, idx) => {
                                const remaining = event.totalTickets - event.ticketsSold;
                                const soldOut = remaining <= 0;
                                const almostSoldOut = remaining > 0 && remaining <= 10;

                                return (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.id}`}
                                        className={`group relative rounded-2xl border bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(212,175,55,0.08)] ${soldOut
                                            ? "border-white/5 opacity-60"
                                            : "border-white/10 hover:border-accent/30"
                                            }`}
                                        style={{
                                            opacity: 0,
                                            animation: `fadeInUp 0.6s ease-out ${idx * 100 + 300}ms forwards`,
                                        }}
                                    >
                                        {/* Top gradient bar */}
                                        <div className="h-1 bg-gradient-to-r from-amber-500/0 via-amber-400/60 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* Event Image */}
                                        {event.imageUrl && (
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                                            </div>
                                        )}

                                        <div className="p-6 md:p-8">
                                            {/* Status badges */}
                                            <div className="flex items-center gap-2 mb-4">
                                                {soldOut ? (
                                                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider">
                                                        Uppselt
                                                    </span>
                                                ) : almostSoldOut ? (
                                                    <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                                                        Fáir eftir!
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-bold uppercase tracking-wider">
                                                        Í boði
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-accent transition-colors duration-300 tracking-tight">
                                                {event.title}
                                            </h2>

                                            {/* Description */}
                                            {event.description && (
                                                <p className="text-white/40 text-sm leading-relaxed mb-6 line-clamp-2">
                                                    {event.description}
                                                </p>
                                            )}

                                            {/* Meta info */}
                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="flex items-center gap-2 text-white/50 text-sm">
                                                    <Calendar className="w-4 h-4 text-accent/60" />
                                                    <span>{formatDate(event.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/50 text-sm">
                                                    <Clock className="w-4 h-4 text-accent/60" />
                                                    <span>kl. {event.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/50 text-sm">
                                                    <MapPin className="w-4 h-4 text-accent/60" />
                                                    <span>{event.venue || "Dillon"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white/50 text-sm">
                                                    <Ticket className="w-4 h-4 text-accent/60" />
                                                    <span>
                                                        {soldOut
                                                            ? "Uppselt"
                                                            : `${remaining} eftir`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Price + CTA */}
                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <div>
                                                    <span className="text-white/30 text-xs uppercase tracking-wider block">
                                                        Verð/miði
                                                    </span>
                                                    <span className="text-xl font-bold text-accent">
                                                        {formatISK(event.pricePerTicket)}
                                                    </span>
                                                </div>
                                                {!soldOut && (
                                                    <div className="flex items-center gap-2 text-accent text-sm font-semibold group-hover:gap-3 transition-all">
                                                        Kaupa miða
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
