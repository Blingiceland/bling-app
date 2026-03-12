"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Clock, AlertCircle, CheckCircle2, MapPin, Coffee, LogOut, CalendarDays, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function StaffPage() {
    const { user, loading, signInWithGoogle, logout } = useAuth();
    const router = useRouter();
    const [punchStatus, setPunchStatus] = useState<"OUT" | "IN">("OUT");
    const [error, setError] = useState<string | null>(null);
    const [isPunching, setIsPunching] = useState(false);
    const [lastPunchTime, setLastPunchTime] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Uppfæra klukku á hverri sekúndu
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Sækja stöðu notanda og athuga skráningu þegar hann loggast inn
    useEffect(() => {
        if (!user) {
            setIsCheckingRegistration(false);
            return;
        }
        const checkUserStatus = async () => {
            try {
                // Athuga hvort notandi sé skráður
                const regRes = await fetch(`/api/staff/register?userId=${user.uid}`);
                const regData = await regRes.json();

                if (!regData.isRegistered) {
                    // Ef ekki skráður, senda á skráningarsíðu
                    router.push("/staff/register");
                    return;
                }

                // Sækja stimplun stöðu
                const punchRes = await fetch(`/api/staff/punch?userId=${user.uid}`);
                const punchData = await punchRes.json();
                if (punchData.currentStatus) {
                    setPunchStatus(punchData.currentStatus);
                }
                if (punchData.lastPunchTime) {
                    setLastPunchTime(
                        new Date(punchData.lastPunchTime).toLocaleTimeString("is-IS", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                    );
                }
            } catch (err) {
                console.error("Villa við að sækja stöðu:", err);
            } finally {
                setIsCheckingRegistration(false);
            }
        };
        checkUserStatus();
    }, [user, router]);

    const handlePunch = async (action: "IN" | "OUT") => {
        if (!user) return;
        setError(null);
        setIsPunching(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/staff/punch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    action,
                    userId: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Eitthvað fór úrskeiðis.");
            }

            setPunchStatus(action);
            setLastPunchTime(
                new Date().toLocaleTimeString("is-IS", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
            setSuccessMessage(data.message || (action === "IN" ? "Þú ert stimpluð/aður inn!" : "Þú ert stimpluð/aður út!"));
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setError(err.message || "Vinsamlegast tengdu símann við Wi-Fi á staðnum.");
        } finally {
            setIsPunching(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("is-IS", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("is-IS", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // Loading state
    if (loading || isCheckingRegistration) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center h-full">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin"></div>
                <p className="mt-4 text-amber-500/70 text-sm font-medium tracking-widest uppercase">
                    Hleður...
                </p>
            </div>
        );
    }

    // Login view
    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
                <div className="w-full max-w-sm flex flex-col items-center bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <div className="w-20 h-20 bg-gradient-to-tr from-stone-900 to-stone-800 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden ring-1 ring-white/5">
                        <LogIn className="w-8 h-8 text-amber-500 z-10" />
                        <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl"></div>
                    </div>

                    <h2 className="text-2xl font-bold mb-2 font-serif text-white text-center">
                        Innskráning Starfsfólks
                    </h2>
                    <p className="text-stone-400 text-center text-sm mb-8 leading-relaxed">
                        Nýttu Google aðganginn þinn til að skrá þig inn og út úr vakt.
                    </p>

                    <button
                        onClick={signInWithGoogle}
                        className="w-full relative group overflow-hidden bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-white/5"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Innskrá með Google
                    </button>
                </div>
            </div>
        );
    }

    // Logged in - Punch view
    return (
        <div className="flex-1 flex flex-col items-center justify-start p-6 pb-20">
            <div className="w-full max-w-sm flex flex-col items-center gap-6">
                {/* User Card */}
                <div className="w-full bg-black/40 backdrop-blur-xl border border-white/5 p-5 rounded-3xl shadow-2xl flex items-center gap-4">
                    <img
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=f59e0b&color=fff`}
                        alt={user.displayName || "Staff"}
                        className="w-14 h-14 rounded-2xl ring-2 ring-white/10 shadow-lg object-cover"
                        referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold font-serif text-white truncate">
                            {user.displayName}
                        </h2>
                        <p className="text-stone-400 text-sm truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-stone-500 hover:text-white"
                        title="Útskrá"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Clock Display */}
                <div className="w-full bg-black/20 backdrop-blur-sm border border-white/5 rounded-2xl p-4 text-center">
                    <p className="text-4xl font-mono font-bold text-white tracking-wider tabular-nums">
                        {formatTime(currentTime)}
                    </p>
                    <p className="text-stone-500 text-xs mt-1 capitalize">
                        {formatDate(currentTime)}
                    </p>
                </div>

                {/* Quick Links */}
                <a
                    href="/staff/schedule"
                    className="w-full flex items-center justify-between bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3.5 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <CalendarDays className="w-5 h-5 text-amber-500" />
                        <span className="text-white font-semibold text-sm">Vaktaplan vikunnar</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-500 transition-colors" />
                </a>
                <a
                    href="/staff/timesheets"
                    className="w-full flex items-center justify-between bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-3.5 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-semibold text-sm">Tímaskráningar</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-blue-400 transition-colors" />
                </a>
                {/* Error Alert */}
                {error && (
                    <div className="w-full bg-red-950/40 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-sm">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-red-400 font-semibold text-sm mb-1">
                                Aðgerð mistókst
                            </h4>
                            <p className="text-red-200/80 text-xs leading-relaxed">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Alert */}
                {successMessage && (
                    <div className="w-full bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <p className="text-emerald-200 text-sm font-medium">{successMessage}</p>
                    </div>
                )}
                {/* Action Area */}
                <div className="w-full flex flex-col items-center bg-gradient-to-b from-[#111611] to-[#0a0f0a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] rounded-full"></div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {punchStatus === "IN" ? (
                            <span className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ring-emerald-400/20">
                                <CheckCircle2 className="w-4 h-4" />
                                Á Vakt
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-stone-400 bg-stone-500/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ring-white/5">
                                <Coffee className="w-4 h-4" />
                                Ekki stimpluð/aður inn
                            </span>
                        )}
                    </div>

                    {/* Last punch time */}
                    {lastPunchTime && (
                        <p className="text-stone-500 text-xs mb-2">
                            Síðasta stimplung: {lastPunchTime}
                        </p>
                    )}

                    <p className="text-stone-500 text-xs text-center mb-8 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3 h-3" />
                        Aðeins virkt á staðnum (Dillon Wi-Fi)
                    </p>

                    {/* Big Punch Button */}
                    {punchStatus === "OUT" ? (
                        <button
                            onClick={() => handlePunch("IN")}
                            disabled={isPunching}
                            className="group relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] transition-all"></div>
                            <div className="absolute inset-1 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full"></div>
                            <div className="absolute inset-2 bg-gradient-to-tr from-[#111] to-[#222] rounded-full shadow-inner"></div>
                            {isPunching ? (
                                <div className="w-10 h-10 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin z-10"></div>
                            ) : (
                                <>
                                    <Clock className="w-10 h-10 text-amber-500 z-10" strokeWidth={1.5} />
                                    <span className="z-10 text-white font-bold text-xl tracking-wider text-center leading-tight">
                                        KLUKKA
                                        <br />
                                        INN
                                    </span>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => handlePunch("OUT")}
                            disabled={isPunching}
                            className="group relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-red-600 rounded-full shadow-[0_0_40px_rgba(225,29,72,0.3)] group-hover:shadow-[0_0_60px_rgba(225,29,72,0.5)] transition-all"></div>
                            <div className="absolute inset-1 bg-gradient-to-b from-rose-600 to-red-800 rounded-full"></div>
                            <div className="absolute inset-2 bg-gradient-to-tr from-[#111] to-[#222] rounded-full shadow-inner"></div>
                            {isPunching ? (
                                <div className="w-10 h-10 rounded-full border-4 border-rose-500/30 border-t-rose-500 animate-spin z-10"></div>
                            ) : (
                                <>
                                    <LogOut className="w-10 h-10 text-rose-500 z-10" />
                                    <span className="z-10 text-white font-bold text-xl tracking-wider text-center leading-tight">
                                        KLUKKA
                                        <br />
                                        ÚT
                                    </span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
