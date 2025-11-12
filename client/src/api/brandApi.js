export async function fetchBrands(http) {
  const { data } = await http.get("/api/brands");
  return data;
}





















