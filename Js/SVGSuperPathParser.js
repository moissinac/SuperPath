  /*
   *            SVG SuperPath Parser extension
   *
   *            Author: Jean-Claude Moissinac
   *            Copyright (c) Telecom ParisTech 2013-2015
   *                    All rights reserved
   *
   *  SuperPath is free software; you can redistribute it and/or modify
   *  it under the terms of the GNU Lesser General Public License as published by
   *  the Free Software Foundation; either version 2, or (at your option)
   *  any later version.
   *
   *  This file is the main file of the implementation of the SuperPath extension
   *  His goal is to expand each SuperPath instance to produce a valid SVG file
   *  regarding the SVG 1.1 specification
   *
   *  SuperPath is distributed in the hope that it will be useful,
   *  but WITHOUT ANY WARRANTY; without even the implied warranty of
   *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   *  GNU Lesser General Public License for more details.
   *
   *  You should have received a copy of the GNU Lesser General Public
   *  License along with this library; see the file COPYING.  If not, write to
   *  the Free Software Foundation, 675 Mass Ave, Cambridge, MA 02139, USA.
   *
   *
  */
(function () {
    "use strict";
    var superpath = {
            version: "0.2.14",
            SEPARATOR: "|", // with the current parser, can be all chars but other commands and space
            OPENCHUNK: "(",
            ENDCHUNK: ")",
            DIRECTREF: "#",
            REVERSEDREF: "!"
        };
      
    superpath.ParseToken = {};
    superpath.observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === "attributes")
            {
                if (mutation.attributeName === "data-sp-d")
                {
                      //console.log("mutation target: "+ mutation.target.processedD);
                      mutation.target.processedD = mutation.target.getAttribute("data-sp-d");
                      superpath.expandPaths();
                }
            }
        });    
        });
      // configuration of the observer:
      var obsconfig = { attributes: true, childList: false, characterData: true };      

      function getSubpathRefId(pp) {
          var id = "";
          do {
              id += pp.getToken();
          } while (id.indexOf(superpath.SEPARATOR) === -1); // T2D2 attention ici j'ai un élément de syntaxe en dur
          // remove spaces coming from the initial code of the parser which segments the tokens
          while (id.indexOf(" ") !== -1) {
              id = id.replace(" ", "");
          }
          return id.slice(0, id.indexOf("|"));
      }

      function getSubpathDesc(pp) {
          var str = pp.getToken(),
              toc = pp.getToken();
          while ((existy(toc)) && (toc !== superpath.ENDCHUNK)) {
              str += toc + " "; 
              toc = pp.getToken();
          }
          return str;
      }
      
      superpath.ParseToken[superpath.OPENCHUNK] = function(pp, cmdList) {
                  var cmd = new pathparser.Command(pp.command);
                  var idsubpath = getSubpathRefId(pp);
                  var descriptionsubpath = getSubpathDesc(pp);
                  cmd.chunkName = idsubpath;
                  cmd.strDescription = descriptionsubpath; // T2D2 replace it by a list of commands??
                  cmd.current = pp.current;
                  if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                      cmd.crtPt = cmdList.cmd[cmdList.cmd.length - 1].absEndPt;
                  }
                  cmdList.push(cmd);
      };
      superpath.ParseToken[superpath.REVERSEDREF] =
      superpath.ParseToken[superpath.DIRECTREF] = function(pp, cmdList) {
                  var cmd = new pathparser.Command(pp.command);
                  cmd.ref = getSubpathRefId(pp);
                  cmd.current = pp.current;
                  if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                      cmd.crtPt = cmdList.cmd[cmdList.cmd.length - 1].absEndPt;
                  }
                  cmdList.push(cmd);
      };
      superpath.ParseToken[superpath.ENDCHUNK] = function(pp, cmdList) {
      };

      superpath.chunks = []; // dictionnary of subpath
      function existy(x) {
          return (x !== null) && (x !== undefined);
      }

/* T2D2 mettre ça en point à traiter dans le github (ça enlèvera des lignes ici et clarifiera le code)
      et faire pareil pour tous les T2D2
      for expandReversedChunks and expandChunks
      verify if the done expansion, only on the data string, is enough or
      if I need to expand the associated cmdList
      the later is perhaps useful to update the known absolute point and be able to solve some references
       */
      // expands all the chunks found in the data, (taking care to change in the indexes of chunks using that path!)
      superpath.expandChunks = function(path) {
          var newpathdata,
              index,
              idSep,
              idChunk,
              ref,
              expanded = "",
              delta,
              someChange = false;
          newpathdata = path.processedD;
          //console.log("expandChunks of "+newpathdata);
          index = newpathdata.search(superpath.DIRECTREF);
          while (index > 0) {
              // index is the begining of the id (after superpath.DIRECTREF), superpath.SEPARATOR is the separator with the following
              idSep = newpathdata.indexOf(superpath.SEPARATOR, index + 1);
              if (idSep !== -1) {
                  idChunk = newpathdata.slice(index + 1, idSep);
                  ref = superpath.DIRECTREF + idChunk + superpath.SEPARATOR;
                  if (existy(superpath.chunks[idChunk])) {
                      expanded = superpath.chunks[idChunk].data + " ";
                      path.newpathdata = newpathdata = newpathdata.replace(ref, expanded);
                      someChange = true;
                  }
              } else {
                  idChunk = newpathdata.slice(index + 1);
                  ref = superpath.DIRECTREF + idChunk;
                  if (existy(superpath.chunks[idChunk])) {
                      expanded = superpath.chunks[idChunk].data;
                      path.newpathdata = newpathdata = newpathdata.replace(ref, expanded);
                      someChange = true;
                  }
              }
              // search for next chunk reference in the path
              expanded = "";
              delta = newpathdata.slice(index + 1).search(superpath.DIRECTREF);
              index = (delta !== -1 ? index + 1 + delta : -1);
          }
          return someChange;
      };
      superpath.expandReversedChunks = function (path) {
          var newpathdata,
              index,
              idSep,
              idChunk,
              ref,
              delta,
              rData,
              someChange = false;
          newpathdata = path.processedD;
          index = newpathdata.search(superpath.REVERSEDREF);
          while (index > 0) {
              // index is the begining of the id (after superpath.REVERSEDREF), superpath.SEPARATOR is the separator with the following
              idSep = newpathdata.indexOf(superpath.SEPARATOR, index + 1);
              if (idSep !== -1) {
                  idChunk = newpathdata.slice(index + 1, idSep);
                  ref = superpath.REVERSEDREF + idChunk + superpath.SEPARATOR;
              } else {
                  // if ref in the end of the path data
                  idChunk = newpathdata.slice(index + 1);
                  ref = superpath.REVERSEDREF + idChunk;
              }
              if (existy(superpath.chunks[idChunk])) {
                  if (existy(superpath.chunks[idChunk].rData)) {
                      rData = superpath.chunks[idChunk].rData;
                  } //else { T2D2 ???
                  //}
                  path.newpathdata = newpathdata = newpathdata.replace(ref, rData);
                  someChange = true;
              }
              // search for next reversed ref
              // index = newpathdata.search(superpath.REVERSEDREF);
              delta = newpathdata.slice(index + 1).search(superpath.REVERSEDREF);
              index = (delta !== -1 ? index + 1 + delta : -1);
          }
          return someChange;
      };
      /* T2D2 check if buildCmdList, buildReverseCmdList and strDescription must be in ExpandableSVGPathParser or here */
      function buildCmdList(desc, startingPt) {
          // T2D2 check: the following fake M seems to be a bad trace of a previous implementation
          // add a fake M command to resolve the absolute commands againt a reference point
          var data = "M" + startingPt.x + "," + startingPt.y + desc,
              cmdList = pathparser.svg_parse_path(data),
              relCmdList = pathparser.fullrelativePathCmdList(cmdList);
          relCmdList.totalVector = new pathparser.Point(cmdList.cmd[cmdList.cmd.length-1].absEndPt.x, cmdList.cmd[cmdList.cmd.length-1].absEndPt.y); 
          relCmdList.totalVector.translate(-startingPt.x, -startingPt.y);// compute the relative translation by the complete cmdlist
          relCmdList.cmd = relCmdList.cmd.slice(1);
          // remove the fake starting 'M' command
          return relCmdList;
      }
      function buildReversedCmdList(list) {
          var rList = list.reverse();
          return rList;
      }
      function strDescription(cmdList) {
          var str = "",
              i,
              cmd;
          for (i = 0; cmdList.cmd.length > i; i += 1) 
              str += cmdList.cmd[i].toString();
          return str;
      }
      
      // take a data path, complete the chunk dictionnary with found chunks, and remove the chunk definition
      function findChunks(path) {
          var newpathdata = path.processedD = (path.processedD?path.processedD:path.getAttribute("data-sp-d")),
              chunkName,
              chunk,
              cmdList,
              cmdIndex,
              cmd,
              someChange = false;
          path.chunks = []; // to know chunks defined in a path
          cmdList = path.cmdList = pathparser.svg_parse_path(newpathdata);
          cmdIndex = 0;
          do {
              cmd = cmdList.cmd[cmdIndex];
              if ((cmd.command === superpath.OPENCHUNK) && (existy(cmd.crtPt))) {
                  chunkName = cmd.chunkName;
                  chunk = {};
                  chunk.name = chunkName;
                  // T2D2 here it's possible that cmd.crtPt isn't defined; must add processing of that case
                  chunk.description = buildCmdList(cmd.strDescription, cmd.crtPt);
                  // list of commands
                  //chunk.startingPt = cmd.crtPt;
                  //console.log(chunkName+" delta (x="+chunk.description.totalVector.x+", y="+chunk.description.totalVector.y+")");
                  chunk.startingPt = cmd.current;
                  chunk.reversedDescription = buildReversedCmdList(chunk.description);
                  chunk.path = path; // to know the path from which comes the chunk
                  chunk.data = strDescription(chunk.description);
                  chunk.rData = strDescription(chunk.reversedDescription);
                  path.chunks.push(chunk); // to have a pointer from the path to the chunks defined in it
                  superpath.chunks[chunkName] = chunk;
                  // T2D2 process the replacement of the ( command in the cmdList
                  path.newpathdata = newpathdata.replace(newpathdata.slice(newpathdata.indexOf(superpath.OPENCHUNK), newpathdata.indexOf(superpath.ENDCHUNK) + 1), chunk.data);
                  someChange = true;
              }
              cmdIndex += 1;
          } while (cmdList.cmd.length > cmdIndex);
          return someChange;
      }

      // extensions
      superpath.TokensToString = {};
      superpath.TokensToString[superpath.OPENCHUNK] = function() {  return this.command + this.chunkName + superpath.SEPARATOR + this.strDescription + superpath.ENDCHUNK; };
      superpath.TokensToString[superpath.DIRECTREF] = function() {  return this.command + this.ref + superpath.SEPARATOR; };
      superpath.TokensToString[superpath.REVERSEDREF] = function() {  return this.command + this.ref + superpath.SEPARATOR; };
      
      superpath.getSubpathStartingPoint = function(cmdList, id) {
          // I suppose that if the chunk exists, it has a startingPoint
          var icmd = 0,
              cmd;
          for (icmd = 0; cmdList.cmd.length > icmd + 1; icmd += 1) {
              cmd = cmdList.cmd[icmd];
              if ((cmd.command === superpath.OPENCHUNK) && (cmd.chunkName === id)) {
                  if (existy(cmd.crtPt)) {
                      return cmd.crtPt;
                  }
              }
          }
          return null;
      };
      /*  extension to be checked */
      // extension
      superpath.cmdCreationRules = {};
      superpath.cmdCreationRules[superpath.OPENCHUNK] = function(cmdList, revCmdList, icmd, cmdcode) { 
                    var cmd = new pathparser.Command(superpath.OPENCHUNK);
                    cmd.chunkName = cmdList.cmd[icmd].chunkName;
                    cmd.strDescription = cmdList.cmd[icmd].strDescription;
                    return cmd;
                  };
      /* end of: extension to be checked */

     // parsing path ; source inspired from canvg library
      // T2D2 join the author
      // T2D2 to complete for the A T and S commands
      // T2D2 check for the following problem:
      //  possible that doesn't work if the id of the chunk contains a cmd code and if a chunk contains a chunk
      // recursivity and circularity of the chunk functionality must be analyzed
      superpath.buildTablesOfPathUsingChunk = function (pathlist, pathDefinerList, pathDRefList, pathIRefList) {
          var iPath,
              path,
              pathdata,
              len = pathlist.length;
          // pathlist isn't a table but an html collection => no forEach method
          for (iPath = 0; len > iPath; iPath += 1) {
              path = pathlist[iPath];
              pathdata = path.processedD;
              if (existy(pathdata)) {
                  // build list of path containing a chunk definition
                  if (pathdata.indexOf(superpath.OPENCHUNK) !== -1) {
                      pathDefinerList.push(path);
                  }
                  // build list of path containing a chunk direct reference
                  if (pathdata.indexOf(superpath.DIRECTREF) !== -1) {
                      pathDRefList.push(path);
                  }
                  // build list of path containing a chunk inverse reference
                  if (pathdata.indexOf(superpath.REVERSEDREF) !== -1) {
                      pathIRefList.push(path);
                  }
              }
          }
      };
      superpath.searchPathDefiner = function(chunkname) {
         var path = null;
         if (superpath.chunks[chunkname]) {
              return superpath.chunks[chunkname].path;
         } else {  // the chunk is not already identified
               
         }
         return path;
      };
      
      function loopOnChunks(pathList, appliedFct, cmdchar) {
          var iPath = 0,
              path,
              someChange = false,
              pathChange = false;
          while (pathList.length > iPath) {
              path = pathList[iPath];
              pathChange = appliedFct(path);
              // find and define chunks
              if (pathChange) {
                  path.processedD = path.newpathdata;
                  //console.log("path "+ path.id + "new data value:"+path.newpathdata); 
                  if (path.newpathdata.indexOf(cmdchar) === -1) {
                      pathList.splice(iPath, 1);
                  }
                  path.newpathdata = "";
                  someChange = true;
              }
              iPath += 1;
          }
          return someChange;
      }
      
      function processedDSetup(pathlist) {
          var iPath = 0;
          while (pathlist.length > iPath) {
                //if (!existy(pathlist[iPath].processedD))  {
                    var spd = pathlist[iPath].getAttribute("data-sp-d"); 
                    if (spd !== null) pathlist[iPath].processedD = spd; 
                //}
                iPath += 1;
          }
      }
      function expanderReportError(pathDefinerList, pathDRefList, pathIRefList) {
              console.log("Problem: some chunk reference seems impossible to solve!");
              if (pathDefinerList.length !== 0) { console.log("Problem with " + pathDefinerList[0].chunks) ; }
              if (pathDRefList.length !== 0) { console.log("Problem with reference " + pathDRefList[0].chunks); }
              if (pathIRefList.length !== 0) { console.log("Problem with inverse reference " + pathIRefList[0].chunks); }
      }
      /*
      Algo:
      1) build a table D of path with (
      2) build a table R of path with #
      3) build a table I of path with !
      4) while something has changed, do the following steps
      a) for each path in the table D, process the path to get the usable version of each chunk if posssible (see below) and replace the command definition by the usable chunk
      b) for each path in the table R, expand the referenced chunks if the definition is usable and then remove the path from R table (if no other ref remains)
      c) for each path in the table I, expand the referenced chunks if the definition is usable and then remove the path from R table (if no other ref remains)
      if we come out the while and some path remains in the tables D, R or I, the content is problematic
      
      to get the usable version of each chunk:
      if all the commands of the chunk are relative, I have quite nothing to do (perhaps just preprocess the reverse chunk)
      start from the ( and go backward until finding either a command with an absolute end point (absEndPt) or an absolute command (which gives us the corresponding absEndPt)
      if I encounter a ), I can't transform the current chunk until that previous reference will be solved
      if I find an absEndPt, I can propagate the absolute knowledge until the begining of the current chunk and solve it
       */
      superpath.expandPaths = function () {
          var pathlist = document.getElementsByTagName("path"),
              pathDefinerList = [],   // list of path used to define subpath
              pathDRefList = [],    // list of path using a direct reference to a subpath
              pathIRefList = [],    // list of path using an inverse reference to a subpath
              someChange = false;
          // copy original d attribute, for reference; could be done only for path with chunk definition or chunk reference
          superpath.observer.disconnect(); // suspend the observer
          var iPath = 0;
          processedDSetup(pathlist); // copy d attribute value to processedD if processedD doesn't exit and reset d to processedD
          superpath.chunks = [];
          /* T2D2 group the three following calls to maintain a coherent view of the extensions */
          pathparser.addCommands(superpath.ParseToken);
          pathparser.addCmdCreationRules(superpath.cmdCreationRules);
          pathparser.addStringifier(superpath.TokensToString);
          superpath.buildTablesOfPathUsingChunk(pathlist, pathDefinerList, pathDRefList, pathIRefList);
          do {
              // try to process the chunk definitions and resolve the references until nothing appends
              someChange = false;
              // build chunk dictionnary
              // remove the path from the list of definers if completely solved
              someChange |= loopOnChunks(pathDefinerList, findChunks, superpath.OPENCHUNK);
              // expand direct chunks references
              // remove each path from the list of direct reference if completely solved
              someChange |= loopOnChunks(pathDRefList, superpath.expandChunks, superpath.DIRECTREF);
              // expand reversed chunks
              // remove the path from the list of reversed reference if completely solved
              someChange |= loopOnChunks(pathIRefList, superpath.expandReversedChunks, superpath.REVERSEDREF);
          } while (someChange);
          if ((pathDefinerList.length !== 0) || (pathDRefList.length !== 0) || (pathIRefList.length !== 0)) 
              expanderReportError(pathDefinerList, pathDRefList, pathIRefList);
          iPath = 0;
          while (pathlist.length > iPath) {
              if (existy(pathlist[iPath].processedD)) 
                    pathlist[iPath].setAttribute("d", pathlist[iPath].processedD);
              superpath.observer.observe(pathlist[iPath], obsconfig); // observe if d attribute of the path change
                iPath += 1;
          }
      };
      // T2D2 I need to understand the following lines (inspired from code of other modules)
      if (typeof define === "function" && define.amd) {
          define(superpath);
      } else if (typeof module === "object" && module.exports) {
          module.exports = superpath;
      } else {
          this.superpath = superpath;
      }
}).call(this);
