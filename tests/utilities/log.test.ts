import { error, warn, log, success } from "../../utilities/log";
import {
	describe,
	beforeAll,
	afterAll,
	test,
	expect,
	jest,
	mock,
} from "bun:test";

describe("error, warn, log and success are defined each calls the console.log with multiple arguments", () => {
	let originalConsoleLog;

	beforeAll(() => {
		mock.module("chalk", () => ({
			default: {
				yellow: jest.fn().mockImplementation(s => s),
				bold: {
					red: jest.fn().mockImplementation(s => s),
					green: jest.fn().mockImplementation(s => s),
				},
			},
		}));

		originalConsoleLog = global.console.log;

		global.console = {
			...global.console,
			log: jest.fn(),
		};
	});

	afterAll(() => {
		// TODO: check implementation
		// not implemented yet, see the https://github.com/oven-sh/bun/issues/1825
		// console.warn((global.console.log as Mock<any>).mock.calls)
		// \u001B[33m[warn]\u001B[39m
		jest.restoreAllMocks();

		global.console.log = originalConsoleLog;
	});

	test("log", () => {
		log("aa", "bb", "cc");
		expect(global.console.log).toHaveBeenCalledWith("[log]", "aa", "bb", "cc");
	});

	test("warn", () => {
		warn("aa", "bb", "cc");
		expect(global.console.log).toHaveBeenCalledWith("[warn]", "aa", "bb", "cc");
	});

	test("error", () => {
		error("aa", "bb", "cc");
		expect(global.console.log).toHaveBeenCalledWith("[error]", "aa", "bb", "cc");
	});

	test("success", () => {
		success("aa", "bb", "cc");
		expect(global.console.log).toHaveBeenCalledWith(
			"[success]",
			"aa",
			"bb",
			"cc",
		);
	});
});
