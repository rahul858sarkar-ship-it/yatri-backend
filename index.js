const express = require("express");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://yatri-com.firebaseio.com"
});

const app = express();
app.use(express.json());

const db = admin.database();

app.post("/verifyOtp", async (req, res) => {
  const { rideId, otp } = req.body;

  const snap = await db.ref("rides/" + rideId).once("value");

  if (!snap.exists()) return res.json({ error: "Ride not found" });

  if (snap.val().otp !== otp)
    return res.json({ error: "Wrong OTP" });

  await db.ref("rides/" + rideId + "/status").set("started");

  res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
