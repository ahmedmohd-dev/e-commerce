import http from "./http";

export async function applyForSeller(payload) {
  const { data } = await http.post("/api/seller/apply", payload);
  return data;
}

export async function fetchMyProducts(params = {}) {
  const { page = 1, limit = 20, search = "" } = params;
  const { data } = await http.get(
    `/api/seller/products?page=${page}&limit=${limit}&search=${encodeURIComponent(
      search
    )}`
  );
  return data;
}

export async function createMyProduct(product) {
  const { data } = await http.post("/api/seller/products", product);
  return data;
}

export async function updateMyProduct(id, updates) {
  const { data } = await http.put(`/api/seller/products/${id}`, updates);
  return data;
}

export async function deleteMyProduct(id) {
  const { data } = await http.delete(`/api/seller/products/${id}`);
  return data;
}

export async function fetchMyOrders(params = {}) {
  const { page = 1, limit = 10 } = params;
  const { data } = await http.get(
    `/api/seller/orders?page=${page}&limit=${limit}`
  );
  return data;
}

export async function updateOrderStatus(orderId, payload) {
  const { data } = await http.put(
    `/api/seller/orders/${orderId}/status`,
    payload
  );
  return data;
}

export async function updateItemShippingStatus(
  orderId,
  itemProductId,
  shippingStatus
) {
  const { data } = await http.put(
    `/api/seller/orders/${orderId}/items/${itemProductId}/shipping`,
    { shippingStatus }
  );
  return data;
}

export async function fetchSellerOverview() {
  const { data } = await http.get("/api/seller/dashboard/overview");
  return data;
}

export async function fetchSellerRecentOrders(limit = 5) {
  const { data } = await http.get(
    `/api/seller/dashboard/recent-orders?limit=${limit}`
  );
  return data;
}

export async function fetchSellerTopProducts(limit = 5) {
  const { data } = await http.get(
    `/api/seller/dashboard/top-products?limit=${limit}`
  );
  return data;
}
