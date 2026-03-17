import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// =====================================================
// STILLINGAR
// =====================================================
const ALLOWED_IPS = (process.env.DILLON_ALLOWED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// =====================================================
// POST – Klukka inn/út
// =====================================================
export async function POST(req: NextRequest) {
    try {
        const { action, userId, email, displayName } = await req.json();

        if (!action || !userId || !email) {
            return NextResponse.json(
                { message: "Vantar nauðsynleg gildi (action, userId, email)." },
                { status: 400 }
            );
        }

        // 1. Sækja IP tölu
        const forwardedFor = req.headers.get("x-forwarded-for");
        const realIp = req.headers.get("x-real-ip");
        const clientIp =
            forwardedFor?.split(",")[0].trim() || realIp || "unknown";

        console.log(
            `[PUNCH] ${displayName} (${email}) – ${action} – IP: ${clientIp}`
        );

        // 2. IP restriction (aðeins í production)
        if (IS_PRODUCTION && ALLOWED_IPS.length > 0) {
            if (!ALLOWED_IPS.includes(clientIp)) {
                console.log(
                    `[PUNCH] HAFNAÐ: IP ${clientIp} ekki í [${ALLOWED_IPS.join(", ")}]`
                );
                return NextResponse.json(
                    {
                        message:
                            "Þú virðist ekki vera á Dillon Wi-Fi. Tengdu símann við netið á staðnum.",
                        success: false,
                    },
                    { status: 403 }
                );
            }
        }

        // 3. Vista stimplunarfærslu (hrátt log)
        const punchRef = await adminDb.collection("time_punches").add({
            userId,
            email,
            displayName,
            action,
            timestamp: FieldValue.serverTimestamp(),
            clientIp,
            userAgent: req.headers.get("user-agent") || "unknown",
        });

        console.log(`[PUNCH] ✅ Vistað: ${punchRef.id}`);

        // 4. Ef klukkað ÚT – búa til time_entry með flokkun
        if (action === "OUT") {
            await createTimeEntry(userId, email, displayName);
        }

        // 5. Uppfæra stöðu notanda
        await adminDb
            .collection("staff_status")
            .doc(userId)
            .set(
                {
                    email,
                    displayName,
                    currentStatus: action,
                    lastPunchTime: FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            action,
            message:
                action === "IN"
                    ? "Þú ert nú stimpluð/aður inn! Góða vakt 💪"
                    : "Þú ert nú stimpluð/aður út. Takk fyrir vaktina! 🎉",
        });
    } catch (error: any) {
        console.error("[PUNCH] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp. Reyndu aftur.", error: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// GET – Sækja stöðu notanda (er hann/hún inn?)
// =====================================================
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { message: "Vantar userId" },
                { status: 400 }
            );
        }

        const statusDoc = await adminDb
            .collection("staff_status")
            .doc(userId)
            .get();

        if (!statusDoc.exists) {
            return NextResponse.json({ currentStatus: "OUT", lastPunchTime: null });
        }

        const data = statusDoc.data();
        return NextResponse.json({
            currentStatus: data?.currentStatus || "OUT",
            lastPunchTime: data?.lastPunchTime?.toDate?.()?.toISOString() || null,
        });
    } catch (error: any) {
        console.error("[STATUS] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp.", error: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// Tímaútreikningur – Flokka vakt í taxta-flokka
// =====================================================

// Almennir frídagar á Íslandi 2026
const HOLIDAYS_2026 = [
    "2026-01-01", // Nýársdagur
    "2026-04-02", // Skírdagur
    "2026-04-03", // Föstudagurinn langi
    "2026-04-05", // Páskadagur
    "2026-04-06", // Annar í páskum
    "2026-04-23", // Sumardagurinn fyrsti
    "2026-05-01", // Verkalýðsdagurinn
    "2026-05-14", // Uppstigningardagur
    "2026-05-24", // Hvítasunnudagur
    "2026-05-25", // Annar í hvítasunnu
    "2026-06-17", // Þjóðhátíðardagur
    "2026-08-03", // Frídagur verslunarmanna
    "2026-12-24", // Aðfangadagur
    "2026-12-25", // Jóladagur
    "2026-12-26", // Annar í jólum
    "2026-12-31", // Gamlársdagur
];

function isHoliday(date: Date): boolean {
    const dateStr = date.toISOString().split("T")[0];
    return HOLIDAYS_2026.includes(dateStr);
}

type TimeCategory =
    | "A_dagvinna"
    | "B_kvoldvinna"
    | "C_helgar_fridagar"
    | "D_naeturvinna";

function classifyMinute(timestamp: Date): TimeCategory {
    const dayOfWeek = timestamp.getDay(); // 0=Sun, 6=Sat
    const hour = timestamp.getHours();

    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    const isWeekend = isSaturday || isSunday;

    // Flokkur D: Næturvinna – lau 00-06 (eftir fös kvöld) og sun 00-06 (eftir lau kvöld)
    if ((isSaturday || isSunday) && hour >= 0 && hour < 6) {
        return "D_naeturvinna";
    }

    // Flokkur C: Helgar og almennir frídagar (allir tímar)
    if (isWeekend || isHoliday(timestamp)) {
        return "C_helgar_fridagar";
    }

    // Flokkur A: Dagvinna á virkum dögum (11-17)
    if (hour >= 11 && hour < 17) {
        return "A_dagvinna";
    }

    // Flokkur B: Kvöldvinna á virkum dögum (17-00, og < 11)
    return "B_kvoldvinna";
}

function calculateBreakdown(
    clockIn: Date,
    clockOut: Date
): Record<TimeCategory, number> {
    const breakdown: Record<TimeCategory, number> = {
        A_dagvinna: 0,
        B_kvoldvinna: 0,
        C_helgar_fridagar: 0,
        D_naeturvinna: 0,
    };

    // Fara í gegnum hverja mínútu á milli inn og út
    const current = new Date(clockIn);
    while (current < clockOut) {
        const category = classifyMinute(current);
        breakdown[category]++;
        current.setMinutes(current.getMinutes() + 1);
    }

    return breakdown;
}

async function createTimeEntry(
    userId: string,
    email: string,
    displayName: string
) {
    try {
        // Finna síðustu IN stimplunar
        const lastInPunch = await adminDb
            .collection("time_punches")
            .where("userId", "==", userId)
            .where("action", "==", "IN")
            .orderBy("timestamp", "desc")
            .limit(1)
            .get();

        if (lastInPunch.empty) {
            console.log("[TIME_ENTRY] Engin IN stimplunar fannst");
            return;
        }

        const clockInData = lastInPunch.docs[0].data();
        const clockIn = clockInData.timestamp.toDate();
        const clockOut = new Date();

        // Reikna sundurliðun
        const breakdown = calculateBreakdown(clockIn, clockOut);
        const totalMinutes = Object.values(breakdown).reduce((a, b) => a + b, 0);

        // Vista time_entry
        const entryRef = await adminDb.collection("time_entries").add({
            userId,
            email,
            displayName,
            clockIn,
            clockOut,
            totalMinutes,
            breakdown,
            isHoliday: isHoliday(clockIn),
            status: "auto",
            editedBy: null,
            editedAt: null,
            notes: "",
            createdAt: FieldValue.serverTimestamp(),
        });

        console.log(
            `[TIME_ENTRY] ✅ Vakt vistuð: ${entryRef.id} – ${totalMinutes} mín – A:${breakdown.A_dagvinna} B:${breakdown.B_kvoldvinna} C:${breakdown.C_helgar_fridagar} D:${breakdown.D_naeturvinna}`
        );
    } catch (error) {
        console.error("[TIME_ENTRY] Villa við að búa til time entry:", error);
    }
}
