export async function fetchCategories(http) {
  const { data } = await http.get("/api/categories");
  return data;
}





















