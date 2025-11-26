const router = require("express").Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/notification.controller");

router.use(auth);

router.get("/", controller.listNotifications);
router.get("/unread-count", controller.getUnreadCount);
router.post("/read-all", controller.markAllAsRead);
router.post("/:id/read", controller.markAsRead);

module.exports = router;


