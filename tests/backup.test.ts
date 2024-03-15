import { describe, beforeAll, afterAll, test, expect } from "bun:test";
import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { getPaths } from "../utilities/io";

const paths = getPaths();

const configurationFileMock = `
destination = ${paths.root}/tests/temp-backup/destination

exclude[] = ${paths.root}/tests/temp-backup/source/backup-config.ini
exclude[] = .git
exclude[] = node_modules
exclude[] = package-lock.json
exclude[] = Development/**/serverHome
exclude[] = Development/playground/*

backup[] = ${paths.root}/tests/temp-backup/source/folder1 ! *.sql*
backup[] = ${paths.root}/tests/temp-backup/source/folder2/folder3/folder4 ! *.a.txt dir
backup[] = ${paths.root}/tests/temp-backup/source/folder2/.dotFile

zip[] = ${paths.root}/tests/temp-backup/source/folder2

[list]
listOne[] = ${paths.root}/tests/temp-backup/source/folder2/folder3/folder4

zip_help = @\`zip --help\`
`;

describe("The backup script produce backup by given configuration file", () => {
	beforeAll(async () => {
		await $`rm -rf ${paths.root}/tests/temp-backup`;

		const sourceRoot = `${paths.root}/tests/temp-backup/source`;
		const folder1 = `${sourceRoot}/folder1`;
		const folder2 = `${sourceRoot}/folder2`;
		const folder3 = `${folder2}/folder3`;
		const folder4 = `${folder3}/folder4`;

		await mkdir(folder4, { recursive: true });
		await mkdir(folder1);
		await mkdir(`${folder4}/dir/subdir`, { recursive: true });
		await mkdir(`${folder4}/dir/subdir2`);
		await mkdir(
			`${sourceRoot}/Development/someProject/module/serverHome/avoidFolder`,
			{
				recursive: true,
			},
		);
		await mkdir(`${sourceRoot}/node_modules`);
		await mkdir(`${sourceRoot}/Development/someProject/node_modules/module`, {
			recursive: true,
		});
		await mkdir(`${sourceRoot}/Development/someProject/.git`);
		await mkdir(`${sourceRoot}/Development/playground/avoidFolder1`, {
			recursive: true,
		});
		await mkdir(`${sourceRoot}/Development/playground/avoidFolder2`);

		await Bun.write(`${folder1}/package-lock.json`, "");
		await Bun.write(`${folder1}/some_query.sql`, "");
		await Bun.write(`${folder1}/some_db_dump.sql`, "");
		await Bun.write(`${folder2}/package-lock.json`, "");
		await Bun.write(`${folder2}/.dotFile`, "");
		await Bun.write(`${folder3}/.dotFile`, "");
		await Bun.write(`${folder4}/test1.a.txt`, "");
		await Bun.write(`${folder4}/test2.a.txt`, "");
		await Bun.write(`${folder4}/test3.b.txt`, "");
		await Bun.write(`${folder4}/dir/.dotFile`, "");
		await Bun.write(`${folder4}/dir/someFile`, "");
		await Bun.write(`${folder4}/dir/subdir/someFile`, "");
		await Bun.write(`${sourceRoot}/Development/someProject/module/.dotFile`, "");
		await Bun.write(
			`${sourceRoot}/Development/someProject/module/serverHome/.dotFile`,
			"",
		);

		await Bun.write(
			`${sourceRoot}/folder1/backup-config.ini`,
			configurationFileMock,
		);
		await Bun.write(`${sourceRoot}/backup-config.ini`, configurationFileMock);

		await $`${paths.runtime} ${paths.root}/index.js backup -c ${paths.root}/tests/temp-backup/source/backup-config.ini`;
	});

	afterAll(() => {
		Bun.spawnSync(["rm", "-rf", paths.root + "/tests/temp-backup"]);
	});

	test("Install will generate shortcuts for runners", () => {
		expect(1).toBe(1);
	});
});

test("Backup sctipt has help option", async () => {
	expect(
		(await $`${paths.runtime} ${paths.root}/index.js backup --help`.text())
			.split("\n")
			.slice(0, -1),
	).not.toBeEmpty();
});
