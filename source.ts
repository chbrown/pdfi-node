import {openSync, readSync, fstatSync, closeSync} from 'fs';
import {Buffer as LexingBuffer, Source} from 'lexing';

export class FileSystemSource implements Source {
  /**
  `fd` refers to an open file descriptor available to the current process.
  */
  constructor(private fd: number) { }

  static open(path: string): FileSystemSource {
    const fd = openSync(path, 'r');
    return new FileSystemSource(fd);
  }

  get size(): number {
    return fstatSync(this.fd).size;
  }

  /**
  Calls fs.readSync on the underlying file descriptor with pretty much the same
  argument signature.

  Returns `bytesRead`, the number of bytes that were read into the given Buffer.

  Node.js documentation for fs.read() / fs.readSync():
  > position is an integer specifying where to begin reading from in the file.
  > If position is null, data will be read from the current file position.
  */
  read(buffer: LexingBuffer, offset: number, length: number, position: number): number {
    return readSync(this.fd, <any>buffer, offset, length, position);
  }

  /**
  Read `length` bytes of the underlying file as a Buffer. May return a
  Buffer shorter than `length` iff EOF has been reached.
  */
  readBuffer(length: number, position: number): LexingBuffer {
    let buffer = new Buffer(length);
    if (length === 0) {
      return buffer;
    }
    const bytesRead = readSync(this.fd, buffer, 0, length, position);
    if (bytesRead < length) {
      buffer = buffer.slice(0, bytesRead);
    }
    return <any>buffer;
  }

  close(): void {
    closeSync(this.fd);
  }
}
