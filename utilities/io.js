import { $ } from "bun";
import path from "node:path";
import { readdirSync } from "node:fs";

let runnersCache;
const pathsCache = {};

export async function getRunners() {
	if (runnersCache === undefined) {
		runnersCache = (
			await $`ls -A ${path.resolve(import.meta.dir, "../runners")} | grep -v install.js`
				.quiet()
				.text()
		)
			.split("\n")
			.filter(Boolean)
			.map(r => r.replace(".js", ""));
	}

	return [...runnersCache]; //we don't want to pass a reference to private variable
}

export function getPaths(scriptName = "") {
	const pathsCacheKey = scriptName || "_";

	if (pathsCache[pathsCacheKey] === undefined) {
		pathsCache[pathsCacheKey] = {
			root: path.resolve(import.meta.dir, ".."),
			// eslint-disable-next-line no-undef
			runtime: Bun.argv[0],
		};

		const paths = pathsCache[pathsCacheKey];

		if (scriptName) {
			paths.assets = `${paths.root}/assets/${scriptName}`;
			paths.assetsDir = readdirSync(paths.assets).reduce(
				(acc, assetName) => ({
					...acc,
					[assetName.replace(/\..+$/, "")]: `${paths.assets}/${assetName}`,
				}),
				{},
			);
		}
	}

	return pathsCache[pathsCacheKey];
}
