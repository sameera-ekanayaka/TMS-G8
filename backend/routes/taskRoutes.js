const express = require("express");
const router = express.Router();

// TODO: task routes — to be implemented
router.get("/", (_req, res) => {
  res.json({ message: "task routes — coming soon" });
});

module.exports = router;
