// simple-processor.js
class SimpleProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
      const input = inputs[0];
      const output = outputs[0];
      for (let channel = 0; channel < input.length; channel++) {
          output[channel].set(input[channel]);
      }
      return true;
  }
}

registerProcessor('simple-processor', SimpleProcessor);
