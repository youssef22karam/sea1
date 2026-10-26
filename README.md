# Sea Storm + Lobster Boat (split project)

The original single-file `Sea_2_boat_stormcontrols.html` (211 KB) split into parts of 28 KB or less.

- `index.html` - page shell, CSS, import map, and a small loader
- `boat-01.js ... boat-06.js` - procedural lobster boat (GeoKit, HullLines, HullBuilder, DeckGear, Wheelhouse, Running). Join in numeric order; this is the first module script.
- `sea-01.js ... sea-03.js` - sea surface simulator, storm, controls, render loop. Join in numeric order; this is the second module script.
- `build.py` - `python3 build.py` rebuilds the exact original single HTML file

Parts are cut at statement boundaries and must be read in numeric order. Some cuts fall inside large
functions/IIFEs, so a single part may not be valid JavaScript on its own.

Run: serve the folder over http(s) (GitHub Pages, or `python3 -m http.server`); `file://` will not work.
