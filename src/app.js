import dotenv from "dotenv";
import { promisify } from "util";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import fetch from "node-fetch";
import captureWebsite from "capture-website";
import cors from "cors";
import asyncMap from "./utils/asyncMap.js";
import asyncForEach from "./utils/asyncForEach.js";

const readDirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const unlinkFileAsync = promisify(fs.unlink);
dotenv.config();

// Start express app
export const app = express();

// __dirname with modules - https://stackoverflow.com/a/62892482/13267067
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(`${__dirname}/public`));

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);

app.use(cors());

app.options("*", cors());

app.use(async (req, res, next) => {
  const jsonFiles = await readDirAsync(`${__dirname}/public/data`);

  if (jsonFiles[0]) {
    const gameData = await readFileAsync(
      `${__dirname}/public/data/${jsonFiles[0]}`
    );

    const gameDataJSON = JSON.parse(gameData);

    req.allGames = gameDataJSON;

    next();
  } else {
    req.allGames = [];

    next();
  }
});

app.get("/", (req, res) => {
  console.log(req.params);
  res.status(200).render("base", { gameInfo: req.gameInfo });
});

app.get("/coverRender/:index", (req, res) => {
  console.log(req.params);
  res.status(200).render("base", { gameInfo: req.allGames[req.params.index] });
});

app.get("/updateGameInfo", async (req, res) => {
  // Get owned games
  const ownedGamesReq = await fetch(
    `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=76561198029394113&include_played_free_games=true&include_appinfo=true&format=json`
  );
  const ownedGamesData = await ownedGamesReq.json();

  const ownedGamesAppIds = ownedGamesData.response.games.map(
    (gameInfo) => gameInfo.appid
  );

  // Get detailed game info
  if (ownedGamesAppIds[0]) {
    const allGamesDetails = await asyncMap(ownedGamesAppIds, async (appId) => {
      try {
        const gameReq = await fetch(
          `https://store.steampowered.com/api/appdetails?appids=${appId}`
        );

        const gameInfo = await gameReq.json();

        if (gameInfo) {
          return gameInfo[appId].data;
        } else {
          return undefined;
        }
      } catch (err) {
        console.log(err);
        return undefined;
      }
    });

    const filteredAllGamesDetails = allGamesDetails.filter(
      (game) => game !== undefined
    );

    // Check data folder for old gameInfo json files
    const oldDataPaths = await readDirAsync(`${__dirname}/public/data`);

    // Write new game info in json file
    await writeFileAsync(
      `${__dirname}/public/data/gameInfo-${Date.now()}.json`,
      JSON.stringify(filteredAllGamesDetails)
    );

    // TODO: If everything went well - check for old file and delete
    // If the new data has more games then the older - its fine 👍
    if (req.allGames.length <= filteredAllGamesDetails.length) {
      oldDataPaths.forEach((oldDataPath) => {
        // Check if filename includes "gameInfo"
        if (oldDataPath.includes("gameInfo")) {
          // Delete Old File
          unlinkFileAsync(`${__dirname}/public/data/${oldDataPath}`);
        }
      });
      res.json({
        status: "success",
        data: `${__dirname}/public/data/gameInfo-${Date.now()}.json`,
      });
    } else {
      res.json({
        status: "warning",
        message: "There are less games then before.",
        data: `${__dirname}/public/data/gameInfo-${Date.now()}.json`,
      });
    }
  } else {
    console.log("no appIds!");
    res.json({
      status: "error",
      message: `"no appIds!"`,
    });
  }
});

app.get("/gameInfo/:appId", (req, res) => {
  const appId = req.params.appId;
  console.log(appId);

  const gameInfo = req.allGames.filter(
    (game) => game.steam_appid === parseInt(appId)
  );

  console.log(gameInfo);

  if (!gameInfo[0]) {
    res.status(404).json({
      status: "error",
      message: "Sorry, this appId doesn't exist.",
    });
  }

  if (gameInfo.length > 1) {
    res.status(500).json({
      status: "error",
      message: "Sorry, there is more then one result.",
    });
  }

  res.json({
    status: "success",
    data: gameInfo,
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

app.get("/allCovers", async (req, res) => {
  await asyncForEach(req.allGames, async (game, i) => {
    // if no game data return
    if (!game) return;

    const coverPath = `${__dirname}/export/${req.allGames[i].steam_appid}.jpg`;

    // if file exist already return
    if (fs.existsSync(coverPath)) return;

    await captureWebsite.file(
      `http://localhost:3000/coverRender/${i}`,
      coverPath,
      {
        type: "jpeg",
        width: 1260,
        height: 900,
        scaleFactor: 2,
      }
    );
  });

  res.status(200).json({
    status: "success",
    message: "covers created",
  });
});

app.get("/covers", async (req, res) => {
  const files = await readDirAsync(`${__dirname}/basis`);

  res.status(200).json({
    status: "success",
    data: files,
  });
});
