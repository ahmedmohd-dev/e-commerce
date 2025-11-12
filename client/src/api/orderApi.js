import http from "./http";

export async function createOrder(orderData) {
  const { data } = await http.post("/api/orders", orderData);
  return data;
}

export async function getOrder(orderId) {
  const { data } = await http.get(`/api/orders/${orderId}`);
  return data;
}

export async function getUserOrders() {
  const { data } = await http.get("/api/orders/my");
  return data;
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await http.patch(`/api/orders/${orderId}/status`, {
    status,
  });
  return data;
}

export async function createDispute(orderId, payload) {
  const { data } = await http.post(`/api/orders/${orderId}/disputes`, payload);
  return data;
}

export async function fetchDispute(orderId) {
  const { data } = await http.get(`/api/orders/${orderId}/disputes`);
  return data;
}

export async function fetchMyDisputes() {
  const { data } = await http.get(`/api/orders/disputes/my`);
  return data;
}

export async function sendDisputeMessage(orderId, payload) {
  const { data } = await http.post(
    `/api/orders/${orderId}/disputes/messages`,
    payload
  );
  return data;
}
