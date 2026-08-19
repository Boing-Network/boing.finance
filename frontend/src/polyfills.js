import { Buffer } from 'buffer';

const root = typeof globalThis !== 'undefined' ? globalThis : window;
root.Buffer = root.Buffer || Buffer;
root.global = root.global || root;
