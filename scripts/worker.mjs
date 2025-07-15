// worker.mjs
import { parentPort, workerData } from 'worker_threads';
import { turboAlgorithm } from '../dist/turbo-algorithm.js';

try {
  const result = turboAlgorithm(workerData.box, workerData.container);
  parentPort.postMessage(result);
} catch (err) {
  parentPort.postMessage({ error: err.message || String(err) });
}
