import minimist from "minimist";
import chalk from "chalk";
import { readFile } from "fs/promises";
import path from "node:path";

import tsum from "./runners/tsum";
import install from "./runners/install";
import backup from "./runners/backup";

const runners = {
	tsum,
	install,
	backup,
};

// eslint-disable-next-line no-undef
const runnerName = Bun.argv[2];
const runner = runners[runnerName];

// eslint-disable-next-line no-unused-vars
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
	console.log(chalk.bold.green("HELP"));
	// eslint-disable-next-line no-console
	console.log(helpText);
	process.exit(0);
}

runner(args);
