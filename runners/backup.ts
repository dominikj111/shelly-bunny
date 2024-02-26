// import { $, chalk, sleep } from "zx";
// import cliProgress from "cli-progress";

// $.verbose = false;

// if (myCustomArgv.help) {
// 	const help = await readFile("./assets/help.txt", "utf8");
// 	console.log(help);
// 	process.exit(0);
// }

// console.log(chalk.bold.blue("Hello world!"));

// const date = await $`date`;
// const output = await $`echo Current date is ${date}.`;

// console.log(output);

// create a new progress bar instance and use shades_classic theme
// const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

// start the progress bar with a total value of 200 and start value of 0
// bar1.start(200, 0);

// update the current value in your application..
// bar1.update(100);
// await sleep(500);
// bar1.update(150);
// await sleep(500);
// bar1.update(200);

// stop the progress bar

// bar1.stop();

export default function run() {
	// eslint-disable-next-line no-console
	// console.log("backup", arguments);
}

run.minimist = {
	boolean: ["help"],
	alias: {
		h: "help",
	},
};
