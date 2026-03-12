import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getAllEvents } from "@/lib/event-tickets";

export async function GET() {
    try {
        const events = await getAllEvents();
        return NextResponse.json({ events });
    } catch (error: any) {
        console.error("Error fetching admin events:", error);
        return NextResponse.json(
            { error: error.message || "Villa" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, eventData, eventId } = body;

        if (action === "create") {
            const { title, description, date, time, venue, pricePerTicket, totalTickets, imageUrl } = eventData;

            if (!title || !date || !pricePerTicket || !totalTickets) {
                return NextResponse.json(
                    { error: "Vantar nauðsynleg svið" },
                    { status: 400 }
                );
            }

            const docRef = await adminDb.collection("events").add({
                title,
                description: description || "",
                date,
                time: time || "20:00",
                venue: venue || "Dillon",
                pricePerTicket: Number(pricePerTicket),
                totalTickets: Number(totalTickets),
                ticketsSold: 0,
                imageUrl: imageUrl || "",
                status: "active",
                createdAt: FieldValue.serverTimestamp(),
            });

            return NextResponse.json({ success: true, id: docRef.id });
        }

        if (action === "update") {
            if (!eventId) {
                return NextResponse.json({ error: "Vantar eventId" }, { status: 400 });
            }

            const updateData: any = {};
            if (eventData.title !== undefined) updateData.title = eventData.title;
            if (eventData.description !== undefined) updateData.description = eventData.description;
            if (eventData.date !== undefined) updateData.date = eventData.date;
            if (eventData.time !== undefined) updateData.time = eventData.time;
            if (eventData.venue !== undefined) updateData.venue = eventData.venue;
            if (eventData.pricePerTicket !== undefined) updateData.pricePerTicket = Number(eventData.pricePerTicket);
            if (eventData.totalTickets !== undefined) updateData.totalTickets = Number(eventData.totalTickets);
            if (eventData.imageUrl !== undefined) updateData.imageUrl = eventData.imageUrl;
            if (eventData.status !== undefined) updateData.status = eventData.status;

            await adminDb.collection("events").doc(eventId).update(updateData);
            return NextResponse.json({ success: true });
        }

        if (action === "delete") {
            if (!eventId) {
                return NextResponse.json({ error: "Vantar eventId" }, { status: 400 });
            }
            await adminDb.collection("events").doc(eventId).update({ status: "inactive" });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Ógild aðgerð" }, { status: 400 });
    } catch (error: any) {
        console.error("Admin events error:", error);
        return NextResponse.json(
            { error: error.message || "Villa" },
            { status: 500 }
        );
    }
}
