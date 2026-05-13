interface AnimeQuery {
  media: any; // anilist Media object
  anilistId: number; // anilist anime id
  anidbAid?: number; // anidb anime id
  anidbEid?: number; // anidb episode id
  tvdbId?: number; // thetvdb anime id
  tvdbEId?: number; // thetvdb episode id
  imdbId?: string; // imdb id
  tmdbId?: string; // tmdb anime id
  titles: string[]; // list of titles and alternative titles
  episode: number;
  episodeCount?: number; // total episode count for the series
  absoluteEpisodeNumber?: number; // absolute episode number, for anime with non-standard episode numbering
  resolution: "2160" | "1080" | "720" | "540" | "480" | "";
  exclusions: string[]; // list of keywords to exclude from searches, this might be unsupported codecs (e.g., "x265"), sources (e.g., "web-dl"), or other keywords (e.g., "uncensored")
  fetch: typeof globalThis.fetch; // fetch function to perform network requests, this function should be used instead of the global fetch to ensure CORS requests work properly
}

interface TorrentResult {
  title: string; // torrent title
  link: string; // link to .torrent file, or magnet link or infoHash
  id?: number;
  seeders: number;
  leechers: number;
  downloads: number;
  accuracy: "high" | "medium" | "low";
  hash: string; // info hash
  size: number; // size in bytes
  date: Date; // date the torrent was uploaded
  type?: "batch" | "best" | "alt";
}

export default new (class Nyaa {
  base = "https://nyaaapi.onrender.com/nyaa";

  async single(query: AnimeQuery) {
    return await this.search(query);
  }

  async batch(query: AnimeQuery) {
    return [];
  }

  async movie(query: AnimeQuery) {
    return await this.search(query);
  }

  private async search({
    titles,
    episode,
    fetch,
  }: AnimeQuery): Promise<TorrentResult[]> {
    const queries = titles.map((title) =>
      fetch(
        this.base +
          "?q=" +
          encodeURIComponent(title + " " + episode) +
          "&category=anime" +
          "&sub_category=eng",
      ),
    );

    const results = await Promise.allSettled(queries);

    const torrents = await Promise.all(
      results.map(async (result) => {
        if (result.status !== "fulfilled") {
          return [];
        }

        const res = result.value;
        if (!res.ok) {
          return [];
        }

        const data = await res.json();
        // @ts-ignore
        if (!data || !Array.isArray(data.data)) {
          return [];
        }

        // @ts-ignore
        return data.data;
      }),
    );

    try {
      const torrentResults = torrents.flat().map((item: any) => {
        let hash = "";
        try {
          const url = new URL(item.magnet);
          if (url.protocol !== "magnet:") throw new Error();
          const xtValues = url.searchParams.getAll("xt");

          for (const xt of xtValues) {
            const match = xt.match(/^urn:btih:([a-zA-Z0-9]+)$/i);
            if (match && match[1]) {
              hash = match[1];
            }
          }
        } catch (error) {}
        return {
          title: item.title || "Unknown",
          link: item.magnet || item.torrent || item.link || "",
          hash: hash,
          seeders: Number(item.seeders) || 0,
          leechers: Number(item.leechers) || 0,
          downloads: Number(item.downloads) || 0,
          size: Number(item.size) || 0,
          date: item.time ? new Date(item.time) : new Date(0),
          accuracy: item.accuracy || "low",
        };
      });
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
})();
