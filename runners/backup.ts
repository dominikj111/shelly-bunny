// import { $, chalk, sleep } from "zx";
// import cliProgress from "cli-progress";

import { $ } from "bun";
import { resolvePath } from "../utilities/io";
import { existsSync, readdirSync, mkdirSync, statSync } from "node:fs";
import {
	breakToPathsAndExcludes,
	resolveBackupPath,
	processInitials,
	findCommonLeftSequence,
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

	const rsyncPaths = breakToPathsAndExcludes(parsedConfig.backup);

	const commonPathBase = findCommonLeftSequence(
		[
			...rsyncPaths.map(({ path }) => path.split(" ! ")[0]),
			...(parsedConfig.zip ?? []),
		],
		{ stopAfterLastSequence: "/" },
	);

	for (const { path, excludes = [] } of rsyncPaths) {
		const pathStats = statSync(path);

		let resolvedBackupPath = resolveBackupPath(
			path.replace(commonPathBase, ""),
			homealias,
		);

		if (pathStats.isDirectory()) {
			resolvedBackupPath = resolvedBackupPath.split("/").slice(0, -1).join("/");
			if (resolvedBackupPath) {
				resolvedBackupPath += "/";
			}
		}

		const joinedExcludes = [...(parsedConfig.exclude ?? []), excludes]
			.map(e => `--exclude '${e}'`)
			.join(" ");
		const backupDestination = `${destinationPath}/${resolvedBackupPath}`;

		if (backupDestination[backupDestination.length - 1] === "/") {
			mkdirSync(backupDestination, { recursive: true });
		} else {
			mkdirSync(backupDestination.split("/").slice(0, -1).join("/"), {
				recursive: true,
			});
		}

		commandsToRun.push(
			`${rsync} ${joinedExcludes} ${resolvePath(path)} ${backupDestination}`,
		);
	}

	for (const path of parsedConfig.zip ?? []) {
		const resolvedBackupPath = resolveBackupPath(
			path.replace(commonPathBase, ""),
			homealias,
		);
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

	if (!existsSync(destinationPath)) {
		mkdirSync(destinationPath, { recursive: true });
	}

	console.log(commandsToRun.join("\n\n"));

	for (const cmd of commandsToRun) {
		Bun.spawnSync(cmd.split(" "));
	}
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
