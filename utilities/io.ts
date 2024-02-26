import { $ } from "bun";
import path from "node:path";
import { readdirSync } from "node:fs";

interface pathStructure {
	root: string;
	runtime: string;
	assets?: string;
	assetsDir?: {
		[key: string]: string;
	};
}

let runnersCache: string[] | undefined;
const pathsCache: Record<string, pathStructure> = {};

export async function getRunners(): Promise<string[]> {
	if (runnersCache === undefined) {
		runnersCache = (
			await $`ls -A ${path.resolve(import.meta.dir, "../runners")} | grep -v install.ts`
				.quiet()
				.text()
		)
			.split("\n")
			.filter(Boolean)
			.map(r => r.replace(/\..+$/, ""));
	}

	return structuredClone(runnersCache); //we don't want to pass a reference to private variable
}

export function getPaths(scriptName?: string): pathStructure {
	const pathsCacheKey = scriptName || "_";

	if (pathsCache[pathsCacheKey] == undefined) {
		pathsCache[pathsCacheKey] = {
			root: path.resolve(import.meta.dir, ".."),
			runtime: Bun.argv[0],
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
