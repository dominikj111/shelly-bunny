import minimist from "minimist";
import path from "node:path";
import { existsSync } from "node:fs";
import assert from "bun:assert/strict";
import { readFile } from "fs/promises";
import { getRunners, getPaths } from "./utilities/io.js";

import tsum from "./runners/tsum";
import install from "./runners/install";
import backup from "./runners/backup";

const performChecks = !Bun.argv.includes("--no-check");

const runners = {
	backup,
	install,
	tsum,
};

if (performChecks) {
	// Check we didn't forget to add any runner
	assert.deepStrictEqual(
		Object.keys(runners)
			.filter(r => r !== "install")
			.sort(),
		await getRunners(),
		"Not all runners are instantiated!",
	);

	for (const runnerName in runners) {
		// Check any runner contains minimist and exported default fucntion
		assert.strictEqual(
			typeof runners[runnerName].minimist,
			"object",
			`${runnerName} doesn't have exported minimist object`,
		);
		assert.strictEqual(
			typeof runners[runnerName],
			"function",
			`${runnerName} doesn't have exported default function`,
		);
		// Check any runner has related help file
		assert.strictEqual(
			existsSync(getPaths(runnerName).assetsDir.help),
			true,
			`${runnerName} doesn't have the help file`,
		);
	}
}

const runnerName = Bun.argv[2];
const runner = runners[runnerName];

const { _, ...args } = minimist(process.argv.slice(2), runner.minimist);

// Fix aliases as they are not work out of the box as I would expect.
for (const argKey in Object.keys(args)) {
	const aliasedKey = runner.minimist.alias?.[argKey];
	if (aliasedKey !== undefined) {
		args[aliasedKey] = args[argKey];
		delete args[argKey];
	}
}

const __dirname = path.resolve(import.meta.url.replace("file://", ""), "..");

if (args.help) {
	const helpText = await readFile(
		`${__dirname}/assets/${runnerName}/help.txt`,
		"utf8",
	);

	// eslint-disable-next-line no-console
	console.log(helpText); // only place I'm ok to use console.log
	process.exit(0);
}

runner(args);
