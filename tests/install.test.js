import { describe, beforeAll, afterAll, test, expect } from "bun:test";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { $ } from "bun";

const testsDirectory = path.resolve(
	import.meta.url.replace("file://", ""),
	"..",
);
const rootDirectory = path.resolve(testsDirectory, "..");
// eslint-disable-next-line no-undef
const runtimePath = Bun.argv[0];

describe("Installation script will generate shortcuts into the destion directory and it will make them executable.", () => {
	let runners;
	let generatedExecutables;

	beforeAll(async () => {
		await mkdir(`${testsDirectory}/temp`);
		await $`${runtimePath} ${rootDirectory}/index.js install --destination ${testsDirectory}/temp`;

		runners = (await $`ls -A ${rootDirectory}/runners`.text())
			.split("\n")
			.filter(Boolean);

		generatedExecutables = (await $`ls -A ${testsDirectory}/temp`.text())
			.split("\n")
			.filter(Boolean);
	});

	afterAll(async () => {
		await $`rm -rf ${testsDirectory}/temp`;
	});

	test("Install will generate shortcuts for runners", () => {
		expect(generatedExecutables.length).not.toBe(0);
	});

	test("Count of runners is same as count of generated executables without installation script", () => {
		expect(runners.length - 1).toBe(generatedExecutables.length);
	});

	test("Generated shortcut is executable", async () => {
		expect(
			(await $`${testsDirectory}/temp/tsum -s -a 1 -b 2`.text())
				.split("\n")
				.slice(0, -1),
		).toEqual(["tsum result", "1 + 2 = 3"]);
	});
});

test("Install sctipt has help option", async () => {
	expect(
		(await $`${runtimePath} ${rootDirectory}/index.js install --help`.text())
			.split("\n")
			.slice(0, -1),
	).not.toBeEmpty();
});
