const Notification = require("../models/Notification");
const User = require("../models/User");

let io = null;

function setNotificationSocket(ioInstance) {
  io = ioInstance;
}

const uniqueIds = (ids = []) => {
  const set = new Set();
  ids.forEach((id) => {
    if (id) set.add(String(id));
  });
  return Array.from(set);
};

async function getAdminIds() {
  const now = Date.now();
  if (cachedAdminIds.length && now - lastAdminFetch < ADMIN_CACHE_TTL) {
    return cachedAdminIds;
  }

  const admins = await User.find({ role: "admin" }).select("_id").lean();
  cachedAdminIds = admins.map((a) => a._id);
  lastAdminFetch = now;
  return cachedAdminIds;
}

async function createNotificationsForUsers(userIds = [], payload = {}) {
  const ids = uniqueIds(userIds);
  if (!ids.length) return [];

  const docs = ids.map((userId) => ({
    user: userId,
    type: payload.type || "system",
    title: payload.title || "Notification",
    body: payload.body || "",
    link: payload.link || "",
    meta: payload.meta || {},
    icon: payload.icon || "",
    severity: payload.severity || "info",
  }));

  const created = await Notification.insertMany(docs, { ordered: false });

  if (io) {
    created.forEach((doc) => {
      io.to(String(doc.user)).emit("notification:new", doc);
    });
  }

  return created;
}

async function notifyAdmins(payload) {
  const adminIds = await getAdminIds();
  return createNotificationsForUsers(adminIds, payload);
}

async function notifyUser(userId, payload) {
  if (!userId) return null;
  const [doc] = await createNotificationsForUsers([userId], payload);
  return doc;
}

async function notifyUsers(userIds, payload) {
  return createNotificationsForUsers(userIds, payload);
}

function extractSellerIdsFromOrder(order) {
  if (!order?.items) return [];
  const ids = order.items
    .map((item) => item?.seller || item?.product?.seller)
    .filter(Boolean);
  return uniqueIds(ids);
}

module.exports = {
  setNotificationSocket,
  notifyAdmins,
  notifyUser,
  notifyUsers,
  extractSellerIdsFromOrder,
};
