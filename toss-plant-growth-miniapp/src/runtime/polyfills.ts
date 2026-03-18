import { Buffer } from 'buffer';

const runtimeGlobal = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer;
};

if (runtimeGlobal.Buffer == null) {
  runtimeGlobal.Buffer = Buffer;
}
