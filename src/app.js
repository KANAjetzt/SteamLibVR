import { promisify } from "util";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import fetch from "node-fetch";
import captureWebsite from "capture-website";
import cors from 'cors'
import asyncMap from './utils/asyncMap.js'

const readDirAsync = promisify(fs.readdir);

// Start express app
export const app = express();

// __dirname with modules - https://stackoverflow.com/a/62892482/13267067
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(`${__dirname}/public`));

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);

app.use(cors())

app.options('*', cors())

app.use(async (req, res, next) => {
  // Get owned games
  const ownedGamesReq = await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=&steamid=76561198029394113&include_played_free_games=true&include_appinfo=true&format=json`)
  const ownedGamesData = await ownedGamesReq.json()

  const ownedGamesAppIds = ownedGamesData.response.games.map(gameInfo => gameInfo.appid)

  if(ownedGamesAppIds[0]){
    req.gameInfo = await asyncMap(ownedGamesAppIds, async appId => {
      try{
        const gameReq = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appId}`
      );
  
      const gameInfo = await gameReq.json();
  
      if(gameInfo) {
        return gameInfo[appId].data;
      } else {
        return undefined
      }    
    } catch(err) {
      console.log(err)
      return undefined
    }
    }) 
  
    console.log(req.gameInfo)
  } else {
    console.log('no appIds!')
  }

  next();
});

app.get("/", (req, res) => {
  res.status(200).render("base", { gameInfo: req.gameInfo, appId: req.appId });
});

app.get("/front", (req, res) => {
  console.log(req);
  res.status(200).render("front", { gameInfo: req.gameInfo, appId: req.appId });
});

app.get("/back", (req, res) => {
  res.status(200).render("back", { gameInfo: req.gameInfo, appId: req.appId });
});

app.get("/side", (req, res) => {
  res.status(200).render("side", { gameInfo: req.gameInfo, appId: req.appId });
});

app.get("/gameInfo", async (req, res) => {
  res.json({
    status: "success",
    data: req.gameInfo,
  });
});

app.get("/cover", async (req, res) => {
  await captureWebsite.file(
    "http://localhost:3000/",
    `${__dirname}/export/${req.appId}.png`,
    {
      type: "jpeg",
      width: 1320,
      height: 2100,
      scaleFactor: 1,
    }
  );

  res.status(200).json({
    status: "success",
    message: "cover created",
  });
});

app.get("/covers", async (req, res) => {
  const files = await readDirAsync(`${__dirname}/export`);

  res.status(200).json({
    status: "success",
    data: files,
  });
});
