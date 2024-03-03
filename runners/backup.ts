// import { $, chalk, sleep } from "zx";
// import cliProgress from "cli-progress";

// import { $ } from "bun";
import { resolvePath } from "../utilities/io";
import { readdirSync } from "node:fs";
import {
	breakToPathsAndExcludes,
	resolveBackupPath,
	processInitials,
} from "../utilities/backup.extras";
import type { RunnerProps } from "../utilities/backup.extras";

// $.verbose = false;

// if (myCustomArgv.help) {
// 	const help = await readFile("./assets/help.txt", "utf8");
// 	console.log(help);
// 	process.exit(0);
// }

// console.log(chalk.bold.blue("Hello world!"));

// const date = await $`date`;
// const output = await $`echo Current date is ${date}.`;

// console.log(output);

// create a new progress bar instance and use shades_classic theme
// const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

// start the progress bar with a total value of 200 and start value of 0
// bar1.start(200, 0);

// update the current value in your application..
// bar1.update(100);
// await sleep(500);
// bar1.update(150);
// await sleep(500);
// bar1.update(200);

// stop the progress bar

// bar1.stop();

// import path from "node:path";

export default async function run(props: RunnerProps) {
	const { homealias = "home_folder" } = props;
	const { parsedConfig, destinationPath, commands } =
		await processInitials(props);
	const { rsync, zip } = commands;
	const commandsToRun: string[] = [];

	for (const { path, excludes = [] } of breakToPathsAndExcludes(
		parsedConfig.backup,
	)) {
		const resolvedBackupPath = resolveBackupPath(path, homealias);
		commandsToRun.push(
			`${rsync} ${(parsedConfig.exclude ?? []).map(e => `--exclude ${e}`).join(" ")} ${excludes.map(e => `--exclude ${e}`).join(" ")} ${resolvePath(path)} ${destinationPath}/${resolvedBackupPath}`,
		);
	}

	for (const path of parsedConfig.zip ?? []) {
		const resolvedBackupPath = resolveBackupPath(path, homealias);
		commandsToRun.push(
			`${zip} ${destinationPath}/${resolvedBackupPath}.zip ${resolvePath(path)}`,
		);
	}

	for (const [listName, listPaths] of Object.entries(parsedConfig.list ?? [])) {
		commandsToRun.push(`rm -rf ${destinationPath}/${listName}.txt`);
		if (typeof listPaths === "string" && listPaths[0] === "@") {
			commandsToRun.push(
				`${listPaths.replace(/@`(.*)`/, "$1")} >> ${destinationPath}/${listName}.txt`,
			);
		} else {
			for (const listPath of listPaths) {
				// Using `readdirSync(".").sort()` instead of `ls -A` (commands.ls) because it doesn't work
				// see the https://github.com/oven-sh/bun/issues/9202
				// commandsToRun.push(
				// 	`${ls} ${resolvePath(listPath)} >> ${destinationPath}/${listName}.txt`,
				// );
				commandsToRun.push(
					`echo '${readdirSync(resolvePath(listPath)).sort().join("\n")}' >> ${destinationPath}/${listName}.txt`,
				);
			}
		}
	}

	// console.log(commandsToRun.join("\n\n"));
}

run.minimist = {
	boolean: ["help"],
	string: ["config", "destination", "homealias"],
	alias: {
		h: "help",
		c: "config",
		d: "destination",
		home: "homealias",
		H: "homealias",
	},
};
