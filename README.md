# golang-migrate

## Description

An npm package that installs the golang-migrate binary as an npm dependency

## Install

```bash
npm i -S golang-migrate
```

## Usage

```bash
npx golang-migrate-cli --help
```

You can find more information about how to use the golang-migrate cli at https://github.com/golang-migrate/migrate

## Development

This install script is hard to test given the nature of how it works. Npm only lets you publish one version of a given package and you can't re-publish if it's broken, you can only remove the version. This is even more critical given the strategy of keeping the npm package version 1:1 with the golang-migrate version.

### Prior to running npm publish

- Run `npm i -S git+ssh://git@github.com:runia1/golang-migrate-npm.git` in an npm project.
- Insepect the npm logs.
- Run `npx golang-migrate-cli --help` to ensure npx can run the executable.
