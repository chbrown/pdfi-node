#!/usr/bin/env node
import * as optimist from 'optimist';
import {Level} from 'loge';
import * as chalk from 'chalk';

import {setLoggerLevel, simplify, PDF} from 'pdfi';
import {Model, IndirectReference, ContentStream, Catalog} from 'pdfi/models';

import {readFileSync} from '../index';

const stderr = (line: string) => process.stderr.write(`${chalk.magenta(line)}\n`);
const stdout = (line: string) => process.stdout.write(`${line}\n`);

interface Command {
  id: string;
  description: string;
  example?: [string, string];
  run: (filename: string, argv: any) => void;
}
const commands: Command[] = [
  {
    id: 'text',
    description: 'Extract text',
    run(filename: string) {
      const text = readFileSync(filename, {type: 'string'});
      stdout(text);
    }
  },
  {
    id: 'paper',
    description: 'Extract text as an academia.Paper (JSON format)',
    run(filename: string) {
      const pdf = readFileSync(filename, {type: 'paper'});
      stdout(JSON.stringify(pdf));
    },
  },
  {
    id: 'metadata',
    description: 'Print trailer as JSON',
    run(filename: string) {
      const pdf: PDF = readFileSync(filename, {type: 'pdf'});
      const {Size, Root, Info} = pdf.trailer;
      for (let key in Info) {
        Info[key] = new Model(pdf, Info[key]).object;
      }
      stdout(JSON.stringify({Size, Root: Root.toJSON(), Info: simplify(Info)}));
    },
  },
  {
    id: 'xref',
    description: 'Print cross references as JSON',
    run(filename: string) {
      const cross_references = readFileSync(filename, {type: 'xref'});
      stdout(JSON.stringify(cross_references));
    },
  },
  {
    id: 'objects',
    description: 'Print specific objects',
    example: ['pdfi objects Sci.pdf 1 14:0 106', 'print objects "1:0", "14:0", and "106:0"'],
    run(filename: string, argv: any) {
      const pdf: PDF = readFileSync(filename, {type: 'pdf'});
      const args: string[] = argv._.slice(2);
      const references = args.map(IndirectReference.fromString);
      references.forEach(reference => {
        const cross_reference = pdf.findCrossReference(reference.object_number, reference.generation_number);
        stderr(`${reference.toString()} [offset=${cross_reference.offset}]`);
        const object = new Model(pdf, reference).object;

        if (argv.decode && ContentStream.isContentStream(object)) {
          // the buffer getter handles all the decoding
          const buffer = new ContentStream(pdf, object).buffer;
          process.stdout.write(buffer);
        }
        else {
          const objectJSON = simplify(object);
          stdout(JSON.stringify(objectJSON));
        }
      });
    },
  },
];

export function main() {
  let argvparser = optimist
  .options({
    help: {
      alias: 'h',
      describe: 'print this help message',
      type: 'boolean',
    },
    verbose: {
      alias: 'v',
      describe: 'print extra output',
      type: 'boolean',
    },
    version: {
      describe: 'print version',
      type: 'boolean',
    },
    decode: {
      describe: 'decode content streams',
      type: 'boolean',
    },
  })
  .string('_');

  // TODO: also handle command.example
  // if (command.example) {
  //   const [cmd, desc] = command.example;
  //   argvparser = argvparser.example(cmd, desc);
  // }
  const usage = [
    'Usage: pdfi <command> <filename> [<args>]',
    '',
    'Commands:',
    ...commands.map(command => `  ${command.id}: ${command.description}`),
  ].join('\n');
  argvparser = argvparser.usage(usage);

  let argv = argvparser.argv;
  setLoggerLevel(argv.verbose ? Level.debug : Level.info);
  if (argv.verbose) {
    // if set to verbose, use chalk regardless of whether stdout is a TTY
    (chalk as any).enabled = true;
  }

  if (argv.help) {
    argvparser.showHelp();
  }
  else if (argv.version) {
    const package_metadata = require('pdfi/package');
    console.log(package_metadata.version);
  }
  else {
    argv = argvparser.demand(2).argv;
    const [command_id, filename] = argv._;
    const command = commands.filter(command => command.id === command_id)[0];
    if (command === undefined) {
      stderr(`Unrecognized command: "${command_id}"`);
      argvparser.showHelp();
      process.exit(1);
    }
    command.run(filename, argv);
  }
}

if (require.main === module) {
  main();
}
