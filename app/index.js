import express from "express";
import cors from "cors";
import {
  getManga,
  getChapter,
  getAllGenres,
  getMangaUpdates,
  getSearchManga,
  getMangaHome,
  getMangaList,
  getMangaDirectory,
} from "./scrapper.js";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  const response = {
    availableEndpoints: {
      mangaHome: {
        url: "/manga-home",
      },
      mangaUpdates: {
        url: "/manga-updates/:page",
        params: {
          page: "ex: 1 | 2 | 3 | etc",
        },
      },
      ranking: {
        url: "/manga-ranking/:page/:sortBy",
        params: {
          sortBy: "top-rated | new | most-viewed",
          page: "ex: 1 | 2 | 3 | etc",
        },
      },
      mangaByGenre: {
        url: "/manga-genre/:genre/:page/:sortBy",
        params: {
          sortby: "view | top_rated | new",
          genres: "ex: comedy | action | romance | drama | etc",
          page: "ex: 1 | 2 | 3 | etc",
        },
      },
      mangaDirectory: {
        url: "/manga-directory/:alphabet",
        params: {
          alphabet: "ex: a | b | c | etc",
        },
      },
      search: {
        url: "/search/:query",
        params: {
          query: "ex: one piece | naruto | etc",
        },
      },
      allGenres: "/all-genres",
      manga: {
        url: "/manga/:slug",
        params: {
          slug: "ex: one-piece | naruto | etc",
        },
      },
      chapter: {
        url: "/chapter/:mangaSlug/:chapter",
        params: {
          mangaSlug: "ex: one-piece | naruto | etc",
          chapter: "ex: 1 | 2 | 3 | etc",
        },
      },
    },
  };
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/manga/:slug", async (req, res) => {
  const slug = req.params.slug;
  const response = await getManga(slug);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/chapter/:mangaSlug/:chapter", async (req, res) => {
  const mangaSlug = req.params.mangaSlug;
  const chapter = req.params.chapter;
  const response = await getChapter(mangaSlug, chapter);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/all-genres", async (req, res) => {
  const response = await getAllGenres();
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/manga-updates/:page", async (req, res) => {
  const page = req.params.page;
  const response = await getMangaUpdates(page);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/manga-ranking/:page/:sortBy", async (req, res) => {
  const page = req.params.page;
  const sortBy = req.params.sortBy;
  const response = await getMangaList(page, sortBy, "ranking");
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/manga-genre/:genre/:page/:sortBy", async (req, res) => {
  const genre = req.params.genre;
  const page = req.params.page;
  const sortBy = req.params.sortBy;
  const response = await getMangaList(page, sortBy, "genre", genre);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/search/:query", async (req, res) => {
  const query = req.params.query;
  const response = await getSearchManga(query);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/manga-home", async (req, res) => {
  const response = await getMangaHome();
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.get("/manga-directory/:alphabet", async (req, res) => {
  const alphabet = req.params.alphabet;
  const response = await getMangaDirectory(alphabet);
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify({ response }));
});

app.listen(3000, () => {
  console.log("App listening on port 3000!");
});
