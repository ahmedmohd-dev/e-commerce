require("dotenv").config();
const { connectDB } = require("../config/db");
const User = require("../models/User");

async function makeAdmin() {
  await connectDB();
  const uid = process.env.ADMIN_FIREBASE_UID || process.argv[2];
  if (!uid) {
    console.error(
      "Provide ADMIN_FIREBASE_UID in .env or as arg: node src/utils/make-admin.js <firebaseUid>"
    );
    process.exit(1);
  }
  const user = await User.findOneAndUpdate(
    { firebaseUid: uid },
    { $set: { role: "admin" } },
    { new: true }
  );
  if (!user) {
    console.log(
      "User not found yet. Login once via client to create user record, then re-run."
    );
  } else {
    console.log(`User ${user.email} is now admin.`);
  }
  process.exit(0);
}

makeAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
