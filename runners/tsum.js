import { error, success } from "../utilities/log";

export default function run({ a, b = 1, strict }) {
	if (strict && a === undefined) {
		error("'a' option is undefined");
		process.exit(1);
	}

	const sum = Number(a) + Number(b);
	success(`${a} + ${b} = ${sum}`);
}

run.minimist = {
	boolean: ["help", "strict"],
	string: ["a", "b"],
	alias: {
		h: "help",
		s: "strict",
	},
};
