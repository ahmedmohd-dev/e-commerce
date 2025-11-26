import http from "./http";

export async function fetchNotifications(params = {}) {
  const response = await http.get("/api/notifications", { params });
  return response.data;
}

export async function fetchUnreadCount() {
  const response = await http.get("/api/notifications/unread-count");
  return response.data;
}

export async function markNotificationRead(id) {
  if (!id) return null;
  const response = await http.post(`/api/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await http.post("/api/notifications/read-all");
  return response.data;
}


