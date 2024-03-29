import { getPaths, readConfig, resolvePath } from "./io";
import { error } from "./log";
import { existsSync } from "node:fs";

export interface ParsedConfig {
	backup: string[];
	destination?: string;
	exclude?: string[];
	list?: Record<string, string[] | string>;
	zip?: string[];
}

export interface RunnerProps {
	config: string;
	destination?: string;
	homealias?: string;
}

/**
 * Splits backup entries and return an array of objects with path and excludes.
 *
 * input: ["/Users/dominikjelinek/my", ~/my ~ *.sql*, "~/home/survey-test ~ *.a.txt dir"]
 * will break to:
 * [
 *   { path: "/Users/dominikjelinek/my", excludes: [] },
 *   { path: "~/my", excludes: ["*.sql*"] },
 *   { path: "~/home/survey-test", excludes: ["*.a.txt", "dir"] }
 * ]
 */
export function breakToPathsAndExcludes(
	backupEntries: string[],
): { path: string; excludes?: string[] }[] {
	return backupEntries.map(be => {
		const [path, excludes = ""] = be.split(" ! ");
		return { path, excludes: excludes.split(" ") };
	});
}

/**
 * Takes the backup path and return edited path with replaced `~` by provided home alias [default: home_folder] and
 * remove special start sequences like `./` or `/`.
 *
 * It errors in case the path start with `../` or contains `~` or `..` in the middle of the path.
 */
export function resolveBackupPath(
	backupPath: string,
	homeAlias: string = "home_folder",
): string {
	let resolvedBackupPath = backupPath;

	if (backupPath.startsWith(getPaths().home)) {
		resolvedBackupPath = backupPath.replace(getPaths().home, homeAlias);
	} else if (backupPath.startsWith("~")) {
		resolvedBackupPath = backupPath.replace(/^~\//, `${homeAlias}/`);
	} else if (backupPath.startsWith("/")) {
		resolvedBackupPath = backupPath.slice(1);
	} else if (backupPath.startsWith("./")) {
		resolvedBackupPath = backupPath.slice(2);
	} else if (backupPath.startsWith("../")) {
		error("Relative paths for backups are not supported!");
		process.exit(1);
	}

	if (resolvedBackupPath.includes("~") || resolvedBackupPath.includes("..")) {
		error(`Backup path ${backupPath} is not valid!`);
		process.exit(1);
	}

	return resolvedBackupPath;
}

/**
 * Will process/check runner's params and config and returns required initials.
 * initials structure contains parsed config, destination path and verified rsync, zip and ls commands.
 */
export async function processInitials(props: RunnerProps): Promise<{
	parsedConfig: ParsedConfig;
	destinationPath: string;
	commands: { rsync: string; zip: string; ls: string };
}> {
	const { config, destination } = props;
	const configPath = config ?? `${getPaths().cwd}/backup.config.ini`;

	if (!configPath || !existsSync(configPath)) {
		error("Config is not provided!");
		process.exit(1);
	}

	const parsedConfig = readConfig<ParsedConfig>(configPath);
	let destinationPath = destination || parsedConfig.destination;

	if (!destinationPath) {
		error("Destination is required!");
		process.exit(1);
	}

	destinationPath = resolvePath(destinationPath);

	if (Bun.which("rsync") === null) {
		error("rsync not found!");
		process.exit(1);
	}

	if (Bun.which("zip") === null) {
		error("zip not found!");
		process.exit(1);
	}

	return {
		parsedConfig,
		destinationPath,
		commands: {
			rsync: "rsync --delete --delete-excluded -arEhtN",
			zip: "zip -r0",
			ls: "ls -A",
		},
	};
}

/**
 * It returns same substring starting on 0th index of each sequence.
 *
 * @param entries array of sequences
 * @param options switchers to control the output
 * @returns common left sequence
 */
export function findCommonLeftSequence(
	entries: string[],
	options: { stopAfterLastSequence?: string } = {},
): string {
	if (entries.length === 0 || entries[0].length === 0) {
		return "";
	}

	let commonBase = entries[0][0];

	for (;;) {
		if (
			entries.some(e => !e.startsWith(commonBase)) ||
			entries[0].length <= commonBase.length
		) {
			break;
		}
		commonBase += entries[0][commonBase.length];
	}

	const result = commonBase.slice(0, commonBase.length - 1);

	if (options.stopAfterLastSequence) {
		const trimmedResult = new RegExp(
			`^(.*${options.stopAfterLastSequence}).*$`,
		).exec(result)?.[1];

		if (trimmedResult !== undefined) {
			return trimmedResult;
		}
	}

	return result;
}
