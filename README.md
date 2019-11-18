# KlattSyn - Klatt Formant Synthesizer

This is a redevelopment of the classic [Klatt](https://en.wikipedia.org/wiki/Dennis_H._Klatt) cascade-parallel formant synthesizer.
The program code is written in TypeScript, which is compiled to JavaScript.
It can run within a web browser or with [Node](https://nodejs.org).

This implementation of a Klatt synthesizer has been developed by Christian d'Heureuse in 2019
and is based on the following documents and source code:

* D.H. Klatt (1980), "Software for a cascade/parallel formant synthesizer"
  ([PDF](http://www.source-code.biz/klattSyn/Klatt-1980.pdf))
* D.H. & L.C. Klatt (1990), "Analysis, synthesis and perception of voice quality variations among male and female talkers"
  ([PDF](http://www.source-code.biz/klattSyn/Klatt-1990.pdf))
* Fortran source code published in Klatt (1980), [github.com/jh4xsy/klatt80](https://github.com/jh4xsy/klatt80)
* klsyn, last known C version developed by D.H. Klatt himself (1983 - 1986),
  [github.com/rsprouse/klsyn/tree/master/c](https://github.com/rsprouse/klsyn/tree/master/c)
* klatt 3.03, comp.speech C version (1994), re-implementation in C of Klatt's Fortran code by Jon Iles and Nick Ing-Simmons,
  [www.speech.cs.cmu.edu/comp.speech/Section5/Synth/klatt.html](http://www.speech.cs.cmu.edu/comp.speech/Section5/Synth/klatt.html)
* klatt 3.04, modernized and cleaned up by Reece H. Dunn (2011 - 2015),
  [github.com/rhdunn/klatt](https://github.com/rhdunn/klatt)
* eSpeak NG Klatt module (2015 - 2018),
  [github.com/espeak-ng/espeak-ng/blob/master/src/libespeak-ng/klatt.c](https://github.com/espeak-ng/espeak-ng/blob/master/src/libespeak-ng/klatt.c)
* Praat KlattGrid module (2008 - 2019),
  [github.com/praat/praat/blob/master/dwtools/KlattGrid.cpp](https://github.com/praat/praat/blob/master/dwtools/KlattGrid.cpp)

**Online demo**: [www.source-code.biz/klattSyn](http://www.source-code.biz/klattSyn)<br>
**NPM package**: [klatt-syn](https://www.npmjs.com/package/klatt-syn)<br>
**GUI application**: [github.com/chdh/klatt-syn-app](https://github.com/chdh/klatt-syn-app)
