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
	findCommonLeftSequence,
} from "../../utilities/backup.extras";
import { error } from "../../utilities/log";

test("'breakToPathsAndExcludes' allows to break backup path to path and excludes", () => {
	expect(breakToPathsAndExcludes(["path ! exclude1 exclude2"])).toEqual([
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

test("'findCommonLeftSequence' find same starting sequence", () => {
	const input = ["apple", "appetizer", "application"];
	const result = findCommonLeftSequence(input);
	expect(result).toBe("app");
});

test("'findCommonLeftSequence' respets last sequence", () => {
	const input = [
		"apple/apple/apple",
		"apple/apple/appetizer",
		"apple/apple/application",
	];

	expect(findCommonLeftSequence(input)).toBe("apple/apple/app");
	expect(findCommonLeftSequence(input, { stopAfterLastSequence: "le/" })).toBe(
		"apple/apple/",
	);
	expect(findCommonLeftSequence(input, { stopAfterLastSequence: "lion/" })).toBe(
		"apple/apple/app",
	);
});

describe("'processInitials' accepts backup props and returns backup app relevant initials config", () => {
	const configExistsMock = jest.fn();
	const readConfigMock = jest.fn();
	const bunWhichMock = jest.fn();

	const processExit = process.exit;
	const bunWhich = Bun.which;

	beforeEach(() => {
		mock.module("node:fs", () => ({
			existsSync: configExistsMock,
		}));

		mock.module("../../utilities/io", () => ({
			readConfig: readConfigMock,
		}));

		mock.module("../../utilities/log", () => ({
			error: jest.fn().mockImplementation(m => {
				throw new Error(m);
			}),
		}));

		// @ts-expect-error: mock not same type
		process.exit = jest.fn();

		Bun.which = bunWhichMock;
	});

	afterEach(() => {
		process.exit = processExit;
		Bun.which = bunWhich;
	});

	it("errors if the config path is not provided or the config file doesn't exist", () => {
		configExistsMock.mockReturnValue(false);

		expect(() =>
			processInitials({
				config: "/path/to/backup.config.ini",
			}),
		).toThrow();

		// @ts-expect-error: passing incorect props
		expect(() => processInitials({})).toThrow();

		expect(() =>
			processInitials({
				config: "",
			}),
		).toThrow();
	});

	it("errors if rsync or zip commands are not found", () => {
		configExistsMock.mockReturnValue(true);
		readConfigMock.mockReturnValue({ destination: "/some/path/destination" });

		const whichOriginal = Bun.which;
		const whichMock = jest.fn();
		Bun.which = whichMock;

		whichMock.mockImplementation(s => (s === "rsync" ? null : "test/path"));

		expect(() =>
			processInitials({
				config: "/path/to/backup.config.ini",
			}),
		).toThrow(new Error("rsync not found!"));

		whichMock.mockImplementation(s => (s === "zip" ? null : "test/path"));

		expect(() =>
			processInitials({
				config: "/path/to/backup.config.ini",
			}),
		).toThrow(new Error("zip not found!"));

		Bun.which = whichOriginal;
	});

	describe("Given the config", () => {
		it("errors if backup destination doesn't exist in config nor provided", () => {
			configExistsMock.mockReturnValue(true);

			expect(() =>
				processInitials({
					config: "/path/to/backup.config.ini",
				}),
			).toThrow();

			expect(() =>
				processInitials({
					config: "/path/to/backup.config.ini",
					destination: "",
				}),
			).toThrow();
		});

		it("passes if backup destination is available in config or props", () => {
			configExistsMock.mockReturnValue(true);

			expect(() =>
				processInitials({
					config: "/path/to/backup.config.ini",
					destination: "/some/path/destination",
				}),
			).not.toThrow();

			readConfigMock.mockReturnValue({ destination: "/some/path/destination" });

			expect(() =>
				processInitials({
					config: "/path/to/backup.config.ini",
				}),
			).not.toThrow();
		});
	});
});
