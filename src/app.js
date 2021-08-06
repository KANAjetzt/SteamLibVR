import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import fetch from "node-fetch";
import captureWebsite from 'capture-website';

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
  req.appId = 1455840;

  // const gameReq = await fetch(
  //   `https://store.steampowered.com/api/appdetails?appids=${appId}`
  // );

  const gameReq = await fetch('http://localhost:3000/data/gameInfo.json')

  const gameInfo = await gameReq.json();
  
  req.gameInfo = gameInfo[req.appId].data;

  next();
});

app.get("/", (req, res) => {
  res.status(200).render("base", { gameInfo: req.gameInfo });
});

app.get("/front", (req, res) => {
  res.status(200).render("front", { gameInfo: req.gameInfo });
});

app.get("/back", (req, res) => {
  res.status(200).render("back", { gameInfo: req.gameInfo });
});

app.get("/side", (req, res) => {
  res.status(200).render("side", { gameInfo: req.gameInfo });
});

app.get("/cover", async (req, res) => {
  await captureWebsite.file('http://localhost:3000/', `${__dirname}/export/${req.appId}.png`, {
    type: 'jpeg',
    width: 1260,
    height: 900,
    scaleFactor: 1
  });

  res.status(200).json({
    status: 'success',
    message: 'cover created'
  });
})
