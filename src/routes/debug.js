const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");

router.get("/whoami", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
