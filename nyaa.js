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
    const englishTitles = titles.filter((t) => /[A-Za-z0-9\s\-:,'"&.!?()]+/.test(t));
    const queries = englishTitles.map((title) => fetch2(this.base + "?q=" + encodeURIComponent(title + " " + episode) + "&category=anime" + "&sub_category=eng").then((res) => res.json()));
    const results = await Promise.allSettled(queries);
    const torrents = results.map((result) => {
      if (result.status !== "fulfilled") {
        return [];
      }
      const data = result.value;
      if (!data || !Array.isArray(data.data)) {
        return [];
      }
      return data.data;
    });
    try {
      const torrentResults = torrents.flat().reduce((acc, item) => {
        let hash = "";
        try {
          const url = new URL(item.magnet);
          if (url.protocol !== "magnet:")
            throw new Error;
          const xtValues = url.searchParams.getAll("xt");
          for (const xt of xtValues) {
            const match = xt.match(/^urn:btih:([a-zA-Z0-9]+)$/i);
            if (match && match[1]) {
              hash = match[1];
            }
          }
          acc.push({
            title: item.title || "Unknown",
            link: item.magnet || item.torrent || item.link || "",
            hash,
            seeders: Number(item.seeders) || 0,
            leechers: Number(item.leechers) || 0,
            downloads: Number(item.downloads) || 0,
            size: Number(item.size) || 0,
            date: item.time ? new Date(item.time) : new Date(0),
            accuracy: "medium"
          });
        } catch (error) {}
        return acc;
      }, []).sort((a, b) => b.seeders - a.seeders);
      return torrentResults;
    } catch (err) {
      throw new Error("Couldn't format torrent results: " + JSON.stringify(torrents));
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
