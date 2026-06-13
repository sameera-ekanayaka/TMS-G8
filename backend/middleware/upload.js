// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("crypto").webcrypto ? 
  require("crypto") : require("crypto");

// Use crypto.randomUUID() — built into Node 16+, no extra package needed
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder must exist — created below
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = require("crypto").randomUUID();
    cb(null, `${unique}${ext}`); // e.g. "a1b2c3-....pdf"
  },
});

const fileFilter = (req, file, cb) => {
  // Allow common file types only
  const allowed = [
    "image/jpeg", "image/png", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports = upload;