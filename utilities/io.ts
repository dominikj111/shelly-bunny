import { $ } from "bun";
import path from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import ini from "ini";
import { error } from "./log";

interface pathStructure {
	root: string;
	runtime: string;
	cwd: string;
	home: string;
	assets?: string;
	assetsDir?: {
		[key: string]: string;
	};
}

let runnersCache: string[] | undefined;
const pathsCache: Record<string, pathStructure> = {};

/**
 * Returns sorted list of runnerNames from runners directory except the installation script.
 * No files extension is included.
 *
 * [ "backup", "tsum" ]
 */
export async function getRunners(): Promise<string[]> {
	if (runnersCache === undefined) {
		runnersCache = (
			await $`ls -A ${path.resolve(import.meta.dir, "../runners")} | grep -v install.ts`
				.quiet()
				.text()
		)
			.split("\n")
			.filter(Boolean)
			.map(r => r.replace(/\..+$/, ""))
			.sort();
	}

	return structuredClone(runnersCache); //we don't want to pass a reference to private variable
}

/**
 * Returns absolute paths to common folders and files in project.
 * If the scriptName is provided, it will return paths to the assets folder as well.
 *
 * {
 *   root: "/path/to/project",
 *   runtime: "/path/to/bun",
 *   assets: "/path/to/project/assets",
 *   assetsDir: {
 *     template: "/path/to/project/assets/template.sh",
 *     help: "/path/to/project/assets/help.txt"
 *   }
 * }
 */
export function getPaths(scriptName?: string): pathStructure {
	const pathsCacheKey = scriptName || "_";

	if (process.env.HOME === undefined) {
		error("process.env.HOME is undefined!");
		process.exit(1);
	}

	if (pathsCache[pathsCacheKey] == undefined) {
		pathsCache[pathsCacheKey] = {
			root: path.resolve(import.meta.dir, ".."),
			runtime: Bun.argv[0],
			cwd: process.cwd(),
			home: process.env.HOME,
		};

		if (scriptName) {
			const assets = `${pathsCache[pathsCacheKey].root}/assets/${scriptName}`;
			Object.assign(pathsCache[pathsCacheKey], {
				assets,
				assetsDir: readdirSync(assets).reduce(
					(acc, assetName) => ({
						...acc,
						[assetName.replace(/\..+$/, "")]: `${assets}/${assetName}`,
					}),
					{},
				),
			});
		}
	}

	return structuredClone(pathsCache[pathsCacheKey] as pathStructure);
}

/**
 * Read and parse the ini file.
 */
export function readConfig<T>(configPath: string): T {
	return ini.parse(readFileSync(configPath, "utf8"));
}

/**
 * Resolves path with ~ better.
 */
export function resolvePath(...args: string[]) {
	const resolved = path.resolve(...args);
	const tilda = resolved.indexOf("~");

	if (tilda !== -1) {
		return getPaths().home + resolved.slice(tilda + 1);
	}

	return resolved;
}
