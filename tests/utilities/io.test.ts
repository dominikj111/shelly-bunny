import { describe, test, expect } from "bun:test";
import { getPaths, getRunners } from "../../utilities/io.js";

describe("IO contains utils to work upon files/folders.", () => {
	test("getPaths returns common paths", () => {
		expect(getPaths().root).not.toBeUndefined();
		expect(getPaths().runtime).toInclude("/bun"); // bun is the target runtime
	});

	test("getPaths contains runner's assets if runner name is provided", () => {
		expect(getPaths("install").assetsDir?.template).toInclude(
			"assets/install/template.sh",
		);
		expect(getPaths("install").assetsDir?.help).toInclude(
			"assets/install/help.txt",
		);
		expect(getPaths().assets).toBeUndefined();
		expect(getPaths().assetsDir).toBeUndefined();
	});

	test("getRunners returns list of runnerNames", async () => {
		expect(await getRunners()).toContain("tsum");
	});

	test("getRunners doesn't include installation script", async () => {
		expect(await getRunners()).not.toContain("install");
	});

	test("getRunners doesn't return runner name with file extension", async () => {
		expect((await getRunners()).filter(r => r.match(/\..+$/)).length).toBe(0);
	});
});
