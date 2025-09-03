import { pool } from "../config/db.js";

export const upsertUser = async (req, res) => {
  const uid = req.user.uid;
  const { role, fullName, phoneNumber, email, region, woreda } = req.body || {};
  await pool.query(
    `INSERT INTO users (firebase_uid, role, full_name, phone, email, region, woreda)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role=VALUES(role), full_name=VALUES(full_name), phone=VALUES(phone), email=VALUES(email), region=VALUES(region), woreda=VALUES(woreda)`,
    [uid, role || "buyer", fullName || null, phoneNumber || null, email || null, region || null, woreda || null]
  );
  res.json({ ok: true });
};

export const getMe = async (req, res) => {
  const uid = req.user.uid;
  
  let rows;
  
  // Handle dev tokens differently
  if (uid.startsWith('dev-uid-')) {
    // Dev token - use the user ID directly
    const userId = uid.replace('dev-uid-', '');
    [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  } else {
    // Real Firebase token - search by firebase_uid
    [rows] = await pool.query("SELECT * FROM users WHERE firebase_uid = ?", [uid]);
  }
  
  if (rows.length === 0) return res.status(404).json({ error: "Profile not found" });
  const row = rows[0];
  res.json({
    id: row.id,
    firebaseUid: row.firebase_uid,
    role: row.role,
    fullName: row.full_name,
    phoneNumber: row.phone,
    email: row.email,
    region: row.region,
    woreda: row.woreda,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

export const updateMe = async (req, res) => {
  const uid = req.user.uid;
  const { role, fullName, phoneNumber, email, region, woreda } = req.body || {};
  
  let existing;
  
  // Handle dev tokens differently
  if (uid.startsWith('dev-uid-')) {
    // Dev token - use the user ID directly
    const userId = uid.replace('dev-uid-', '');
    [existing] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
  } else {
    // Real Firebase token - search by firebase_uid
    [existing] = await pool.query("SELECT id FROM users WHERE firebase_uid = ?", [uid]);
  }
  
  if (existing.length === 0) return res.status(404).json({ error: "Profile not found" });
  
  const toNullIfEmpty = (v) => (v === undefined || v === "" ? null : v);
  const userId = existing[0].id;
  
  await pool.query(
    `UPDATE users
     SET role = COALESCE(?, role),
         full_name = COALESCE(?, full_name),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         region = COALESCE(?, region),
         woreda = COALESCE(?, woreda)
     WHERE id = ?`,
    [
      toNullIfEmpty(role),
      toNullIfEmpty(fullName),
      toNullIfEmpty(phoneNumber),
      toNullIfEmpty(email),
      toNullIfEmpty(region),
      toNullIfEmpty(woreda),
      userId,
    ]
  );
  
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  const row = rows[0];
  res.json({
    id: row.id,
    firebaseUid: row.firebase_uid,
    role: row.role,
    fullName: row.full_name,
    phoneNumber: row.phone,
    email: row.email,
    region: row.region,
    woreda: row.woreda,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};
