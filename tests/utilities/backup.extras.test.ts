import {
	test,
	expect,
	jest,
	mock,
	describe,
	it,
	beforeEach,
	afterEach,
} from "bun:test";
import {
	breakToPathsAndExcludes,
	resolveBackupPath,
	processInitials,
} from "../../utilities/backup.extras";
import { error } from "../../utilities/log";
// import { existsSync } from "node:fs";

test("'breakToPathsAndExcludes' allows to break backup path to path and excludes", () => {
	expect(breakToPathsAndExcludes(["path ~ exclude1 exclude2"])).toEqual([
		{ path: "path", excludes: ["exclude1", "exclude2"] },
	]);
});

test("'resolveBackupPath' removes special start sequences and replace ~ by provided home alias", () => {
	expect(resolveBackupPath("/some/absolute/path/o/file.zip")).toBe(
		"some/absolute/path/o/file.zip",
	);

	expect(resolveBackupPath("~/o/file.zip")).toBe("home_folder/o/file.zip");
	expect(resolveBackupPath("./o/file.zip")).toBe("o/file.zip");
});

test("'resolveBackupPath' allows to pass custom home alias", () => {
	expect(resolveBackupPath("~/o/file.zip", "home_folder_2")).toBe(
		"home_folder_2/o/file.zip",
	);
});

test("'resolveBackupPath' denies to process path with ~ or .. in the middle", () => {
	mock.module("../../utilities/log.js", () => ({
		error: jest.fn(),
	}));

	const processExit = process.exit;
	// @ts-expect-error: mock not same type
	process.exit = jest.fn();

	resolveBackupPath("~/o/~/file.zip", "home_folder_2");
	resolveBackupPath("o/~/file.zip", "home_folder_2");
	resolveBackupPath("/o/../file.zip", "home_folder_2");

	expect(error as jest.Mock).toHaveBeenCalledTimes(3);

	process.exit = processExit;

	// TODO: not working, check the tests/utilities/log.test.ts
	// (error as jest.Mock).mockRestore();
	jest.restoreAllMocks();
});

describe("'processInitials' accepts backup props and returns backup app relevant initials config", () => {
	const configExists = false;
	const processExit = process.exit;

	beforeEach(() => {
		mock.module("node:fs", () => ({
			default: {
				existsSync: jest.fn().mockReturnValue(configExists),
			},
		}));

		// @ts-expect-error: mock not same type
		process.exit = jest.fn();

		mock.module("../../utilities/log.js", () => ({
			error: jest.fn().mockImplementation(() => {
				throw new Error();
			}),
		}));
	});

	afterEach(() => {
		process.exit = processExit;
	});

	it("errors if config path doesn't exist", () => {
		expect(() =>
			processInitials({
				config: "/path/to/backup.config.ini",
			}),
		).toThrow();
	});
});
