import { describe, beforeAll, afterAll, test, expect } from "bun:test";
import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { getPaths } from "../utilities/io";

const paths = getPaths();

describe("Installation script will generate shortcuts into the destion directory and it will make them executable.", () => {
	let runners;
	let generatedExecutables;

	beforeAll(async () => {
		await mkdir(`${paths.root}/tests/temp-install`);
		await $`${paths.runtime} ${paths.root}/index.js install --destination ${paths.root}/tests/temp-install`;

		runners = (await $`ls -A ${paths.root}/runners`.text())
			.split("\n")
			.filter(Boolean);

		generatedExecutables = (
			await $`ls -A ${paths.root}/tests/temp-install`.text()
		)
			.split("\n")
			.filter(Boolean);
	});

	afterAll(async () => {
		await $`rm -rf ${paths.root}/tests/temp-install`;
	});

	test("Install will generate shortcuts for runners", () => {
		expect(generatedExecutables.length).not.toBe(0);
	});

	test("Count of runners is same as count of generated executables without installation script", () => {
		expect(runners.length - 1).toBe(generatedExecutables.length);
	});

	test("Generated shortcut is executable", async () => {
		expect(
			await $`${paths.root}/tests/temp-install/tsum -s -a 1 -b 2`.text(),
		).toBe("[success] 1 + 2 = 3\n");
	});
});

test("Install sctipt has help option", async () => {
	expect(
		(await $`${paths.runtime} ${paths.root}/index.js install --help`.text())
			.split("\n")
			.slice(0, -1),
	).not.toBeEmpty();
});
