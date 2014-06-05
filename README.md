SuperPath
=========

Proposed extension for SVG
Work in progress
For now, just a proof of concept
Full implementation soon...

If you write a scientific paper and use that code, thank's to cite me as follow:

Moissinac, J.-C.; Concolato, C.; Le Feuvre, J., "Super Path: A Necessary Primitive for Vector Graphic Formats," Advances in Multimedia (MMEDIA), 2010 Second International Conferences on , vol., no., pp.191,195, 13-19 June 2010
doi: 10.1109/MMEDIA.2010.39
URL: http://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=5501583&isnumber=5501582

**SuperPathExpander.js**

Script which expand instances of the superpath extension to produce a standard 
SVG 1.1 file.
Implements L, l, Q, q, C, c

**piece01withExternalScript.svg**

Sample SVG file with usage of the extension.
Line
```
    <path d="L330,150 280,230 h10 L330,310 280,400" id="p1" />
```                            
define a path chunk

Lines
```
  <path d="M 90,190 220,90 P#p1 120,375 z"
       fill="yellow" stroke="blue" stroke-width="5" />
  <path d="M 500,385 390,460 R#p1 450,50 565,81 z"
       fill="red" stroke="blue" stroke-width="5" />
```
use the chunk as part of the path data (d) definition with reference to the id 
of the chunk.

**piece01-expanded.svg**

Is the standard SVG file equivalent to the one obtained by execution of the
SuperPathExpander.js/expandPaths() function in  piece01withExternalScript.svg