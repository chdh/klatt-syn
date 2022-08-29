// Klatt synthesis parameters for demo and tests.

import {FrameParms} from "./Klatt.js";

// These parameters are used as default values in the KlattSynApp web application.
export const demoFrameParms: FrameParms = {
   duration:                 1,
   f0:                       247,    // 220,
   flutterLevel:             0.25,
   openPhaseRatio:           0.7,
   breathinessDb:            -25,
   tiltDb:                   0,
   gainDb:                   NaN,
   agcRmsLevel:              0.18,
   nasalFormantFreq:         NaN,
   nasalFormantBw:           NaN,
   oralFormantFreq:          [520, 1006, 2831, 3168, 4135, 5020],
   oralFormantBw:            [76,  102,  72,   102,  816,  596 ],

   // Cascade branch:
   cascadeEnabled:           true,
   cascadeVoicingDb:         0,
   cascadeAspirationDb:      -25,
   cascadeAspirationMod:     0.5,
   nasalAntiformantFreq:     NaN,
   nasalAntiformantBw:       NaN,

   // Parallel branch:
   parallelEnabled:          false,
   parallelVoicingDb:        0,
   parallelAspirationDb:     -25,
   parallelAspirationMod:    0.5,
   fricationDb:              -30,
   fricationMod:             0.5,
   parallelBypassDb:         -99,
   nasalFormantDb:           NaN,
   oralFormantDb:            [0, -8, -15, -19, -30, -35] };
