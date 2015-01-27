SuperPath
=========

Proposed extension for SVG

Work in progress

For now, just a proof of concept, but can be useful. Full implementation and documentation soon...

If you write a scientific paper and use that code, thank's to cite me as follow:

Moissinac, J.-C.; Concolato, C.; Le Feuvre, J., "Super Path: A Necessary Primitive for Vector Graphic Formats," Advances in Multimedia (MMEDIA), 2010 Second International Conferences on , vol., no., pp.191,195, 13-19 June 2010

doi: 10.1109/MMEDIA.2010.39

URL: http://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=5501583&isnumber=5501582

**SuperPathExpander.js**

Script which expand instances of the superpath extension to produce a standard 
SVG 1.1 file. Implements L, l, Q, q, C, c

A typical usage is:

- add this script in your svg file with the line
```
  <script type="application/ecmascript" xlink:href="SuperPathExpander.js" />
```

- add that code for the onload event in the main svg element
```
 onload="superpath.expandPaths()"
```

Then, the principle is to define chunk of path as part of a path at associating id to that part, then to use it with the commands # or ! in the data for other path. the chunk is then defined after translation in a sequence of relatives commands deduced from tha source path. 

```
#idOfMyChunk
```
insert a copy of the chunk with id idOfMyChunk (a | must follow the id; it's the separator with what follows)

```
!idOfMyChunk
```
insert a copy of the chunk with id idOfMyChunk  (a | must follow the id; it's the separator with what follows) but after reversing the commands (from the end to the begining, and processing them to follow the same geometry from the end to the begining)

See https://github.com/moissinac/SuperPath/wiki/Samples for samples (which are also in the Samples directory of the repositoty)

See https://github.com/moissinac/SuperPath/wiki/In-progress-new-implementation-of-SuperPath for the specification and some known issues
