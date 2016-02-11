import {Source} from 'lexing';
import {FileSystemSource} from './source';

import {readSourceSync} from 'pdfi';

export function readFileSync(filename: string, options = {type: 'string'}) {
  const source: Source = FileSystemSource.open(filename);
  return readSourceSync(source, options);
}

/**
The callback's second argument, `data`,
depends on the passed options. If options is an empty object, null, or
undefined, data will be a string with newlines separating paragraphs.
*/
export function readFile(filename: string,
                         options = {type: 'string'},
                         callback: (error: Error, data: any) => void) {
  setImmediate(() => {
    const data = readFileSync(filename, options);
    callback(null, data);
  });
}
