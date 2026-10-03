// "#/search?q=abc" -> { path: "search", query: URLSearchParams }
export function currentRoute() {
   const raw = location.hash.replace(/^#\/?/, "");
   const [path, query = ""] = raw.split("?");
   return { path: path || "home", query: new URLSearchParams(query) };
}
