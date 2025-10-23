const admin = require("firebase-admin");

function initFirebaseAdmin() {
  if (admin.apps.length) return admin;
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountB64) {
    const json = Buffer.from(serviceAccountB64, "base64").toString("utf8");
    const creds = JSON.parse(json);
    admin.initializeApp({ credential: admin.credential.cert(creds) });
    return admin;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n"
  );
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return admin;
  }
  console.warn("Firebase Admin not initialized - missing credentials");
  return null;
}

module.exports = { initFirebaseAdmin };











