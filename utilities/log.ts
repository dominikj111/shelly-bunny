/* eslint-disable no-console */

import chalk from "chalk";

type logableType = string | number | boolean | undefined | null;

export function log(...args: logableType[]) {
	console.log("[log]", ...args);
}

export function error(...args: logableType[]) {
	console.log(chalk.bold.red("[error]"), ...args);
}

export function warn(...args: logableType[]) {
	console.log(chalk.yellow("[warn]"), ...args);
}

export function success(...args: logableType[]) {
	console.log(chalk.bold.green("[success]"), ...args);
}
