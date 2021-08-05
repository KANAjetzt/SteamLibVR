import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import fetch from "node-fetch";

// Start express app
export const app = express();

// __dirname with modules - https://stackoverflow.com/a/62892482/13267067
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(`${__dirname}/public`));

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);

app.use(async (req, res, next) => {
  // 916440
  // 1248130
  // 736260
  // 1506510
  // 1455840
  const appId = 1248130;

  const gameReq = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appId}`
  );

  const gameInfo = await gameReq.json();
  req.gameInfo = gameInfo[appId].data;

  next();
});

app.get("/", (req, res) => {
  res.status(200).render("base", { gameInfo: req.gameInfo });
});

app.get("/front", (req, res) => {
  res.status(200).render("front", { gameInfo: req.gameInfo });
});
