import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

// =====================================================
// GET – Sækja vaktaplan eftir viku
// =====================================================
export async function GET(req: NextRequest) {
    try {
        const weekStart = req.nextUrl.searchParams.get("weekStart");

        if (weekStart) {
            // Sækja ákveðna viku
            const doc = await adminDb
                .collection("schedules")
                .doc(weekStart)
                .get();

            if (!doc.exists) {
                return NextResponse.json({ schedule: null });
            }

            return NextResponse.json({
                schedule: {
                    weekStart: doc.id,
                    ...doc.data(),
                    createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
                    updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
                    emailSentAt: doc.data()?.emailSentAt?.toDate?.()?.toISOString() || null,
                },
            });
        }

        // Sækja nýjasta vaktaplanið (current + next week)
        const now = new Date();
        const currentMonday = getMonday(now);
        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);

        const currentKey = formatDateKey(currentMonday);
        const nextKey = formatDateKey(nextMonday);

        const [currentDoc, nextDoc] = await Promise.all([
            adminDb.collection("schedules").doc(currentKey).get(),
            adminDb.collection("schedules").doc(nextKey).get(),
        ]);

        const schedules: any[] = [];
        if (currentDoc.exists) {
            schedules.push({
                weekStart: currentDoc.id,
                ...currentDoc.data(),
                createdAt: currentDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: currentDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
                emailSentAt: currentDoc.data()?.emailSentAt?.toDate?.()?.toISOString() || null,
            });
        }
        if (nextDoc.exists) {
            schedules.push({
                weekStart: nextDoc.id,
                ...nextDoc.data(),
                createdAt: nextDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: nextDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
                emailSentAt: nextDoc.data()?.emailSentAt?.toDate?.()?.toISOString() || null,
            });
        }

        return NextResponse.json({ schedules, currentWeek: currentKey, nextWeek: nextKey });
    } catch (error: any) {
        console.error("[SCHEDULE API] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp", error: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// POST – Vista vaktaplan og/eða senda email
// =====================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === "save") {
            return saveSchedule(body);
        } else if (action === "sendEmail") {
            return sendScheduleEmail(body);
        } else {
            return NextResponse.json({ message: "Óþekkt action" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("[SCHEDULE API] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp", error: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// Vista vaktaplan
// =====================================================
async function saveSchedule(body: any) {
    const { weekStart, days } = body;

    if (!weekStart || !days) {
        return NextResponse.json(
            { message: "Vantar weekStart og days" },
            { status: 400 }
        );
    }

    await adminDb.collection("schedules").doc(weekStart).set(
        {
            days,
            updatedAt: new Date(),
            createdAt: (await adminDb.collection("schedules").doc(weekStart).get()).exists
                ? undefined
                : new Date(),
        },
        { merge: true }
    );

    return NextResponse.json({
        message: "Vaktaplan vistað!",
        weekStart,
    });
}

// =====================================================
// Senda email til alls starfsfólks
// =====================================================
async function sendScheduleEmail(body: any) {
    const { weekStart } = body;

    if (!weekStart) {
        return NextResponse.json(
            { message: "Vantar weekStart" },
            { status: 400 }
        );
    }

    // Sækja vaktaplanið
    const scheduleDoc = await adminDb
        .collection("schedules")
        .doc(weekStart)
        .get();

    if (!scheduleDoc.exists) {
        return NextResponse.json(
            { message: "Ekkert vaktaplan fannst" },
            { status: 404 }
        );
    }

    const scheduleData = scheduleDoc.data()!;
    const days = scheduleData.days as Record<string, { name: string; time: string }[]>;

    // Sækja alla starfsmenn
    const staffSnap = await adminDb
        .collection("staff_users")
        .where("isRegistered", "==", true)
        .where("isActive", "!=", false)
        .get();

    const staffEmails = staffSnap.docs
        .map((doc) => doc.data().email)
        .filter(Boolean);

    if (staffEmails.length === 0) {
        return NextResponse.json(
            { message: "Engir starfsmenn með email fundust" },
            { status: 400 }
        );
    }

    // Búa til email innihald
    const emailHtml = buildScheduleEmailHtml(weekStart, days);

    // Senda email
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || "dillon@dillon.is";

    if (!smtpHost || !smtpUser || !smtpPass) {
        return NextResponse.json(
            { message: "SMTP stillingar vantar (.env). Þarft SMTP_HOST, SMTP_USER, SMTP_PASS" },
            { status: 500 }
        );
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    // Finna vikudagasvið
    const monday = new Date(weekStart);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekLabel = `${monday.toLocaleDateString("is-IS", { day: "numeric", month: "long" })} – ${sunday.toLocaleDateString("is-IS", { day: "numeric", month: "long", year: "numeric" })}`;

    await transporter.sendMail({
        from: `"Dillon Staff" <${smtpFrom}>`,
        bcc: staffEmails,
        subject: `📅 Vaktaplan – ${weekLabel}`,
        html: emailHtml,
    });

    // Merkja sem sent
    await adminDb.collection("schedules").doc(weekStart).update({
        emailSentAt: new Date(),
        emailSentTo: staffEmails,
    });

    return NextResponse.json({
        message: `Email sent til ${staffEmails.length} starfsmanna!`,
        sentTo: staffEmails.length,
    });
}

// =====================================================
// Email HTML template
// =====================================================
function buildScheduleEmailHtml(
    weekStart: string,
    days: Record<string, { name: string; time: string }[]>
): string {
    const DAY_NAMES: Record<string, string> = {
        "1": "Mánudagur",
        "2": "Þriðjudagur",
        "3": "Miðvikudagur",
        "4": "Fimmtudagur",
        "5": "Föstudagur",
        "6": "Laugardagur",
        "0": "Sunnudagur",
    };

    const monday = new Date(weekStart);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekLabel = `${monday.toLocaleDateString("is-IS", { day: "numeric", month: "long" })} – ${sunday.toLocaleDateString("is-IS", { day: "numeric", month: "long", year: "numeric" })}`;

    // Búa til dagalista í réttri röð
    const sortedDays: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        sortedDays.push(formatDateKey(d));
    }

    let dayRows = "";
    for (const dateKey of sortedDays) {
        const dayDate = new Date(dateKey);
        const dayNum = dayDate.getDay().toString();
        const shifts = days[dateKey] || [];

        const shiftsHtml = shifts.length > 0
            ? shifts.map((s) =>
                `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:#f8f8f8;border-radius:8px;margin-bottom:4px;">
                    <span style="font-weight:600;color:#333;">${s.name}</span>
                    <span style="color:#666;font-family:monospace;">${s.time}</span>
                </div>`
            ).join("")
            : `<p style="color:#999;text-align:center;padding:12px 0;">Enginn á vakt</p>`;

        dayRows += `
            <div style="margin-bottom:16px;">
                <div style="background:#1a1a1a;color:#f59e0b;padding:10px 16px;border-radius:10px 10px 0 0;font-weight:700;font-size:14px;">
                    ${DAY_NAMES[dayNum] || "?"} – ${dayDate.toLocaleDateString("is-IS", { day: "numeric", month: "long" })}
                </div>
                <div style="border:1px solid #e5e5e5;border-top:0;border-radius:0 0 10px 10px;padding:8px;">
                    ${shiftsHtml}
                </div>
            </div>
        `;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:32px 24px;text-align:center;">
                <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);width:48px;height:48px;border-radius:12px;line-height:48px;font-weight:900;font-size:24px;color:#000;margin-bottom:12px;">D</div>
                <h1 style="color:#f59e0b;font-size:22px;margin:8px 0 4px;letter-spacing:2px;">VAKTAPLAN</h1>
                <p style="color:#999;font-size:14px;margin:0;">${weekLabel}</p>
            </div>

            <!-- Schedule -->
            <div style="padding:24px;">
                ${dayRows}
            </div>

            <!-- Footer -->
            <div style="background:#fafafa;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0;">Þetta er sjálfvirkt tölvupóst frá Dillon Staff kerfinu.</p>
                <p style="color:#bbb;font-size:11px;margin:4px 0 0;">Vinsamlegast svaraðu ekki þessu tölvupósti.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// =====================================================
// Helpers
// =====================================================
function formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
