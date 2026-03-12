import { NextResponse } from "next/server";
import { getActiveEvents } from "@/lib/event-tickets";

export async function GET() {
    try {
        const events = await getActiveEvents();
        return NextResponse.json({ events });
    } catch (error: any) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: error.message || "Villa við að sækja viðburði" },
            { status: 500 }
        );
    }
}
