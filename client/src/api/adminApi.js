import http from "./http";

export const fetchAdminOverview = async () => {
  const { data } = await http.get("/api/admin/dashboard/overview");
  return data;
};

export const fetchAdminRecentOrders = async (limit = 5) => {
  const { data } = await http.get("/api/admin/dashboard/recent-orders", {
    params: { limit },
  });
  return data;
};

export const fetchAdminTopProducts = async (limit = 5) => {
  const { data } = await http.get("/api/admin/dashboard/top-products", {
    params: { limit },
  });
  return data;
};

// Users
export const fetchAdminUsers = async () => {
  const { data } = await http.get("/api/admin/users");
  return data;
};

export const updateUserRole = async (userId, role) => {
  const { data } = await http.patch(`/api/admin/users/${userId}/role`, {
    role,
  });
  return data;
};

// Orders
export const fetchAdminOrders = async () => {
  const { data } = await http.get("/api/admin/orders");
  return data;
};

export const updateOrderStatus = async (orderId, status) => {
  const { data } = await http.patch(`/api/admin/orders/${orderId}/status`, {
    status,
  });
  return data;
};

// Telebirr verification
export const verifyTelebirr = async (orderId) => {
  const { data } = await http.patch(
    `/api/admin/orders/${orderId}/verify-telebirr`,
    {}
  );
  return data;
};

// Sellers
export const fetchSellers = async (status) => {
  const params = {};
  if (status) params.status = status;
  const { data } = await http.get("/api/admin/sellers", { params });
  return data;
};

export const updateSellerStatus = async (userId, status) => {
  const { data } = await http.patch(`/api/admin/sellers/${userId}/status`, {
    status,
  });
  return data;
};

export const fetchSellerStats = async (sellerId) => {
  const { data } = await http.get(`/api/admin/sellers/${sellerId}/stats`);
  return data;
};

// Disputes
export const fetchDisputes = async (status) => {
  const params = {};
  if (status) params.status = status;
  const { data } = await http.get("/api/admin/disputes", { params });
  return data;
};

export const updateDisputeStatus = async (disputeId, payload) => {
  const { data } = await http.patch(
    `/api/admin/disputes/${disputeId}`,
    payload
  );
  return data;
};
