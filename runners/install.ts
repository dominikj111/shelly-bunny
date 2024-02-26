import path from "node:path";
import { getRunners, getPaths } from "../utilities/io";
import { existsSync } from "node:fs";
import { $ } from "bun";
import { error } from "../utilities/log";

const paths = getPaths("install");

export default async function run({ destination }: { destination?: string }) {
	if (!destination) {
		error("Destination is required!");
		process.exit(1);
	}

	if (!existsSync(destination)) {
		error("Destination doesn't exist!");
		process.exit(1);
	}

	if (paths.assetsDir?.template === undefined) {
		error("Template doesn't exist!");
		process.exit(1);
	}

	const template = (await Bun.file(paths.assetsDir.template).text())
		.replace("$RUNTIME_PATH", paths.runtime)
		.replace("$LOCALS_PATH", paths.root);

	for (const runnerName of await getRunners()) {
		const executablePath = path.resolve(destination, runnerName);
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
