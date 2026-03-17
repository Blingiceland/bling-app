import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    getDoc,
    doc,
    Timestamp,
    increment,
} from "firebase/firestore";
import { db } from "./firebase";

/* ================================================================
   TYPES
   ================================================================ */

export interface DillonEvent {
    id?: string;
    title: string;
    description: string;
    date: string;           // "YYYY-MM-DD"
    time: string;           // "HH:MM"
    venue: string;          // e.g. "Dillon"
    pricePerTicket: number; // ISK
    totalTickets: number;
    ticketsSold: number;
    imageUrl?: string;
    status: "active" | "inactive";
    createdAt?: Date;
}

export interface TicketOrder {
    id?: string;
    eventId: string;
    userId: string;
    userEmail: string;
    userName: string;
    ticketCount: number;
    totalAmount: number;
    status: "pending" | "confirmed" | "cancelled";
    teyaPaymentId?: string;
    createdAt?: Date;
}

/* ================================================================
   EVENTS CRUD
   ================================================================ */

/** Get all active events, ordered by date */
export async function getActiveEvents(): Promise<DillonEvent[]> {
    const q = query(
        collection(db, "events"),
        where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as DillonEvent))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/** Get all events (for admin) */
export async function getAllEvents(): Promise<DillonEvent[]> {
    const snapshot = await getDocs(collection(db, "events"));
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as DillonEvent))
        .sort((a, b) => b.date.localeCompare(a.date));
}

/** Get a single event by ID */
export async function getEvent(id: string): Promise<DillonEvent | null> {
    const docSnap = await getDoc(doc(db, "events", id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as DillonEvent;
}

/** Create a new event */
export async function createEvent(
    data: Omit<DillonEvent, "id" | "createdAt" | "ticketsSold">
): Promise<string> {
    const docRef = await addDoc(collection(db, "events"), {
        ...data,
        ticketsSold: 0,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

/** Update an event */
export async function updateEvent(
    id: string,
    data: Partial<DillonEvent>
): Promise<void> {
    const { id: _id, ...updateData } = data as any;
    await updateDoc(doc(db, "events", id), updateData);
}

/* ================================================================
   TICKET ORDERS
   ================================================================ */

/** Create a ticket order (pending payment) */
export async function createTicketOrder(
    data: Omit<TicketOrder, "id" | "createdAt" | "status">
): Promise<{ id: string; amount: number }> {
    // Check event availability
    const event = await getEvent(data.eventId);
    if (!event) throw new Error("Viðburður fannst ekki");
    if (event.status !== "active") throw new Error("Viðburður er ekki virkur");

    const remainingTickets = event.totalTickets - event.ticketsSold;
    if (data.ticketCount > remainingTickets) {
        throw new Error(`Aðeins ${remainingTickets} miðar eftir`);
    }

    const totalAmount = data.ticketCount * event.pricePerTicket;

    const docRef = await addDoc(collection(db, "ticketOrders"), {
        ...data,
        totalAmount,
        status: "pending",
        createdAt: Timestamp.now(),
    });

    return { id: docRef.id, amount: totalAmount };
}

/** Confirm ticket order payment */
export async function confirmTicketPayment(
    orderId: string,
    paymentId: string
): Promise<void> {
    const orderRef = doc(db, "ticketOrders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) throw new Error("Pöntun fannst ekki");

    const order = orderSnap.data() as TicketOrder;

    // Update order status
    await updateDoc(orderRef, {
        status: "confirmed",
        teyaPaymentId: paymentId,
    });

    // Update ticketsSold on the event
    await updateDoc(doc(db, "events", order.eventId), {
        ticketsSold: increment(order.ticketCount),
    });
}

/** Get a ticket order by ID */
export async function getTicketOrder(id: string): Promise<TicketOrder | null> {
    const docSnap = await getDoc(doc(db, "ticketOrders", id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as TicketOrder;
}

/** Get all orders for a specific event */
export async function getOrdersForEvent(eventId: string): Promise<TicketOrder[]> {
    const q = query(
        collection(db, "ticketOrders"),
        where("eventId", "==", eventId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as TicketOrder))
        .filter(o => o.status === "confirmed");
}

/** Format ISK currency */
export function formatISK(n: number): string {
    return n.toLocaleString("is-IS") + " kr.";
}
