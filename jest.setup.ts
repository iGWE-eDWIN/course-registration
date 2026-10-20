import '@testing-library/jest-dom';

// jsdom lacks structuredClone; the app only clones plain JSON data
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}
