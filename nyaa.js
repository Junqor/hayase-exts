// nyaa.ts
var nyaa_default = new class Nyaa {
  base = "https://nyaaapi.onrender.com/nyaa";
  async single(query) {
    return await this.search(query);
  }
  async batch(query) {
    return [];
  }
  async movie(query) {
    return await this.search(query);
  }
  async search({
    titles,
    episode,
    fetch: fetch2
  }) {
    const queries = titles.map((title) => fetch2(this.base + "?q=" + encodeURIComponent(title + " " + episode) + "&category=anime" + "&sub_category=eng"));
    const results = await Promise.allSettled(queries);
    const torrents = await Promise.all(results.map(async (result) => {
      if (result.status !== "fulfilled") {
        return [];
      }
      const res = result.value;
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      if (!data || !Array.isArray(data.data)) {
        return [];
      }
      return data.data;
    }));
    try {
      const torrentResults = torrents.flat().map((item) => ({
        title: item.title || "Unknown",
        link: item.magnet || item.torrent || item.link || "",
        hash: item.hash || "",
        seeders: Number(item.seeders) || 0,
        leechers: Number(item.leechers) || 0,
        downloads: Number(item.downloads) || 0,
        size: Number(item.size) || 0,
        date: item.time ? new Date(item.time) : new Date(0),
        accuracy: item.accuracy || "low"
      }));
      return torrentResults;
    } catch (err) {
      throw new Error("Couldn't map results: " + JSON.stringify(torrents));
    }
  }
  async test() {
    try {
      const res = await fetch(this.base);
      return res.ok;
    } catch {
      throw new Error("Nyaa API is unavailable");
    }
  }
};
export {
  nyaa_default as default
};
