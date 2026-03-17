"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UserPlus, ChevronRight, ChevronLeft, Check } from "lucide-react";

interface StaffProfile {
    // Persónuupplýsingar
    fullName: string;
    kennitala: string;
    phone: string;
    address: string;

    // Starfsupplýsingar
    role: string;
    startDate: string;

    // Bankaupplýsingar
    bankNumber: string;       // Banki (4 tölustafir)
    ledger: string;            // Höfuðbók (2 tölustafir)
    accountNumber: string;     // Reikningsnúmer (6 tölustafir)

    // Stéttarfélag og lífeyrir
    union: string;             // Stéttarfélag
    pensionFund: string;       // Lífeyrissjóður

    // Neyðartengiliður
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelation: string;
}

const UNIONS = [
    "Efling",
    "VR",
    "Eflingar- og starfsmannafélag Akureyrar",
    "Verkalýðsfélag Vestfirðinga",
    "Starfsgreinasamband Íslands",
    "Annað",
];

const PENSION_FUNDS = [
    "Birta lífeyrissjóður",
    "Gildi lífeyrissjóður",
    "Lífeyrissjóður verzlunarmanna",
    "Festa lífeyrissjóður",
    "Stapi lífeyrissjóður",
    "Söfnunarsjóður lífeyrisréttinda",
    "Almenni lífeyrissjóðurinn",
    "Annað",
];

const ROLES = [
    "Barþjónn",
    "Dyravörður",
    "DJ",
    "Ræstitæknir",
    "Stjórnandi",
    "Annað",
];

const INITIAL_PROFILE: StaffProfile = {
    fullName: "",
    kennitala: "",
    phone: "",
    address: "",
    role: "",
    startDate: "",
    bankNumber: "",
    ledger: "",
    accountNumber: "",
    union: "",
    pensionFund: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
};

export default function StaffRegisterPage() {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<StaffProfile>({
        ...INITIAL_PROFILE,
        fullName: user?.displayName || "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateField = (field: keyof StaffProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/staff/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    email: user.email,
                    photoURL: user.photoURL,
                    ...profile,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Villa kom upp");

            setIsComplete(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isComplete) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
                <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/30">
                        <Check className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-white mb-3">
                        Skráning móttekin!
                    </h2>
                    <p className="text-stone-400 text-sm mb-8 leading-relaxed">
                        Upplýsingarnar þínar hafa verið vistaðar. Þú getur nú farið á
                        stimplunar&shy;síðuna til að klukka þig inn í vaktir.
                    </p>
                    <a
                        href="/staff"
                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-8 rounded-2xl transition-all active:scale-95"
                    >
                        Fara á stimplunar&shy;síðu
                        <ChevronRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        );
    }

    const steps = [
        {
            title: "Persónuupplýsingar",
            content: (
                <div className="space-y-4">
                    <InputField
                        label="Fullt nafn"
                        value={profile.fullName}
                        onChange={(v) => updateField("fullName", v)}
                        placeholder="Jón Jónsson"
                    />
                    <InputField
                        label="Kennitala"
                        value={profile.kennitala}
                        onChange={(v) => updateField("kennitala", v)}
                        placeholder="000000-0000"
                        maxLength={11}
                    />
                    <InputField
                        label="Símanúmer"
                        value={profile.phone}
                        onChange={(v) => updateField("phone", v)}
                        placeholder="777-0000"
                        type="tel"
                    />
                    <InputField
                        label="Heimilisfang"
                        value={profile.address}
                        onChange={(v) => updateField("address", v)}
                        placeholder="Laugavegur 30, 101 Reykjavík"
                    />
                </div>
            ),
        },
        {
            title: "Starfsupplýsingar",
            content: (
                <div className="space-y-4">
                    <SelectField
                        label="Hlutverk"
                        value={profile.role}
                        onChange={(v) => updateField("role", v)}
                        options={ROLES}
                    />
                    <InputField
                        label="Upphafsdagur"
                        value={profile.startDate}
                        onChange={(v) => updateField("startDate", v)}
                        type="date"
                    />
                </div>
            ),
        },
        {
            title: "Bankaupplýsingar",
            content: (
                <div className="space-y-4">
                    <p className="text-stone-500 text-xs mb-2">
                        Bankareikningur til launagreiðslna
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <InputField
                            label="Banki"
                            value={profile.bankNumber}
                            onChange={(v) => updateField("bankNumber", v)}
                            placeholder="0000"
                            maxLength={4}
                        />
                        <InputField
                            label="Hb."
                            value={profile.ledger}
                            onChange={(v) => updateField("ledger", v)}
                            placeholder="00"
                            maxLength={2}
                        />
                        <InputField
                            label="Reikningsnr."
                            value={profile.accountNumber}
                            onChange={(v) => updateField("accountNumber", v)}
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Stéttarfélag & Lífeyrir",
            content: (
                <div className="space-y-4">
                    <SelectField
                        label="Stéttarfélag"
                        value={profile.union}
                        onChange={(v) => updateField("union", v)}
                        options={UNIONS}
                    />
                    <SelectField
                        label="Lífeyrissjóður"
                        value={profile.pensionFund}
                        onChange={(v) => updateField("pensionFund", v)}
                        options={PENSION_FUNDS}
                    />

                </div>
            ),
        },
        {
            title: "Neyðartengiliður",
            content: (
                <div className="space-y-4">
                    <InputField
                        label="Nafn"
                        value={profile.emergencyName}
                        onChange={(v) => updateField("emergencyName", v)}
                        placeholder="Anna Jónsdóttir"
                    />
                    <InputField
                        label="Símanúmer"
                        value={profile.emergencyPhone}
                        onChange={(v) => updateField("emergencyPhone", v)}
                        placeholder="888-0000"
                        type="tel"
                    />
                    <InputField
                        label="Tengsl (maki, foreldri...)"
                        value={profile.emergencyRelation}
                        onChange={(v) => updateField("emergencyRelation", v)}
                        placeholder="Maki"
                    />
                </div>
            ),
        },
    ];

    const currentStep = steps[step];
    const isLastStep = step === steps.length - 1;

    return (
        <div className="flex-1 flex flex-col items-center justify-start p-6 pb-20">
            <div className="w-full max-w-md flex flex-col items-center gap-6">
                {/* Header */}
                <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-stone-900 to-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-white/5">
                        <UserPlus className="w-7 h-7 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-white">
                        Nýskráning
                    </h2>
                    <p className="text-stone-500 text-sm mt-1">
                        Vinsamlegast fylltu út eftirfarandi upplýsingar
                    </p>
                </div>

                {/* Progress */}
                <div className="w-full flex gap-1.5">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${i <= step
                                ? "bg-amber-500"
                                : "bg-white/10"
                                }`}
                        />
                    ))}
                </div>

                {/* Step Content */}
                <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-1">
                        {currentStep.title}
                    </h3>
                    <p className="text-stone-500 text-xs mb-5">
                        Skref {step + 1} af {steps.length}
                    </p>
                    {currentStep.content}
                </div>

                {/* Error */}
                {error && (
                    <div className="w-full bg-red-950/40 border border-red-500/50 p-3 rounded-2xl text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="w-full flex gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            className="flex-1 py-3.5 px-6 rounded-2xl border border-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/5 transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Til baka
                        </button>
                    )}
                    {isLastStep ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                            ) : (
                                <>
                                    Staðfesta skráningu
                                    <Check className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => setStep((s) => s + 1)}
                            className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            Áfram
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// Reusable Form Components
// =====================================================

function InputField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    maxLength,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    maxLength?: number;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5 uppercase tracking-wider">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
            />
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5 uppercase tracking-wider">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm appearance-none"
            >
                <option value="" className="bg-stone-900">
                    Veldu...
                </option>
                {options.map((opt) => (
                    <option key={opt} value={opt} className="bg-stone-900">
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}
