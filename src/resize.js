import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import sharp from "sharp";
import { exec } from "child_process";

// __dirname with modules - https://stackoverflow.com/a/62892482/13267067
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const path = `${__dirname}/export`;

const imgPaths = fs.readdirSync(path);

imgPaths.forEach((imgPath) => {
  // const img = fs.readFileSync(`${__dirname}/min/${imgPath}`)
  // sharp(img)
  // .resize(660,1050)
  // .toFormat('jpeg')
  // .jpeg({quality: 50})
  // .toFile(`${__dirname}/minExport/${imgPath}`)
  // basisu -ktx2 x.png
  // console.log(imgPath);
  exec(
    `basisu -mipmap -q 190 ${__dirname}/export/${imgPath}`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
});
