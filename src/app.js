import dotenv from 'dotenv'
import { promisify } from "util";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import fetch from "node-fetch";
import captureWebsite from "capture-website";
import cors from 'cors'
import asyncMap from './utils/asyncMap.js'
import asyncForEach from './utils/asyncForEach.js'
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg'

const readDirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
dotenv.config()

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
  const gameData = await readFileAsync(`${__dirname}/../resources/gameInfoAll.json`)
  const gameDataJSON = JSON.parse(gameData)
  req.allGames = gameDataJSON.data
  req.gameInfo = gameDataJSON.data[16]

  console.log(gameDataJSON.data.length)
  
  next()
})

app.get('/', (req, res) => {
  console.log(req.params)
  res.status(200).render("base", { gameInfo: req.gameInfo });
});

app.get('/coverRender/:index', (req, res) => {
  console.log(req.params)
  res.status(200).render("base", { gameInfo: req.allGames[req.params.index] });
});

app.get("/allGames", async (req, res) => {

    // Get owned games
    const ownedGamesReq = await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=76561198029394113&include_played_free_games=true&include_appinfo=true&format=json`)
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
    
    } else {
      console.log('no appIds!')
    }

  res.json({
    status: "success",
    data: req.gameInfo,
  });
});

app.get('/gameInfo', (req, res) => {
  res.json({
    status: 'success',
    data: req.gameInfo
  })
})

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
  
  await asyncForEach(req.allGames,async (game, i) => {
    // if no game data return
    if(!game) return
    
    const coverPath = `${__dirname}/export/${req.allGames[i].steam_appid}.jpg`
    
    // if file exist already return
    if(fs.existsSync(coverPath)) return
    
    await captureWebsite.file(
        `http://localhost:3000/coverRender/${i}`,
        coverPath,
        {
          type: "jpeg",
          width: 1320,
          height: 2100,
          scaleFactor: 1,
        }
      );
    })

  res.status(200).json({
    status: "success",
    message: "covers created",
  });
});

app.get("/covers", async (req, res) => {
  const files = await readDirAsync(`${__dirname}/export`);

  res.status(200).json({
    status: "success",
    data: files,
  });
});

app.get('/compressCovers',async (req, res) => {
 await imagemin([`${__dirname}/export/*.jpg`], {
    destination: `${__dirname}/min`,
    plugins: [
      imageminMozjpeg({quality: 70})
    ]
  });

  res.json({
    status: 'success',
  })
})