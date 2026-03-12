// Convert image to base64 data URL and store in Firestore
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const keyPath = path.join(__dirname, "service-account-key.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });
}

const db = admin.firestore();

async function updateWithBase64() {
    const imagePath = process.argv[2];
    if (!imagePath || !fs.existsSync(imagePath)) {
        console.error("❌ Please provide a valid image path");
        return;
    }

    // Read and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString("base64");
    const ext = path.extname(imagePath).toLowerCase().replace(".", "");
    const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`📷 Image size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);
    console.log(`📷 Data URL length: ${(dataUrl.length / 1024).toFixed(0)} KB`);

    // Note: Firestore documents max size is ~1MB. If the image is too big we resize first.
    if (dataUrl.length > 900000) {
        console.error("❌ Image is too large for Firestore (>900KB). Please use a smaller image or enable Firebase Storage.");
        return;
    }

    // Find the comedy event
    const eventsSnap = await db.collection("events")
        .where("title", "==", "Sunday Comedy Kvöld")
        .get();

    if (eventsSnap.empty) {
        console.error("❌ Event not found!");
        return;
    }

    const eventDoc = eventsSnap.docs[0];
    await eventDoc.ref.update({ imageUrl: dataUrl });
    console.log("✅ Event updated with base64 image!");
}

updateWithBase64().then(() => process.exit(0)).catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
