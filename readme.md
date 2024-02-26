# Shelly Bunny

This is my personal effort to scripting faster, reliable and scalable with [bun.sh](https://bun.sh/) and it's [$ Shell](https://bun.sh/docs/runtime/shell) feature.

## Getting Started

1. fetch repository `git clone .../shelly-bunny.git && cd shelly-bunny`
2. install dependencies `bun install`
3. install executable shortcuts to preferred destination listen in the $PATH environment `bun run . install -d ~/personal-cli`
4. from any location, trigger the script `tsum -a 1 -b 2` to confirm the functionality

## Make own script

- Create the js/ts file according to available scripts in the ./runners directory.
- The assets directory contains files like `help.txt` used to display help by `-h` or `--help` options. This file is required.
- Export default function, what stand for the script entry point. Add the `minimist` property to the exported entry function as an arguments description proceed by the [minimist](https://www.npmjs.com/package/minimist).

Minimal example:

```(js)
export default function run() {}

run.minimist = {
 boolean: ["help"],
 alias: {
  h: "help",
 },
};
```

- To confirm there is not issue with the structure, run `bun run . tsum` example script to perform the checks (see below).
- Make unit tests and implements the script.
- Run the `bun run full-check` to perform eslint and prettier checks as well as the unit tests.

## Contribute :)

- [Issues](https://github.com/dominikj111/shelly-bunny/issues)

## Consistency checks

There are checks to confirm there is not forgotten script, help files are placed and minimist configurations are available.
The reason for this is to confirm consistency of the this project and confirm all script are well structured.

All scripts are checked any time any script is triggered. This may be avoided by passing the `--no-check` option.

In case of triggering the script via executable shortcut, not any check will be performed (check the `assets/install/template.sh`).

## TODO

- [ ] confirm all help assets are correct
- [ ] write documentation for functions
- [ ] generate docs ?
- [ ] implement backup
