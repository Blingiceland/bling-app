// Quick script to seed a test event into Firestore
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Load service account
const keyPath = path.join(__dirname, "service-account-key.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });
}

const db = admin.firestore();

async function seed() {
    const eventRef = await db.collection("events").add({
        title: "Sunday Comedy Kvöld",
        description: "Komdu á sunnudagsstandup á Dillon! Ógleymanlegt kvöld með Sigurði Anton, Lovísu Láru og Nick Jameson. Hláturskvöld sem þú vilt ekki missa af!",
        date: "2026-03-15",
        time: "20:00",
        venue: "Dillon",
        pricePerTicket: 2000,
        totalTickets: 70,
        ticketsSold: 0,
        imageUrl: "",
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Event created with ID:", eventRef.id);
    console.log("   Title: Sunday Comedy Kvöld");
    console.log("   Date: 2026-03-15 (næsta sunnudagur)");
    console.log("   Price: 2.000 kr./miði");
    console.log("   Tickets: 70");
}

seed().then(() => process.exit(0)).catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
