// Test Firebase Storage upload
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const keyPath = path.join(__dirname, "service-account-key.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: serviceAccount.project_id + ".firebasestorage.app",
    });
}

const bucket = admin.storage().bucket();

async function testStorage() {
    const imagePath = process.argv[2];
    if (!imagePath || !fs.existsSync(imagePath)) {
        console.error("Usage: node test-storage.js <image-path>");
        return;
    }

    console.log("🪣 Bucket:", bucket.name);
    console.log("📤 Uploading...");

    try {
        const fileName = `events/test_${Date.now()}_${path.basename(imagePath)}`;
        await bucket.upload(imagePath, {
            destination: fileName,
            metadata: { contentType: "image/jpeg" },
        });

        // Make public
        await bucket.file(fileName).makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log("✅ Upload successful!");
        console.log("🔗 URL:", publicUrl);

        // Update the comedy event with this real URL
        const db = admin.firestore();
        const eventsSnap = await db.collection("events")
            .where("title", "==", "Sunday Comedy Kvöld")
            .get();

        if (!eventsSnap.empty) {
            await eventsSnap.docs[0].ref.update({ imageUrl: publicUrl });
            console.log("✅ Event updated with Storage URL!");
        }
    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
}

testStorage().then(() => process.exit(0));
