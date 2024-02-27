/* eslint-disable no-console */

import chalk from "chalk";

type logableType = string | number | boolean | undefined | null;

/**
 * Does defined/formatted console.log
 */
export function log(...args: logableType[]) {
	console.log("[log]", ...args);
}

/**
 * Does defined/formatted console.log
 */
export function error(...args: logableType[]) {
	console.log(chalk.bold.red("[error]"), ...args);
}

/**
 * Does defined/formatted console.log
 */
export function warn(...args: logableType[]) {
	console.log(chalk.yellow("[warn]"), ...args);
}

/**
 * Does defined/formatted console.log
 */
export function success(...args: logableType[]) {
	console.log(chalk.bold.green("[success]"), ...args);
}
