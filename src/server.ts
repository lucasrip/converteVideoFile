import chokidar from "chokidar";
import fs from "node:fs";
import path from "node:path";
import hbjs from "handbrake-js";
import { rename } from "fs/promises";

const dateConfig = new Date()
  .toLocaleString("pt-br", {
    timeZone: "America/Sao_Paulo",
  })
  .split(/[\./|,]/);
const dateObject = {
  day: dateConfig[0],
  month: dateConfig[1],
  yar: dateConfig[2],
  hours: dateConfig[3],
};

function createFolder(): string {
  const { day, month } = dateObject;
  const dirName = `./src/videos/backup/date-${day}-${month}`;
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
  }
  return dirName;
}

const dirPath = path.resolve("src/videos/entrada");
const watcher = chokidar.watch(dirPath, {
  persistent: true,
  ignoreInitial: true,
});

async function moverArquivo(origem: string, destino: string) {
  try {
    await rename(origem, destino);
    console.log("Arquivo movido com sucesso!");
  } catch (error) {
    console.error("Erro ao mover o arquivo:", error);
  }
}

watcher.on("add", (path, stats) => {
  const backupDirName = createFolder();
  const newFormat = path.replace(".dav", ".mp4").replace("entrada", "saida");

  hbjs
    .spawn({ input: path, output: newFormat })
    .on("error", (err: any) => {
      // invalid user input, no video found etc
    })
    .on("progress", (progress: { percentComplete: any; eta: any }) => {
      console.log(
        "Percent complete: %s, ETA: %s",
        progress.percentComplete,
        progress.eta
      );
    })
    .on("end", () => {
      const regex = /\\[^\\]+\.dav$/;
      const fileName = path.match(regex);
      const backupPath = backupDirName + fileName;
      moverArquivo(path, backupPath);
    });
});
