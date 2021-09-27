import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// __dirname with modules - https://stackoverflow.com/a/62892482/13267067
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const path = `${__dirname}/export`

const files = fs.readdirSync(path)

console.log(files)

files.forEach(file => {

  let newFile = file.split('.')
  newFile = `${newFile[0]}.jpg`

  fs.rename(`${path}/${file}`,`${path}/${newFile}`, () => {
    console.log('done')
  })
})