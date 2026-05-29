const express = require("express");
const router = express.Router();

// TODO: auth routes — to be implemented
router.get("/", (_req, res) => {
  res.json({ message: "auth routes — coming soon" });
});

module.exports = router;
