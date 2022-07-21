#!/usr/bin/env node

const https = require("https");
const tar = require("tar");
const StreamZip = require("node-stream-zip");
const fs = require("fs");
const path = require("path");

const package = require("package.json");

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

  try {
    const location = await new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          resolve(res.headers.location);
        })
        .on("error", (e) => {
          reject(e);
        });
    });

    await new Promise((resolve, reject) => {
      https
        .get(location, (downloadStream) => {
          if (id.endsWith(".tar.gz")) {
            const fileStream = tar.extract(
              {
                C: path.join(__dirname, "bin"),
                onwarn: (message) => reject(message),
              },
              ["migrate"]
            );

            fileStream.on("close", resolve);

            downloadStream.pipe(fileStream);
          } else {
            const fileStream = fs.createWriteStream(
              path.join(__dirname, "bin", id)
            );
            downloadStream.pipe(fileStream);
            fileStream.on("close", () => {
              const zip = new StreamZip({
                file: path.join(__dirname, "bin", id),
              });
              zip.on("ready", () => {
                zip.extract(
                  "migrate.exe",
                  path.join(__dirname, "bin", "migrate"),
                  (err) => {
                    zip.close();
                    resolve();
                  }
                );
              });
              zip.on("error", (e) => reject(e));
            });
          }
        })
        .on("error", (e) => {
          reject(e);
        });
    });

    // create the symlink to node_modules/.bin/golang-migrate
    fs.symlinkSync(
      path.join(__dirname, "bin", "migrate"),
      path.join(__dirname, "..", ".bin", "golang-migrate"),
      "file"
    );
  } catch (e) {
    console.log(e);
  }
})();
