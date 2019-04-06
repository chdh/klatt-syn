//--- Filters ------------------------------------------------------------------

// A first-order IIR LP filter.
//
// Formulas:
//  Variables:
//    x = input samples
//    y = output samples
//    a = first filter coefficient
//    b = second filter coefficient, >0 for LP filter, <0 for HP filter
//    f = frequency in Hz
//    w = 2 * PI * f / sampleRate
//    g = gain at frequency f
//  Filter function:
//    y[n] = a * x[n] + b * y[n-1]
//  Frequency response:
//    |H(f)| = a / sqrt(1 - 2b * cos(w) + b^2)
//  Gain at DC:
//    |H(0)| = a / sqrt(1 - 2b * cos(0) + b^2)
//           = a / sqrt(1 - 2b + b^2)
//           = a / (1 - b)                                 for b < 1
//  Cutoff frequency for LP filter (frequency with relative gain 0.5, about -3 dB):
//    |H(fCutoff)| = |H(0)| / 2
//    a / sqrt(1 - 2b * cos(w) + b^2) = a / (2 * (1 - b))
//    fCutoff = acos((-3b^2 + 8b - 3) / 2b) * sampleRate / (2 * PI)
//  Determine b for a given gain g at frequency f and |H(0)| = 1:
//    a = 1 - b
//    g = (1 - b) / sqrt(1 - 2b * cos(w) + b^2)
//    g * sqrt(1 - 2b * cos(w) + b^2) = 1 - b
//    g^2 * (1 - 2b * cos(w) + b^2) = 1 - 2b + b^2
//    (g^2 - 1) * b^2  +  2 * (1 - g^2 * cos(w)) * b  +  g^2 - 1  =  0
//    b^2  +  2 * (1 - g^2 * cos(w)) / (g^2 - 1) * b  +  1  =  0
//    Substitute: q = (1 - g^2 * cos(w)) / (1 - g^2)
//    b^2 - 2 * q * b + 1 = 0
//    b = q - sqrt(q^2 - 1)                                or q + sqrt(q^2 - 1)
class LpFilter1 {

   private sampleRate:       number;
   private a:                number;                       // filter coefficient a
   private b:                number;                       // filter coefficient b
   private y1:               number;                       // y[n-1], last output value
   private passthrough:      boolean;
   private muted:            boolean;

   // @param sampleRate
   //    Sample rate in Hz.
   constructor (sampleRate: number) {
      this.sampleRate = sampleRate;
      this.y1 = 0;
      this.passthrough = true;
      this.muted = false; }

   // Adjusts the filter parameters without resetting the inner state.
   // @param f
   //    Frequency at which the gain is specified.
   // @param g
   //    Gain at frequency f. Between 0 and 1 for LP filter. Greater than 1 for HP filter.
   // @param extraGain
   //    Extra gain factor. This is the resulting DC gain.
   //    The resulting gain at `f` will be `g * extraGain`.
   public set (f: number, g: number, extraGain = 1) {
      if (f <= 0 || f >= this.sampleRate / 2 || g <= 0 || g >= 1 || !isFinite(f) || !isFinite(g) || !isFinite(extraGain)) {
         throw new Error("Invalid filter parameters."); }
      const w = 2 * Math.PI * f / this.sampleRate;
      const q = (1 - g ** 2 * Math.cos(w)) / (1 - g ** 2);
      this.b = q - Math.sqrt(q ** 2 - 1);
      this.a = (1 - this.b) * extraGain;
      this.passthrough = false;
      this.muted = false; }

   public setPassthrough() {
      this.passthrough = true;
      this.muted = false;
      this.y1 = 0; }

   public setMute() {
      this.passthrough = false;
      this.muted = true;
      this.y1 = 0; }

   // Performs a filter step.
   // @param x
   //    Input signal value.
   // @returns
   //    Output signal value.
   public step (x: number) : number {
      if (this.passthrough) {
         return x; }
      if (this.muted) {
         return 0; }
      const y = this.a * x + this.b * this.y1;
      this.y1 = y;
      return y; }}

// A Klatt resonator.
// This is a second order IIR filter.
// With f=0 it can also be used as a low-pass filter.
//
// Formulas:
//  Variables:
//    x = input samples
//    y = output samples
//    a/b/c = filter coefficients
//    f = frequency in Hz
//    w = 2 * PI * f / sampleRate
//    f0 = resonator frequency in Hz
//    w0 = 2 * PI * f0 / sampleRate
//    bw = Bandwidth in Hz
//    r = exp(- PI * bw / sampleRate)
//  Filter function:
//    y[n] = a * x[n] + b * y[n-1] + c * y[n-2]
//  Frequency response:
//    |H(f)| = a / ( sqrt(1 + r^2 - 2 * r * cos(w - w0)) * sqrt(1 + r^2 - 2 * r * cos(w + w0)) )
//  Gain at DC:
//    |H(0)| = a / ( sqrt(1 + r^2 - 2 * r * cos(0 - w0)) * sqrt(1 + r^2 - 2 * r * cos(0 + w0)) )
//           = a / (1 + r^2 - 2 * r * cos(w0))
//           = a / (1 - c - b)
//  Gain at the resonance frequency:
//    |H(f0)| = a / sqrt(1 + r^2 - 2 * r)
//            = a / (1 - r)
class Resonator {

   private sampleRate:       number;
   private a:                number;                       // filter coefficient a
   private b:                number;                       // filter coefficient b
   private c:                number;                       // filter coefficient c
   private y1:               number;                       // y[n-1], last output value
   private y2:               number;                       // y[n-2], second-last output value
   private r:                number;
   private passthrough:      boolean;
   private muted:            boolean;

   // @param sampleRate
   //    Sample rate in Hz.
   constructor (sampleRate: number) {
      this.sampleRate = sampleRate;
      this.y1 = 0;
      this.y2 = 0;
      this.passthrough = true;
      this.muted = false; }

   // Adjusts the filter parameters without resetting the inner state.
   // @param f
   //    Frequency of resonator in Hz. May be 0 for LP filtering.
   // @param bw
   //    Bandwidth of resonator in Hz.
   // @param dcGain
   //    DC gain level.
   public set (f: number, bw: number, dcGain = 1) {
      if (f < 0 || f >= this.sampleRate / 2 || bw <= 0 || dcGain <= 0 || !isFinite(f) || !isFinite(bw) || !isFinite(dcGain)) {
         throw new Error("Invalid resonator parameters."); }
      this.r = Math.exp(- Math.PI * bw / this.sampleRate);
      const w = 2 * Math.PI * f / this.sampleRate;
      this.c = - (this.r ** 2);
      this.b = 2 * this.r * Math.cos(w);
      this.a = (1 - this.b - this.c) * dcGain;
      this.passthrough = false;
      this.muted = false; }

   public setPassthrough() {
      this.passthrough = true;
      this.muted = false;
      this.y1 = 0;
      this.y2 = 0; }

   public setMute() {
      this.passthrough = false;
      this.muted = true;
      this.y1 = 0;
      this.y2 = 0; }

   public adjustImpulseGain (newA: number) {
      this.a = newA; }

   public adjustPeakGain (peakGain: number) {
      if (peakGain <= 0 || !isFinite(peakGain)) {
         throw new Error("Invalid resonator peak gain."); }
      this.a = peakGain * (1 - this.r); }

   // Performs a filter step.
   // @param x
   //    Input signal value.
   // @returns
   //    Output signal value.
   public step (x: number) : number {
      if (this.passthrough) {
         return x; }
      if (this.muted) {
         return 0; }
      const y = this.a * x + this.b * this.y1 + this.c * this.y2;
      this.y2 = this.y1;
      this.y1 = y;
      return y; }}

// A Klatt anti-resonator.
// This is a second order FIR filter.
//
// Formulas:
//  Variables:
//    x = input samples
//    y = output samples
//    a/b/c = filter coefficients
//    f = frequency in Hz
//    w = 2 * PI * f / sampleRate
//  Filter function:
//    y[n] = a * x[n] + b * x[n-1] + c * x[n-2]
class AntiResonator {

   private sampleRate:       number;
   private a:                number;                       // filter coefficient a
   private b:                number;                       // filter coefficient b
   private c:                number;                       // filter coefficient c
   private x1:               number;                       // x[n-1], last input value
   private x2:               number;                       // x[n-2], second-last input value
   private passthrough:      boolean;
   private muted:            boolean;

   // @param sampleRate
   //    Sample rate in Hz.
   constructor (sampleRate: number) {
      this.sampleRate = sampleRate;
      this.x1 = 0;
      this.x2 = 0;
      this.passthrough = true;
      this.muted = false; }

   // Adjusts the filter parameters without resetting the inner state.
   // @param f
   //    Frequency of anti-resonator in Hz.
   // @param bw
   //    bandwidth of anti-resonator in Hz.
   public set (f: number, bw: number) {
      if (f <= 0 || f >= this.sampleRate / 2 || bw <= 0 || !isFinite(f) || !isFinite(bw)) {
         throw new Error("Invalid anti-resonator parameters."); }
      const r = Math.exp(- Math.PI * bw / this.sampleRate);
      const w = 2 * Math.PI * f / this.sampleRate;
      const c = - (r * r);
      const b = 2 * r * Math.cos(-w);
      const a = 1 - b - c;
      if (a == 0) {
         this.a = 0;
         this.b = 0;
         this.c = 0;
         return; }
      this.a = 1 / a;
      this.b = - b / a;
      this.c = - c / a;
      this.passthrough = false;
      this.muted = false; }

   public setPassthrough() {
      this.passthrough = true;
      this.muted = false;
      this.x1 = 0;
      this.x2 = 0; }

   public setMute() {
      this.passthrough = false;
      this.muted = true;
      this.x1 = 0;
      this.x2 = 0; }

   // Performs a filter step.
   // @param x
   //    Input signal value.
   // @returns
   //    Output signal value.
   public step (x: number) : number {
      if (this.passthrough) {
         return x; }
      if (this.muted) {
         return 0; }
      const y = this.a * x + this.b * this.x1 + this.c * this.x2;
      this.x2 = this.x1;
      this.x1 = x;
      return y; }}

//--- Noise sources ------------------------------------------------------------

// Returns a random number within the range -1 .. 1.
function getWhiteNoise() : number {
   return Math.random() * 2 - 1; }                         // problem: -1 is included but +1 is not included

// A low-pass filtered noise source.
class LpNoiseSource {

   private lpFilter:         LpFilter1;

   constructor (sampleRate: number) {
      // The original program logic used a first order LP filter with a filter coefficient
      // of b=0.75 and a sample rate of 10 kHz.
      const oldB = 0.75;
      const oldSampleRate = 10000;
      // Compute the gain at 1000 Hz with a sample rate of 10 kHz and a DC gain of 1.
      const f = 1000;
      const g = (1 - oldB) / Math.sqrt(1 - 2 * oldB * Math.cos(2 * Math.PI * f / oldSampleRate) + oldB ** 2);
      const extraGain = 2.5 * (sampleRate / 10000) ** 0.33;          // compensate amplitude for output range -1 .. +1
      // Create an LP filter with the same characteristics but with our sampling rate.
      this.lpFilter = new LpFilter1(sampleRate);
      this.lpFilter.set(f, g, extraGain); }

   // Returns an LP-filtered random number.
   public getNext() : number {
      const x = getWhiteNoise();
      return this.lpFilter.step(x); }}

//--- Glottal sources ----------------------------------------------------------

// Generates a glottal source signal by LP filtering a pulse train.
class ImpulsiveGlottalSource {

   private sampleRate:       number;
   private resonator:        Resonator | undefined;        // resonator used as an LP filter
   private positionInPeriod: number;                       // current sample position within F0 period

   constructor (sampleRate: number) {
      this.sampleRate = sampleRate;
      this.resonator = undefined; }

   // @param openPhaseLength
   //    Duration of the open glottis phase of the F0 period, in samples.
   public startPeriod (openPhaseLength: number) {
      if (!openPhaseLength) {
         this.resonator = undefined;
         return; }
      if (!this.resonator) {
         this.resonator = new Resonator(this.sampleRate); }
      const bw = this.sampleRate / openPhaseLength;
      this.resonator.set(0, bw);
      this.resonator.adjustImpulseGain(1);
      this.positionInPeriod = 0; }

   public getNext() : number {
      if (!this.resonator) {
         return 0; }
      const pulse = (this.positionInPeriod == 1) ? 1 : (this.positionInPeriod == 2) ? -1 : 0;
      this.positionInPeriod++;
      return this.resonator.step(pulse); }}

// Generates a "natural" glottal source signal according to the KLGLOTT88 model.
// Formula of the glottal flow: t^2 - t^3
// Formula of the derivative: 2 * t - 3 * t^2
// The derivative is used as the glottal source.
//
// At the end of the open glottal phase there is an abrupt jump from the minimum value to zero.
// This jump is not smoothed in the classic Klatt model. In Praat this "collision phase" is smoothed.
class NaturalGlottalSource {

   private x:                number;                       // current signal value
   private a:                number;                       // current first derivative
   private b:                number;                       // current second derivative
   private openPhaseLength:  number;                       // open glottis phase length in samples
   private positionInPeriod: number;                       // current sample position within F0 period

   constructor() {
      this.startPeriod(0); }

   // @param openPhaseLength
   //    Duration of the open glottis phase of the F0 period, in samples.
   public startPeriod (openPhaseLength: number) {
      this.openPhaseLength = openPhaseLength;
      this.x = 0;
      const amplification = 5;
      this.b = - amplification / openPhaseLength ** 2;
      this.a = - this.b * openPhaseLength / 3;
      this.positionInPeriod = 0; }

   public getNext() : number {
      if (this.positionInPeriod++ >= this.openPhaseLength) {
         this.x = 0;
         return 0; }
      this.a += this.b;
      this.x += this.a;
      return this.x; }}

//------------------------------------------------------------------------------

// Modulates the fundamental frequency (F0).
//
// Sine-wave frequencies of 12.7, 7.1 and 4.7 Hz were chosen so as to ensure
// a long period before repetition of the perturbation that is introduced.
// A value of flutterLevel = 0.25 results in synthetic vowels with a quite
// realistic deviation from constant pitch.
//
// @param f0
//    Fundamental frequency.
// @param flutterLevel
//    Flutter level between 0 and 1.
// @param time
//    Relative signal position in seconds.
// @returns
//    Modulated fundamental frequency.
function performFrequencyModulation (f0: number, flutterLevel: number, time: number) : number {
   if (flutterLevel <= 0) {
      return f0; }
   const w = 2 * Math.PI * time;
   const a = Math.sin(12.7 * w) + Math.sin(7.1 * w) + Math.sin(4.7 * w);
   return f0 * (1 + a * flutterLevel / 50); }

// Convert a dB value into a linear value.
// dB values of -99 and below or NaN are converted to 0.
function dbToLin (db: number) : number {
   if (db <= -99 || isNaN(db)) {
      return 0; }
    else {
      return Math.pow(10, db / 20); }}

//--- Main logic ---------------------------------------------------------------

export const enum GlottalSourceType { impulsive, natural }
export const glottalSourceTypeEnumNames = ["impulsive", "natural"];

export const maxOralFormants = 6;

// Parameters for the whole sound.
export interface MainParms {
   sampleRate:                         number;                       // sample rate in Hz
   glottalSourceType:                  GlottalSourceType; }

// Parameters for a sound frame.
export interface FrameParms {
   duration:                           number;                       // frame duration in seconds
   f0:                                 number;                       // fundamental frequency in Hz
   flutterLevel:                       number;                       // F0 flutter level, 0 .. 1, typically 0.25
   openPhaseRatio:                     number;                       // relative length of the open phase of the glottis, 0 .. 1, typically 0.7
   breathinessDb:                      number;                       // breathiness in voicing (turbulence) in dB, positive to amplify or negative to attenuate
   tiltDb:                             number;                       // spectral tilt for glottal source in dB. Attenuation at 3 kHz in dB. 0 = no tilt.
   gainDb:                             number;                       // overall gain (output gain) in dB, positive to amplify or negative to attenuate
   nasalFormantFreq:                   number;                       // nasal formant frequency in Hz, or NaN
   nasalFormantBw:                     number;                       // nasal formant bandwidth in Hz, or NaN
   oralFormantFreq:                    number[];                     // oral format frequencies in Hz, or NaN
   oralFormantBw:                      number[];                     // oral format bandwidths in Hz, or NaN

   // Cascade branch:
   cascadeEnabled:                     boolean;                      // true = cascade branch enabled
   cascadeVoicingDb:                   number;                       // voicing amplitude for cascade branch in dB, positive to amplify or negative to attenuate
   cascadeAspirationDb:                number;                       // aspiration (glottis noise) amplitude for cascade branch in dB, positive to amplify or negative to attenuate
   cascadeAspirationMod:               number;                       // amplitude modulation factor for aspiration in cascade branch, 0 = no modulation, 1 = maximum modulation
   nasalAntiformantFreq:               number;                       // nasal antiformant frequency in Hz, or NaN
   nasalAntiformantBw:                 number;                       // nasal antiformant bandwidth in Hz, or NaN

   // Parallel branch:
   parallelEnabled:                    boolean;                      // true = parallel branch enabled
   parallelVoicingDb:                  number;                       // voicing amplitude for parallel branch in dB, positive to amplify or negative to attenuate
   parallelAspirationDb:               number;                       // aspiration (glottis noise) amplitude for parallel branch in dB, positive to amplify or negative to attenuate
   parallelAspirationMod:              number;                       // amplitude modulation factor for aspiration in parallel branch, 0 = no modulation, 1 = maximum modulation
   fricationDb:                        number;                       // frication noise level in dB
   fricationMod:                       number;                       // amplitude modulation factor for frication noise in parallel branch, 0 = no modulation, 1 = maximum modulation
   parallelBypassDb:                   number;                       // parallel bypass level in dB, used to bypass differentiated glottal and frication signals around resonators F2 to F6
   nasalFormantDb:                     number;                       // nasal formant level in dB
   oralFormantDb:                      number[]; }                   // oral format levels in dB, or NaN

// Variables of the currently active frame.
interface FrameState {
   breathinessLin:                     number;                       // linear breathiness level
   gainLin:                            number;                       // linear overall gain

   // Cascade branch:
   cascadeVoicingLin:                  number;                       // linear voicing amplitude for cascade branch
   cascadeAspirationLin:               number;                       // linear aspiration amplitude for cascade branch

   // Parallel branch:
   parallelVoicingLin:                 number;                       // linear voicing amplitude for parallel branch
   parallelAspirationLin:              number;                       // linear aspiration amplitude for parallel branch
   fricationLin:                       number;                       // linear frication noise level
   parallelBypassLin:                  number; }                     // linear parallel bypass level

// Variables of the currently active F0 period (aka glottal period).
interface PeriodState {                                              // F0 period state
   f0:                                 number;                       // modulated fundamental frequency for this period, in Hz, or 0
   periodLength:                       number;                       // period length in samples
   openPhaseLength:                    number;                       // open glottis phase length in samples
   // Per sample values:
   positionInPeriod:                   number;                       // current sample position within F0 period
   lpNoise:                            number; }                     // LP filtered noise

// Sound generator controller.
export class Generator {

   private mParms:                     MainParms;                    // main parameters
   private fParms:                     FrameParms;                   // currently active frame parameters
   private newFParms:                  FrameParms | undefined;       // new frame parameters for start of next F0 period
   private fState:                     FrameState;                   // frame variables
   private pState:                     PeriodState;                  // F0 period state variables
   private absPosition:                number;                       // current absolute sample position
   private tiltFilter:                 LpFilter1;                    // spectral tilt filter
   private outputLpFilter:             Resonator;                    // output low-pass filter
   private flutterTimeOffset:          number;                       // random value for flutter time offset

   // Glottal source:
   private impulsiveGSource:           ImpulsiveGlottalSource;
   private naturalGSource:             NaturalGlottalSource;
   private glottalSource:              () => number;                 // function which returns the next glottal source signal sample value

   // Noise sources:
   // (We use independent noise sources to avoid cancellation effects of correlated signals.)
   private aspirationSourceCasc:       LpNoiseSource;                // noise source for aspiration in cascade branch
   private aspirationSourcePar:        LpNoiseSource;                // noise source for aspiration in parallel branch
   private fricationSourcePar:         LpNoiseSource;                // noise source for frication in parallel branch

   // Cascade branch variables:
   private nasalFormantCasc:           Resonator;                    // nasal formant filter for cascade branch
   private nasalAntiformantCasc:       AntiResonator;                // nasal antiformant filter for cascade branch
   private oralFormantCasc:            Resonator[];                  // oral formant filters for cascade branch

   // Parallel branch variables:
   private nasalFormantPar:            Resonator;                    // nasal formant filter for parallel branch
   private oralFormantPar:             Resonator[];                  // oral formant filters for parallel branch
   private lastParallelSource:         number;                       // last parallel source value, used for primitive high-pass filtering

   constructor (mParms: MainParms) {
      this.mParms = mParms;
      this.fState = <FrameState>{};
      this.absPosition = 0;
      this.tiltFilter = new LpFilter1(mParms.sampleRate);
      this.flutterTimeOffset = Math.random() * 1000;
      this.outputLpFilter = new Resonator(mParms.sampleRate);
      this.outputLpFilter.set(0, mParms.sampleRate / 2);
      this.initGlottalSource();

      // Create noise sources:
      this.aspirationSourceCasc = new LpNoiseSource(mParms.sampleRate);
      this.aspirationSourcePar  = new LpNoiseSource(mParms.sampleRate);
      this.fricationSourcePar   = new LpNoiseSource(mParms.sampleRate);

      // Initialize cascade branch variables:
      this.nasalFormantCasc = new Resonator(mParms.sampleRate);
      this.nasalAntiformantCasc = new AntiResonator(mParms.sampleRate);
      this.oralFormantCasc = Array(maxOralFormants);
      for (let i = 0; i < maxOralFormants; i++) {
         this.oralFormantCasc[i] = new Resonator(mParms.sampleRate); }

      // Initialize parallel branch variables:
      this.nasalFormantPar = new Resonator(mParms.sampleRate);
      this.oralFormantPar = Array(maxOralFormants);
      for (let i = 0; i < maxOralFormants; i++) {
         this.oralFormantPar[i] = new Resonator(mParms.sampleRate); }
      this.lastParallelSource = 0; }

   // Generates a frame of the sound.
   // The length of the frame is specified by `outBuf.length` and `fParms.duration` is ignored.
   public generateFrame (fParms: FrameParms, outBuf: Float64Array) {
      if (fParms == this.fParms) {
         throw new Error("FrameParms structure must not be re-used."); }
      this.newFParms = fParms;
      for (let outPos = 0; outPos < outBuf.length; outPos++) {
         if (!this.pState || this.pState.positionInPeriod >= this.pState.periodLength) {
            this.startNewPeriod(); }
         outBuf[outPos] = this.computeNextOutputSignalSample();
         this.pState.positionInPeriod++;
         this.absPosition++; }}

   private computeNextOutputSignalSample() : number {
      const fParms = this.fParms;
      const fState = this.fState;
      const pState = this.pState;
      let voice = this.glottalSource();
      voice = this.tiltFilter.step(voice);                           // apply spectral tilt
      if (pState.positionInPeriod < pState.openPhaseLength) {        // if within glottal open phase
         voice += getWhiteNoise() * fState.breathinessLin; }         // add breathiness (turbulence)
      const cascadeOut  = fParms.cascadeEnabled  ? this.computeCascadeBranch(voice)  : 0;
      const parallelOut = fParms.parallelEnabled ? this.computeParallelBranch(voice) : 0;
      let out = cascadeOut + parallelOut;
      out = this.outputLpFilter.step(out);
      out *= fState.gainLin;
      return out; }

   private computeCascadeBranch (voice: number) : number {
      const fParms = this.fParms;
      const fState = this.fState;
      const pState = this.pState;
      const cascadeVoice = voice * fState.cascadeVoicingLin;
      const currentAspirationMod = (pState.positionInPeriod >= pState.periodLength / 2) ? fParms.cascadeAspirationMod : 0;
      const aspiration = this.aspirationSourceCasc.getNext() * fState.cascadeAspirationLin * (1 - currentAspirationMod);
      let v = cascadeVoice + aspiration;
      v = this.nasalAntiformantCasc.step(v);
      v = this.nasalFormantCasc.step(v);
      for (let i = 0; i < maxOralFormants; i++) {
         v = this.oralFormantCasc[i].step(v); }
      return v; }

   private computeParallelBranch (voice: number) : number {
      const fParms = this.fParms;
      const fState = this.fState;
      const pState = this.pState;
      const parallelVoice = voice * fState.parallelVoicingLin;
      const currentAspirationMod = (pState.positionInPeriod >= pState.periodLength / 2) ? fParms.parallelAspirationMod : 0;
      const aspiration = this.aspirationSourcePar.getNext() * fState.parallelAspirationLin * (1 - currentAspirationMod);
      const source = parallelVoice + aspiration;
      // Klatt (1980) states: "... using a first difference calculation to remove low-frequency energy from
      // the higher formants; this energy would otherwise distort the spectrum in the region of F1 during
      // the synthesis of some vowels."
      // A differencing filter is applied for H2 to H6 and the bypass.
      // This is a first-order FIR HP filter with the filter function:
      //    y[n] = x[n] - x[n-1]
      // The frequency response is:
      //    |H(f)| = sqrt(2 - 2 * cos(w))            with: w = 2 * PI * f / sampleRate
      // TODO: Compensate the effect of the sample rate.
      // A better solution would probably be to use real band-pass filters instead of resonators for the formants
      // in the parallel branch. Then this differencing filter would not be necessary to protect the low frequencies
      // of the low formants.
      const sourceDifference = source - this.lastParallelSource;
      this.lastParallelSource = source;
      const currentFricationMod = (pState.positionInPeriod >= pState.periodLength / 2) ? fParms.fricationMod : 0;
      const fricationNoise = this.fricationSourcePar.getNext() * fState.fricationLin * (1 - currentFricationMod);
      const source2 = sourceDifference + fricationNoise;
      let v = 0;
      v += this.nasalFormantPar.step(source);                        // nasal formant is directly applied to source
      v += this.oralFormantPar[0].step(source);                      // F1 is directly applied to source
      for (let i = 1; i < maxOralFormants; i++) {                    // F2 to F6
         const alternatingSign = (i % 2 == 0) ? 1 : -1;              // (refer to Klatt (1980) Fig. 13)
         v += alternatingSign * this.oralFormantPar[i].step(source2); }  // F2 to F6 are applied to source difference + frication
      v += fState.parallelBypassLin * source2;                       // bypass is applied to source difference + frication
      return v; }

   // Starts a new F0 period.
   private startNewPeriod() {
      if (this.newFParms) {
         // To reduce glitches, new frame parameters are only activated at the start of a new F0 period.
         this.fParms = this.newFParms;
         this.newFParms = undefined;
         this.startUsingNewFrameParameters(); }
      if (!this.pState) {
         this.pState = <PeriodState>{}; }
      const pState = this.pState;
      const mParms = this.mParms;
      const fParms = this.fParms;
      const flutterTime = this.absPosition / mParms.sampleRate + this.flutterTimeOffset;
      pState.f0 = performFrequencyModulation(fParms.f0, fParms.flutterLevel, flutterTime);
      pState.periodLength = (pState.f0 > 0) ? Math.round(mParms.sampleRate / pState.f0) : 1;
      pState.openPhaseLength = (pState.periodLength > 1) ? Math.round(pState.periodLength * fParms.openPhaseRatio) : 0;
      pState.positionInPeriod = 0;
      this.startGlottalSourcePeriod(); }

   private startUsingNewFrameParameters() {
      const mParms = this.mParms;
      const fParms = this.fParms;
      const fState = this.fState;
      fState.breathinessLin     = dbToLin(fParms.breathinessDb);
      fState.gainLin            = dbToLin(fParms.gainDb);
      if (!fParms.tiltDb) {
         this.tiltFilter.setPassthrough(); }
       else {
         this.tiltFilter.set(3000, dbToLin(-fParms.tiltDb)); }

      // Adjust cascade branch:
      fState.cascadeVoicingLin = dbToLin(fParms.cascadeVoicingDb);
      fState.cascadeAspirationLin = dbToLin(fParms.cascadeAspirationDb);
      if (fParms.nasalFormantFreq && fParms.nasalFormantBw) {
         this.nasalFormantCasc.set(fParms.nasalFormantFreq, fParms.nasalFormantBw); }
       else {
         this.nasalFormantCasc.setPassthrough(); }
      if (fParms.nasalAntiformantFreq && fParms.nasalAntiformantBw) {
         this.nasalAntiformantCasc.set(fParms.nasalAntiformantFreq, fParms.nasalAntiformantBw); }
       else {
         this.nasalAntiformantCasc.setPassthrough(); }
      for (let i = 0; i < maxOralFormants; i++) {
         const f =  (i < fParms.oralFormantFreq.length) ? fParms.oralFormantFreq[i] : NaN;
         const bw = (i < fParms.oralFormantBw.length)   ? fParms.oralFormantBw[i]   : NaN;
         if (f && bw) {
            this.oralFormantCasc[i].set(f, bw); }
          else {
            this.oralFormantCasc[i].setPassthrough(); }}

      // Adjust parallel branch:
      fState.parallelVoicingLin = dbToLin(fParms.parallelVoicingDb);
      fState.parallelAspirationLin = dbToLin(fParms.parallelAspirationDb);
      fState.fricationLin = dbToLin(fParms.fricationDb);
      fState.parallelBypassLin = dbToLin(fParms.parallelBypassDb);
      // Klatt used the following linear factors to adjust the levels of the parallel formant
      // resonators so that they have a similar effect as the cascade versions:
      //   F1: 0.4, F2: 0.15, F3: 0.06, F4: 0.04, F5: 0.022, F6: 0.03, Nasal: 0.6
      // We are not doing this here, because then the output of the parallel branch would no longer
      // match the specified formant levels. Instead, we use the specified value as the peak gain
      // instead of the DC gain.
      if (fParms.nasalFormantFreq && fParms.nasalFormantBw && dbToLin(fParms.nasalFormantDb)) {
         this.nasalFormantPar.set(fParms.nasalFormantFreq, fParms.nasalFormantBw);
         this.nasalFormantPar.adjustPeakGain(dbToLin(fParms.nasalFormantDb)); }
       else {
         this.nasalFormantPar.setMute(); }
      for (let i = 0; i < maxOralFormants; i++) {
         const formant = i + 1;
         const f =  (i < fParms.oralFormantFreq.length) ? fParms.oralFormantFreq[i] : NaN;
         const bw = (i < fParms.oralFormantBw.length)   ? fParms.oralFormantBw[i]   : NaN;
         const db = (i < fParms.oralFormantDb.length)   ? fParms.oralFormantDb[i]   : NaN;
         const peakGain = dbToLin(db);
         if (f && bw && peakGain) {
            this.oralFormantPar[i].set(f, bw);
            const w = 2 * Math.PI * f / mParms.sampleRate;
            const diffGain = Math.sqrt(2 - 2 * Math.cos(w));                     // gain of differencing filter
            const filterGain = (formant >= 2) ? peakGain / diffGain : peakGain;  // compensate differencing filter for F2 to F6
            this.oralFormantPar[i].adjustPeakGain(filterGain); }
          else {
            this.oralFormantPar[i].setMute(); }}}

   private initGlottalSource() {
      switch (this.mParms.glottalSourceType) {
         case GlottalSourceType.impulsive: {
            this.impulsiveGSource = new ImpulsiveGlottalSource(this.mParms.sampleRate);
            this.glottalSource = () => this.impulsiveGSource.getNext();
            break; }
         case GlottalSourceType.natural: {
            this.naturalGSource = new NaturalGlottalSource();
            this.glottalSource = () => this.naturalGSource.getNext();
            break; }
         default: {
            throw new Error("Undefined glottal source type."); }}}

   private startGlottalSourcePeriod() {
      switch (this.mParms.glottalSourceType) {
         case GlottalSourceType.impulsive: {
            this.impulsiveGSource.startPeriod(this.pState.openPhaseLength);
            break; }
         case GlottalSourceType.natural: {
            this.naturalGSource.startPeriod(this.pState.openPhaseLength);
            break; }
         default: {
            throw new Error("Undefined glottal source type."); }}}

   }

// Generates a sound that consists of multiple frames.
export function generateSound (mParms: MainParms, fParmsA: FrameParms[]) : Float64Array {
   const generator = new Generator(mParms);
   let outBufLen = 0;
   for (const fParms of fParmsA) {
      outBufLen += Math.round(fParms.duration * mParms.sampleRate); }
   const outBuf = new Float64Array(outBufLen);
   let outBufPos = 0;
   for (const fParms of fParmsA) {
      const frameLen = Math.round(fParms.duration * mParms.sampleRate);
      const frameBuf = outBuf.subarray(outBufPos, outBufPos + frameLen);
      generator.generateFrame(fParms, frameBuf);
      outBufPos += frameLen; }
   return outBuf; }

// For debugging only:
// declare var console: any;
