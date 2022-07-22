#!/usr/bin/env node

const axios = require("axios");
const tar = require("tar");
const StreamZip = require("node-stream-zip");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");
const finished = promisify(stream.finished);

(async () => {
  // We have to manually version bump this whenever we publish a new npm version
  const golangMigrateCliVersion = "4.15.2";

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
    throw new Error("golang-migrate-cli isn't supported in your environment");
  }

  const url = `https://github.com/golang-migrate/migrate/releases/download/v${golangMigrateCliVersion}/migrate.${id}`;
  console.debug(`Downloading golang-migrate from ${url}`);

  try {
    const response = await axios.default.get(url, { responseType: "stream" });
    const downloadStream = response.data;

    if (id.endsWith(".tar.gz")) {
      const fileStream = tar.extract(
        {
          C: path.join(__dirname, "bin"),
          onwarn: (message) => {
            throw new Error(message);
          },
        },
        ["migrate"]
      );
      downloadStream.pipe(fileStream);
      await finished(fileStream);
    } else {
      // StreamZip unfortunately only takes in a file path..
      // so we have to save this zip archive to fs before we can unzip
      const fileStream = fs.createWriteStream(path.join(__dirname, "bin", id));
      downloadStream.pipe(fileStream);
      await finished(fileStream);

      const zip = new StreamZip({
        file: path.join(__dirname, "bin", id),
      });

      zip.on("ready", () => {
        zip.extract(
          "migrate.exe",
          path.join(__dirname, "bin", "migrate.exe"),
          () => zip.close()
        );
      });

      zip.on("error", (e) => {
        throw new Error("Failed to unzip golang-migrate archive");
      });
    }
  } catch (e) {
    console.error(
      "Something went wrong installing golang-migrate-cli:",
      e.message
    );
  }
})();
