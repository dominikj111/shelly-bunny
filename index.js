import minimist from "minimist";
import path from "node:path";
import assert from "bun:assert/strict";
import { readFile } from "fs/promises";
import { getRunners } from "./utilities/io.js";

import tsum from "./runners/tsum";
import install from "./runners/install";
import backup from "./runners/backup";

const runners = {
	backup,
	install,
	tsum,
};

assert.deepStrictEqual(
	Object.keys(runners)
		.filter(r => r !== "install")
		.sort(),
	(await getRunners()).sort(),
	"Not all runners are instantiated!",
);

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
