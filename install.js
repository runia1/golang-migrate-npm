const https = require("https");
const tar = require("tar");
const StreamZip = require("node-stream-zip");
const fs = require("fs");

const package = require("./package.json");

(async () => {
  // map package version to golang-migrate version
  const version = package.version;

  const platform = process.platform;
  const arch = process.arch;

  let id = "";
  if (platform === "darwin" && arch === "x64") {
    id = "darwin-amd64.tar.gz";
  } else if (platform === "darwin" && arch === "arm64") {
    id = "darwin-arm64.tar.gz";
  } else if (platform === "linux" && arch === "x64") {
    id = "linux-amd64.tar.gz";
  } else if (platform === "linux" && arch === "arm64") {
    id = "linux-arm64.tar.gz";
  } else if (platform === "win32" && arch === "x64") {
    id = "windows-amd64.zip";
  } else if (platform === "win32" && arch === "arm64") {
    id = "windows-arm64.zip";
  } else {
    throw new Error("golang-migrate-npm isn't supported in your environment");
  }

  const url = `https://github.com/golang-migrate/migrate/releases/download/v${version}/migrate.${id}`;
  console.debug(`Downloading golang-migrate from ${url}`);

  const location = await new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        resolve(res.headers.location);
      })
      .on("error", (e) => {
        reject(e);
      });
  });

  https
    .get(location, (downloadStream) => {
      if (id.endsWith(".tar.gz")) {
        const fileStream = tar.extract(
          {
            C: "./bin",
            onwarn: (message) => console.log(message),
          },
          ["migrate"]
        );

        downloadStream.pipe(fileStream);
      } else {
        const fileStream = fs.createWriteStream(`./bin/${id}`);
        downloadStream.pipe(fileStream);
        fileStream.on("close", () => {
          const zip = new StreamZip({ file: `./bin/${id}` });
          zip.on("ready", () => {
            zip.extract("migrate.exe", "./bin/migrate", (err) => {
              console.debug(err ? "Extract error" : "Extracted");
              zip.close();
            });
          });
          zip.on("error", (err) => console.log(err));
        });
      }
    })
    .on("error", (e) => {
      console.debug("Failed to download", e);
    });
})();
