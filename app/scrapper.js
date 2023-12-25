import * as cheerio from "cheerio";
import axios from "axios";
import NodeCache from "node-cache";
import { baseURL } from "./config.js";

const myCache = new NodeCache();

async function getManga(slug) {
  if (myCache.has(`manga-${slug}`)) {
    return {
      message: "success",
      data: myCache.get(`manga-${slug}`),
    };
  } else {
    try {
      const res = await axios.get(`${baseURL}/${slug}`);
      const $ = cheerio.load(res.data);
      const title = $(".section-header-title.me-auto > h2.max-caracter-2:first")
        .text()
        .trim();
      const description = $(".col-md-12.mb-3 > .empty-box:last").text().trim();
      const cover = $(".novels-detail-left img").attr("src");
      const alternativeNames = $(
        '.novels-detail-right-in-left:contains("Alternative Names:")'
      )
        .next(".novels-detail-right-in-right")
        .find("span")
        .text()
        .trim();
      const status = $('.novels-detail-right-in-left:contains("Status:")')
        .next(".novels-detail-right-in-right")
        .text()
        .trim();
      const genres = $('.novels-detail-right-in-left:contains("Genres:")')
        .next(".novels-detail-right-in-right")
        .find("a")
        .map((index, element) => $(element).text())
        .get();
      const type = $('.novels-detail-right-in-left:contains("Type:")')
        .next(".novels-detail-right-in-right")
        .find("span")
        .text()
        .trim();
      const rating = $('.novels-detail-right-in-left:contains("Rating:")')
        .next(".novels-detail-right-in-right")
        .find("strong")
        .text()
        .trim();
      const author = $('.novels-detail-right-in-left:contains("Author(s):")')
        .next(".novels-detail-right-in-right")
        .find("a")
        .map((index, element) => $(element).text().trim())
        .get();
      const artist = $('.novels-detail-right-in-left:contains("Artist(s):")')
        .next(".novels-detail-right-in-right")
        .find("a")
        .map((index, element) => $(element).text().trim())
        .get();
      // Extract chapter numbers and slugs
      const chapters = [];
      $(".novels-detail-chapters li a").each((index, element) => {
        const chapterUrl = $(element).attr("href");
        const matches = chapterUrl.match(/chapter-(\d+(?:\.\d+)*)\/all-pages/);
        if (matches) {
          const chapterNumber = matches[1];
          const slug = chapterUrl
            .split("/")
            .slice(-3, -1)
            .join("/")
            .replace("chapter-", "");
          chapters.push({ chapterNumber, slug });
        }
      });
      const data = {
        title,
        description,
        cover,
        alternativeNames,
        status,
        genres,
        type,
        rating,
        author,
        artist,
        chapters,
      };
      myCache.set(`manga-${slug}`, data, 60);
      return {
        message: "success",
        data,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: {},
      };
    }
  }
}

async function getChapter(slug, chapter) {
  if (myCache.has(`${slug}-${chapter}`)) {
    return {
      message: "success",
      data: myCache.get(`${slug}-${chapter}`),
    };
  } else {
    try {
      const res = await axios.get(
        `${baseURL}/${slug}/chapter-${chapter}/all-pages`
      );
      const $ = cheerio.load(res.data);
      const seriesTitle = $(".section-header-title.me-auto > .max-caracter-2")
        .text()
        .trim();
      const chapterNumber = $(".section-header-title.me-auto > span")
        .text()
        .replace(/[^0-9.]/g, "")
        .trim();
      const imageChapters = [];
      $(".chapter-detail-novel-big-image.text-center img").each(
        (index, element) => {
          const imgSrc = $(element).attr("src");
          imageChapters.push(imgSrc);
        }
      );
      // Extract previous chapter URL and number
      const prevChapterBtn = $(
        ".chapter-player-options-right .cm-dropdown"
      ).prev();
      const prevChapterUrl =
        prevChapterBtn.length && prevChapterBtn.attr("href") !== "javascript:;"
          ? prevChapterBtn.attr("href")
          : null;
      const prevChapterNumberMatch = prevChapterUrl
        ? prevChapterUrl.match(/\/chapter-(\d+(?:\.\d+)*)\//)
        : null;
      const prevChapterNumber = prevChapterNumberMatch
        ? prevChapterNumberMatch[1]
        : null;
      const prevChapterSlug = prevChapterNumber
        ? slug + "/" + prevChapterNumber
        : null;

      // Extract next chapter URL and number
      const nextChapterBtn = $(
        ".chapter-player-options-right .cm-dropdown"
      ).next();
      const nextChapterUrl =
        nextChapterBtn.length && nextChapterBtn.attr("href") !== "javascript:;"
          ? nextChapterBtn.attr("href")
          : null;
      const nextChapterNumberMatch = nextChapterUrl
        ? nextChapterUrl.match(/\/chapter-(\d+(?:\.\d+)*)\//)
        : null;
      const nextChapterNumber = nextChapterNumberMatch
        ? nextChapterNumberMatch[1]
        : null;
      const nextChapterSlug = nextChapterNumber
        ? slug + "/" + nextChapterNumber
        : null;

      const data = {
        seriesTitle,
        chapterNumber,
        imageChapters,
        prevChapterSlug,
        nextChapterSlug,
      };
      myCache.set(`${slug}-${chapter}`, data, 60 * 60 * 24);
      return {
        message: "success",
        data,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: {},
      };
    }
  }
}

async function getAllGenres() {
  if (myCache.has("all-genres")) {
    return {
      message: "success",
      genres: myCache.get("all-genres"),
    };
  } else {
    try {
      const res = await axios.get(`${baseURL}`);
      const $ = cheerio.load(res.data);
      // Find the genres list
      const genresList = $('.nav-bar-menu li > a[href^="/genre/"]');
      // Extract genres and slugs
      const genres = [];
      genresList.each((index, element) => {
        const genreName = $(element).text().trim();
        const genreSlug = $(element)
          .attr("href")
          .replace(/^\/genre\//, ""); // Remove '/genre/' from the beginning
        genres.push({ genreName, genreSlug });
      });
      // Filter genres based on a specific genreSlug
      const targetGenreSlug = "index";
      const filteredGenres = genres.filter(
        (genre) => genre.genreSlug !== targetGenreSlug
      );
      if (genres.length === 0) {
        throw new Error("Failed to retrieve necessary information");
      }
      myCache.set("all-genres", filteredGenres, 60 * 60 * 24);
      return {
        message: "success",
        genres: filteredGenres,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        genres: [],
      };
    }
  }
}

async function getMangaUpdates(page) {
  if (myCache.has(`manga-updates-${page}`)) {
    return {
      message: "success",
      page,
      data: myCache.get(`manga-updates-${page}`),
    };
  } else {
    let url = `${baseURL}/latest-updates/${page}`;
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);
      // Initialize an object to store manga information with slugs as keys
      const mangaDict = {};
      // Iterate over each <li> element in the <ul>
      $(".latest-updates ul li").each((index, element) => {
        // Extract information for each manga
        const title = $(element).find(".latest-updates-name a").text().trim();
        const cover = $(element).find(".latest-updates-img img").attr("src");
        const latestChapter = $(element)
          .find(".latest-updates-content a:first-child")
          .text()
          .replace("Ch. ", "")
          .trim();
        const slug = $(element)
          .find(".latest-updates-name a")
          .attr("href")
          .replace("/", "");
        const dateUpdated = $(element)
          .find(".latest-updates-content a:last-child")
          .text()
          .trim();
        // Check if the slug is already in the dictionary
        if (!mangaDict[slug]) {
          // If not, add the manga information to the dictionary
          mangaDict[slug] = { title, cover, slug, latestChapter, dateUpdated };
        }
      });
      // Convert the manga dictionary values to an array
      const mangaList = Object.values(mangaDict);
      if (mangaList.length === 0) {
        throw new Error("Failed to retrieve necessary information");
      }
      myCache.set(`manga-updates-${page}`, mangaList, 60);
      return {
        message: "success",
        page,
        data: mangaList,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: [],
      };
    }
  }
}

async function getSearchManga(search) {
  if (myCache.has(`manga-search-${search}`)) {
    return {
      message: "success",
      data: myCache.get(`manga-search-${search}`),
    };
  } else {
    if (search.length < 3) {
      throw new Error("Search query must be at least 3 characters long");
    }
    let url = `${baseURL}/search/autocomplete?dataType=json&query=${search}`;
    try {
      const res = await axios.get(url);
      const items = [];
      const data = res.data.results || [];
      for (let i = 0; i < data.length; i++) {
        const title = data[i].original_title;
        const slug = data[i].link.replace(`${baseURL}/`, "");
        const cover = data[i].image;
        items.push({ title, slug, cover });
      }
      if (items.length === 0) {
        throw new Error("Search query not found");
      }
      myCache.set(`manga-search-${search}`, items, 60 * 60 * 24);
      return {
        message: "success",
        data: items,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: [],
      };
    }
  }
}

async function getMangaHome() {
  if (myCache.has("manga-home")) {
    return {
      message: "success",
      data: myCache.get("manga-home"),
    };
  } else {
    try {
      const res = await axios.get(`${baseURL}`);
      const $ = cheerio.load(res.data);
      function extractMangaInfo(sectionSelector) {
        const mangaList = [];
        // Select the section
        const section = $(sectionSelector);
        // Iterate over each <div> with class "card-v" inside the section
        section.find(".card-v").each((index, element) => {
          const mangaInfo = {};
          // Extract information for each manga
          mangaInfo.title = $(element).find(".card-v-name a").text().trim();
          mangaInfo.chapter = $(element)
            .find(".card-v-chapters a")
            .text()
            .replace("Chapter ", "")
            .trim();
          mangaInfo.cover = $(element).find(".card-v-image img").attr("src");
          mangaInfo.status = $(element)
            .find(".card-v-status a")
            .text()
            .replace("0", "N/A")
            .trim();
          mangaInfo.slug = $(element)
            .find(".card-v-name a")
            .attr("href")
            .replace(`${baseURL}/`, "");
          mangaInfo.score = $(element)
            .find(".card-v-image-score")
            .text()
            .trim();
          mangaList.push(mangaInfo);
        });
        return mangaList;
      }
      // Extract manga information from "NEW MANGA" section
      const newMangaList = extractMangaInfo(
        'section:has(h2:contains("NEW MANGA"))'
      );
      // Extract manga information from "POPULAR UPDATES" section
      const popularMangaList = extractMangaInfo(
        'section:has(h2:contains("POPULAR UPDATES"))'
      );
      const data = {
        newMangaList,
        popularMangaList,
      };
      myCache.set("manga-home", data, 60);
      return {
        message: "success",
        data,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: null,
      };
    }
  }
}

async function getMangaList(page, sortBy, type, genreSlug) {
  if (myCache.has(`manga-list-${page}-${sortBy}`)) {
    return {
      message: "success",
      page,
      data:
        type === "ranking"
          ? myCache.get(`manga-list-${type}-${page}-${sortBy}`)
          : myCache.get(`manga-list-${genreSlug}-${page}-${sortBy}`),
    };
  } else {
    let url;
    if (type === "ranking") {
      url = `${baseURL}/ranking/${sortBy}/${page}`;
    } else {
      url = `${baseURL}/genre/${genreSlug}/${page}?change_type=${sortBy}`;
    }
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);
      const mangaList = [];

      $(".category-items.cm-list > ul > li").each(function () {
        const title = $(this).find(".category-name a").text().trim();
        const slug = $(this)
          .find(".category-name a")
          .attr("href")
          .replace("/", "");
        const cover = $(this).find(".category-img img").attr("src");
        const status = $(this)
          .find(".card-v-status a")
          .text()
          .replace("0", "N/A")
          .trim();
        const rating = $(this)
          .find(".category-bottom-buttons .js-star-rating-read-only")
          .data("score");
        const type = $(this)
          .find(".category-feature-content ul li:nth-child(3) span")
          .text()
          .trim();

        const mangaInfo = {
          title,
          slug,
          cover,
          status,
          rating,
          type,
        };

        mangaList.push(mangaInfo);
      });
      if (mangaList.length === 0) {
        throw new Error("Failed to retrieve necessary information");
      }
      myCache.set(
        type === "ranking"
          ? `manga-list-${type}-${page}-${sortBy}`
          : `manga-list-${genreSlug}-${page}-${sortBy}`,
        mangaList,
        60 * 60 * 24
      );
      return {
        message: "success",
        page,
        data: mangaList,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: [],
      };
    }
  }
}

async function getMangaDirectory(alphabet) {
  if (myCache.has(`manga-directory-${alphabet}`)) {
    return {
      message: "success",
      data: myCache.get(`manga-directory-${alphabet}`),
    };
  } else {
    try {
      if (alphabet.length !== 1) {
        throw new Error("Alphabet must be a single character");
      }
      const res = await axios.get(`${baseURL}/directory/${alphabet}`);
      const $ = cheerio.load(res.data);
      const mangaList = [];
      $(".list-items ul li").each(function () {
        const title = $(this).find(".list-items-details-name a").text().trim();
        const slug = $(this)
          .find(".list-items-details-name a")
          .attr("href")
          .replace(`${baseURL}/`, "");
        const cover = $(this).find(".list-items-details-img img").attr("src");
        const rating = $(this)
          .find(
            '.list-items-details-points-item strong:contains("Rating") + span'
          )
          .text()
          .trim();
        const mangaInfo = {
          title,
          slug,
          cover,
          rating,
        };
        mangaList.push(mangaInfo);
      });
      myCache.set(`manga-directory-${alphabet}`, mangaList, 60 * 60 * 24);
      return {
        message: "success",
        data: mangaList,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error.message,
        data: [],
      };
    }
  }
}

export {
  getManga,
  getChapter,
  getAllGenres,
  getMangaUpdates,
  getSearchManga,
  getMangaHome,
  getMangaList,
  getMangaDirectory,
};
