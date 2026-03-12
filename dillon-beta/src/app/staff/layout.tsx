"use client";

import { AuthProvider } from "@/lib/auth-context";

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col font-sans selection:bg-amber-500/30">
                {/* Decorative background blur overlay */}
                <div className="pointer-events-none fixed inset-0 flex justify-center opacity-30">
                    <div className="h-[80vh] w-[80vw] bg-amber-600/20 blur-[120px] rounded-full translate-y-[-20%]"></div>
                </div>

                {/* Header */}
                <header className="relative z-10 p-6 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center font-black text-xl text-black shadow-lg shadow-amber-900/50">
                            D
                        </div>
                        <h1 className="text-xl font-bold tracking-widest text-amber-500 uppercase">
                            Staff Portal
                        </h1>
                    </div>
                </header>

                {/* Main Content */}
                <main className="relative z-10 flex-1 flex flex-col pt-12">
                    {children}
                </main>
            </div>
        </AuthProvider>
    );
}
