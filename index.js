const express = require("express");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://yatri-com-default-rtdb.firebaseio.com"
});

const app = express();
app.use(express.json());

const db = admin.database();

/* ======================
   VERIFY OTP (START RIDE)
====================== */
app.post("/verifyOtp", async (req, res) => {
  const { rideId, otp } = req.body;

  const snap = await db.ref("rides/" + rideId).once("value");
  if (!snap.exists()) return res.json({ error: "Ride not found" });

  const ride = snap.val();

  if (ride.otp !== otp) return res.json({ error: "Wrong OTP" });

  await db.ref("rides/" + rideId + "/status").set("started");

  res.json({ success: true });
});

/* ======================
   DRIVER ACCEPT RIDE
====================== */
app.post("/acceptRide", async (req, res) => {
  const { rideId, driverId } = req.body;

  const snap = await db.ref("rides/" + rideId).once("value");
  if (!snap.exists()) return res.json({ error: "Ride missing" });

  if (snap.val().status !== "requested")
    return res.json({ error: "Already taken" });

  await db.ref("rides/" + rideId).update({
    driverId,
    status: "accepted"
  });

  res.json({ success: true });
});

/* ======================
   COMPLETE RIDE + WALLET
====================== */
app.post("/completeRide", async (req, res) => {
  const { rideId } = req.body;

  const snap = await db.ref("rides/" + rideId).once("value");
  if (!snap.exists()) return res.json({ error: "Ride missing" });

  const ride = snap.val();

  const fare = 150; // MVP fixed fare

  await db.ref("drivers/" + ride.driverId + "/wallet")
    .transaction(w => (w || 0) + fare);

  await db.ref("rides/" + rideId + "/status").set("completed");

  res.json({ success: true, fare });
});

/* ======================
   SERVER START
====================== */
app.listen(process.env.PORT || 3000, () => {
  console.log("Backend running...");
});
