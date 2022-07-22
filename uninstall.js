#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// remove symlink
fs.unlinkSync(path.join(__dirname, "..", ".bin", "golang-migrate"));
