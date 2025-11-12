import http from "./http";

export const getProductReviews = async (productId) => {
  const { data } = await http.get(`/api/reviews/product/${productId}`);
  return data;
};

export const createReview = async (productId, reviewData) => {
  const { data } = await http.post(
    `/api/reviews/product/${productId}`,
    reviewData
  );
  return data;
};

export const updateReview = async (reviewId, reviewData) => {
  const { data } = await http.put(`/api/reviews/${reviewId}`, reviewData);
  return data;
};

export const deleteReview = async (reviewId) => {
  const { data } = await http.delete(`/api/reviews/${reviewId}`);
  return data;
};
















