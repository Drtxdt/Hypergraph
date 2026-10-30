import { calculate } from "./tool-operations";
self.onmessage = ({ data }) => {
  try {
    self.postMessage({
      id: data.id,
      output: calculate(data.operation, data.input),
    });
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
