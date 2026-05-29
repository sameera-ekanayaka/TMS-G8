const express = require("express");
const router = express.Router();

// TODO: user routes — to be implemented
router.get("/", (_req, res) => {
  res.json({ message: "user routes — coming soon" });
});

module.exports = router;
