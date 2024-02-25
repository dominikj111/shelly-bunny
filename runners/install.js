import path from "node:path";
import chalk from "chalk";
import { getRunners, getPaths } from "../utilities/io.js";
import { existsSync } from "node:fs";
import { $ } from "bun";

const paths = getPaths("install");

export default async function run({ destination }) {
	if (!destination) {
		// eslint-disable-next-line no-console
		console.log(chalk.red("Destination is required!"));
		process.exit(1);
	}

	if (!existsSync(destination)) {
		// eslint-disable-next-line no-console
		console.log(chalk.red("Destination doesn't exist!"));
		process.exit(1);
	}

	// eslint-disable-next-line no-undef
	const template = (await Bun.file(paths.assetsDir.template).text())
		.replace("$RUNTIME_PATH", paths.runtime)
		.replace("$LOCALS_PATH", paths.root);

	for (const runnerName of getRunners()) {
		const executablePath = path.resolve(destination, runnerName);
		// eslint-disable-next-line no-undef
		await Bun.write(executablePath, template.replace("$RUNNER_NAME", runnerName));
		await $`chmod +x ${executablePath}`.quiet();
	}
}

run.minimist = {
	boolean: ["help"],
	string: ["destination"],
	alias: {
		h: "help",
		d: "destination",
	},
};
