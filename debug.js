// debug.ts
var debug_default = new class Nyaa {
  base = "https://nyaaapi.onrender.com/nyaa";
  async single(query) {
    throw new Error(JSON.stringify(query));
  }
  async batch(query) {
    return [];
  }
  async movie(query) {
    return [];
  }
  async search({
    titles,
    episode,
    fetch: fetch2
  }) {
    return [];
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
  debug_default as default
};
