// Example program for the KlattSyn package.

import * as Fs from "node:fs";
import * as KlattSyn from "klatt-syn";
import * as WindowFunctions from "dsp-collection/signal/WindowFunctions";
import * as WavFileEncoder from "wav-file-encoder";

export function fadeAudioSignalInPlace (samples: Float64Array, fadeMargin: number) {
   const windowFunction = WindowFunctions.hannWindow;
   const d = Math.min(samples.length, 2 * fadeMargin);
   for (let i = 0; i < d / 2; i++) {
      const w = windowFunction(i / d);
      samples[i] *= w;
      samples[samples.length - 1 - i] *= w;
   }
}

function main() {

   const sampleRate = 44100;
   const glottalSourceType = KlattSyn.GlottalSourceType.impulsive;
   const mainParms: KlattSyn.MainParms = {sampleRate, glottalSourceType};
   const frameParmsA = [KlattSyn.demoFrameParms];
   const signalSamples = KlattSyn.generateSound(mainParms, frameParmsA);

   const fadingDuration = 0.05;
   fadeAudioSignalInPlace(signalSamples, fadingDuration * sampleRate);

   const wavFileData = WavFileEncoder.encodeWavFileFromArrays([signalSamples], sampleRate, WavFileEncoder.WavFileType.float32);
   const outputFileName = "example.wav";
   Fs.writeFileSync(outputFileName, Buffer.from(wavFileData));
   console.log(`Audio data written to file "${outputFileName}".`);
}

main();
