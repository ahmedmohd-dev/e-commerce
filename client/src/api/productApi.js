import http from "./http";

export const searchAutocomplete = async (query) => {
  if (!query || query.length < 2) return [];
  const { data } = await http.get("/api/products/search/autocomplete", {
    params: { q: query },
  });
  return data;
};
















