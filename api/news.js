export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  const q = typeof req.query.q === "string" ? req.query.q.slice(0, 180) : "election OR elections OR voting OR ballot";
  const country = typeof req.query.country === "string" ? req.query.country.slice(0, 60) : "";
  const query = country ? "(" + q + ") " + country : q;
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "DateDesc");
  url.searchParams.set("maxrecords", "30");
  url.searchParams.set("timespan", "7d");
  try {
    const response = await fetch(url.toString(), { headers: { "User-Agent": "WorldElection/1.0" } });
    if (!response.ok) throw new Error("News provider returned " + response.status);
    const data = await response.json();
    const articles = (Array.isArray(data.articles) ? data.articles : []).map(a => ({
      title: a.title || "タイトルなし", url: a.url || "", domain: a.domain || "",
      date: a.seendate || "", country: a.sourcecountry || ""
    })).filter(a => a.url && (a.url.startsWith("https://") || a.url.startsWith("http://")));
    res.status(200).json({ provider: "GDELT Project", fetchedAt: new Date().toISOString(), articles });
  } catch (error) {
    res.status(502).json({ error: "公開ニュースデータの取得に失敗しました。", detail: String(error.message || error) });
  }
}