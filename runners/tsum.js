import chalk from "chalk";

export default function run({ a, b = 1, strict }) {
	if (strict && a === undefined) {
		// eslint-disable-next-line no-console
		console.log(chalk.red("[a] is undefined"));
		process.exit(1);
	}

	const sum = Number(a) + Number(b);

	// eslint-disable-next-line no-console
	console.log("tsum result");
	// eslint-disable-next-line no-console
	console.log(`${a} + ${b} = ${chalk.green.bold(sum)}`);
}

run.minimist = {
	boolean: ["help", "strict"],
	string: ["a", "b"],
	alias: {
		h: "help",
		s: "strict",
	},
};
