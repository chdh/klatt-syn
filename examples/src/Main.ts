// Example program for the KlattSyn package.

import * as KlattSyn from "klatt-syn";
import * as WindowFunctions from "dsp-collection/signal/WindowFunctions";
import * as WavFileEncoder from "wav-file-encoder";
import * as Fs from "node:fs";

function fadeAudioSignalInPlace (samples: Float64Array, fadeMargin: number) {
   const windowFunction = WindowFunctions.hannWindow;
   const d = Math.min(samples.length, 2 * fadeMargin);
   for (let i = 0; i < d / 2; i++) {
      const w = windowFunction(i / d);
      samples[i] *= w;
      samples[samples.length - 1 - i] *= w;
   }
}

function main() {

   // Generate vowel sound signal.
   const sampleRate = 44100;
   const glottalSourceType = KlattSyn.GlottalSourceType.impulsive;
   const mainParms: KlattSyn.MainParms = {sampleRate, glottalSourceType};
   const frameParms = KlattSyn.demoFrameParms;
   const signalSamples = KlattSyn.generateSound(mainParms, [frameParms]);

   // Apply fade-in / fade-out.
   const fadingDuration = 0.05;                                                // 50 ms fade-in and fade-out
   fadeAudioSignalInPlace(signalSamples, fadingDuration * sampleRate);

   // Write output to WAV file.
   const wavFileData = WavFileEncoder.encodeWavFileFromArrays([signalSamples], sampleRate, WavFileEncoder.WavFileType.float32);
   const outputFileName = "example.wav";
   Fs.writeFileSync(outputFileName, Buffer.from(wavFileData));

   console.log(`Audio data written to file "${outputFileName}".`);
}

main();
