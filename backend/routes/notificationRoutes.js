const express = require("express");
const router = express.Router();

// TODO: notification routes — to be implemented
router.get("/", (_req, res) => {
  res.json({ message: "notification routes — coming soon" });
});

module.exports = router;
