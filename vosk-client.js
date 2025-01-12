const { Model, Recognizer } = require('node-vosk');

class VoskClient {
  constructor(modelPath) {
    this.model = new Model(modelPath);
  }

  async transcribe(audioData) {
    const recognizer = new Recognizer({ model: this.model, sampleRate: 8000 });
    recognizer.acceptWaveform(audioData);
    const result = recognizer.result();
    recognizer.free();
    return result.text;
  }
}

module.exports = { VoskClient };
