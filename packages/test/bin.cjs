#!/usr/bin/env node

const {readFileSync} = require("fs");
const {dirname, resolve} = require("path");
const {pathToFileURL} = require("url");

const playwrightPkgJsonPath = require.resolve("@playwright/test/package.json");

/** @type {typeof import('@playwright/test/package.json')} */
const playwrightPkgJson = JSON.parse(
	readFileSync(playwrightPkgJsonPath, "utf-8"),
);

const relativeBin = playwrightPkgJson.bin?.playwright;

if (typeof relativeBin !== "string") {
	throw new Error(
		`Couldn't find playwright binary in ${dirname(playwrightPkgJsonPath)}`,
	);
}

const target = resolve(dirname(playwrightPkgJsonPath), relativeBin);
import(pathToFileURL(target).href);
