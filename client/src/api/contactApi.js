import http from "./http";

export async function fetchContactOverview(orderId) {
  const { data } = await http.get(`/api/contact/order/${orderId}`);
  return data;
}

export async function fetchContactThread(orderId, sellerId) {
  const { data } = await http.get(`/api/contact/order/${orderId}/thread`, {
    params: { sellerId },
  });
  return data;
}

export async function sendContactMessage(orderId, payload) {
  const { data } = await http.post(
    `/api/contact/order/${orderId}/messages`,
    payload
  );
  return data;
}


