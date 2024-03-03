import { $ } from "bun";
import path from "node:path";
import { describe, test, expect, mock, jest } from "bun:test";
import {
	getPaths,
	getRunners,
	readConfig,
	resolvePath,
} from "../../utilities/io.js";
import { error } from "../../utilities/log.js";

describe("IO contains utils to work upon files/folders.", () => {
	test("getPaths returns common paths", () => {
		expect(getPaths().root).not.toBeUndefined();
		expect(getPaths().runtime).toInclude("/bun"); // bun is the target runtime
	});

	test("getPaths returns home paths", async () => {
		expect(getPaths().home).toInclude((await $`whoami`.text()).trim());
		// @ts-expect-error: process.env.HOME may be undefined
		expect(getPaths().home).toBe(process.env.HOME);
	});

	test("getPaths erroring when process.env.HOME is undefined", async () => {
		mock.module("../../utilities/log.js", () => ({
			error: jest.fn(),
		}));

		const processExit = process.exit;
		// @ts-expect-error: vs
		process.exit = jest.fn();
		const originalHome = process.env.HOME;
		process.env.HOME = undefined;

		getPaths();
		expect(error as jest.Mock).toHaveBeenCalledTimes(1);

		process.env.HOME = originalHome;
		process.exit = processExit;
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

	test("readConfig return parsed ini config", () => {
		type TestConfig = {
			destination: string;
			backup: string[];
			list: {
				applications: string[];
				npm_ls_g: string;
			};
		};

		const parsedConfig = readConfig<TestConfig>(
			`${getPaths().root}/tests/utilities/config.mock.ini`,
		);

		expect(parsedConfig.destination).toBe("/path/to/destination");
		expect(parsedConfig.backup).toEqual([
			"/path/to/source_a ~ *.sql*",
			"/path/to/source_b ~ *.a.txt dir",
		]);
		expect(parsedConfig.list.applications).toEqual([
			"/Applications",
			"~/Applications",
		]);
		expect(parsedConfig.list.npm_ls_g).toBe("@`npm ls -g --depth=0`");
	});

	test("resolvePath wrap the node:path.resolve and deal better with ~", () => {
		expect(resolvePath("")).toBe(path.resolve(""));
		expect(resolvePath("")).toBe(path.resolve("."));
		expect(resolvePath(".")).toBe(path.resolve("."));
		expect(resolvePath("/some/file", "..")).toBe(
			path.resolve("/some/file", ".."),
		);
		expect(resolvePath("/some/file", "..")).toBe(path.resolve("/some"));
		expect(resolvePath("/some/path/~/backup/a")).toBe(
			`${getPaths().home}/backup/a`,
		);
		expect(resolvePath("~")).toBe(getPaths().home);
		expect(resolvePath("~/")).toBe(getPaths().home);
		expect(resolvePath("~/test.c")).toBe(`${getPaths().home}/test.c`);
		expect(resolvePath("~/backup", "../test")).toBe(`${getPaths().home}/test`);
	});
});
