  /*
   *            SuperPath - SVG Extension
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
  Usage: see https://github.com/moissinac/SuperPath   
  
  Hypothesis:
  - all subpath reference uses a relative subpath definition of the geometry (all absolute coordinates are replaced by relative ones)
  - so, all chunk definition are transated to relative commands
  - after a ref, there is always an explicit command
  - a chunk definition can't contain a chunk definition or reference
  - a chunk definition is always followed by an explicit command
  - a chunk definition begins always followed by an explicit command
  
  possible optimization:
  when a chunk definition contains only relative commands, we can skip code used to search a previous reference point
  
  questions:
  Q1: what happens if a content try to define several chunks with the same id
  
  possible useful parser: see http://pastie.org/1036541
  */
  function ExtendedPathParser(superpath, d, dircmd, revcmd, opencmd, closecmd) {
      "use strict";
      var commands = "MmZzLlHhVvCcSsQqTtAa" + opencmd + dircmd + revcmd + closecmd,
          relcommands = "mlhvcsqtaz" + opencmd + dircmd + revcmd + closecmd,
          regex = new RegExp("([" + commands + "])([" + commands + "])", "gm");
      // T2D2: convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
      this.compressSpaces = function (s) {
          return s.replace(/[\s\r\t\n]+/gm, ' ');
      };
      this.trim = function (s) {
          return s.replace(/^\s+|\s+$/g, '');
      };
      d = d.replace(/,/gm, ' ');
      // get rid of all commas
      // T2D2 undestand why the following line is repeted two times
      d = d.replace(regex, '$1 $2');
      // separate commands from commands
      d = d.replace(regex, '$1 $2');
      // separate commands from commands
      regex = new RegExp("([" + commands + "])([^\s])", "gm");
      d = d.replace(regex, '$1 $2');
      // separate commands from points
      regex = new RegExp("([^\s])([" + commands + "])", "gm");
      d = d.replace(regex, '$1 $2');
      // separate commands from points
      d = d.replace(/([0-9])([+\-])/gm, '$1 $2');
      // separate digits when no comma
      d = d.replace(/(\.[0-9]*)(\.)/gm, '$1 $2');
      // separate digits when no comma
      d = d.replace(/([Aa](\s+[0-9]+){3})\s+ ([01])\s*([01])/gm, '$1 $3 $4 ');
      // shorthand elliptical arc path syntax
      d = this.compressSpaces(d);
      // compress multiple spaces
      d = this.trim(d);
      regex = new RegExp("^[" + commands + "]$", "gm");
      this.tokens = d.split(' ');
      this.reset = function () {
          this.i = -1;
          this.command = '';
          this.previousCommand = '';
          this.start = new superpath.Point(0, 0);
          this.control = new superpath.Point(0, 0);
          this.current = new superpath.Point(0, 0);
          this.points = [];
          this.angles = [];
      };
      this.isEnd = function () {
          return this.i >= this.tokens.length - 1;
      };
      this.isCommandOrEnd = function () {
          if (this.isEnd()) {
              return true;
          }
          return this.tokens[this.i + 1].match(regex) !== null;
      };
      this.isRelativeCommand = function () {
          return (relcommands.indexOf(this.command) !== -1);
      };
      this.getToken = function () {
          this.i += 1;
          return this.tokens[this.i];
      };
      this.getSubpathRefId = function () {
          var id = "";
          do {
              id += this.getToken();
          } while (id.indexOf("|") === -1);
          // remove spaces coming from the initial code of the parser which segments the tokens
          while (id.indexOf(" ") !== -1) {
              id = id.replace(" ", "");
          }
          return id.slice(0, id.indexOf("|"));
      };
      this.getSubpathDesc = function () {
          var str = this.getToken(),
              toc = this.getToken();
          while (toc !== superpath.ENDCHUNK) {
              str += toc + " "; 
              toc = this.getToken();
          }
          return str;
      };
      this.getScalar = function () {
          return parseFloat(this.getToken());
      };
      this.nextCommand = function () {
          this.previousCommand = this.command;
          this.command = this.getToken();
      };
      this.getPoint = function (relative) {
          // if relative is false, make the point absolute
          var pl = new superpath.Point(this.getScalar(), this.getScalar());
          return (relative ? pl : this.makeAbsolute(pl));
      };
      this.getAsControlPoint = function (relative) {
          var pl = this.getPoint(relative);
          this.control = pl;
          return pl;
      };
      this.getAsCurrentPoint = function (relative) {
          var pl = this.getPoint(relative);
          this.current = pl;
          return pl;
      };
      this.getReflectedControlPoint = function () {
          if (this.previousCommand.toLowerCase() !== 'c' &&
                  this.previousCommand.toLowerCase() !== 's' &&
                  this.previousCommand.toLowerCase() !== 'q' &&
                  this.previousCommand.toLowerCase() !== 't') {
              return this.current;
          }
          // reflect point
          var pl = new superpath.Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);
          return pl;
      };
      this.makeAbsolute = function (p) {
          if (this.isRelativeCommand()) {
              p.translate(this.current.x, this.current.y);
          }
          return p;
      };
  }
  
  (function () {
      "use strict";
      var superpath = {
          version: "0.1.0",
          SEPARATOR: "|", // with the current parser, can be all chars but other commands and space
          OPENCHUNK: "(",
          ENDCHUNK: ")",
          DIRECTREF: "#",
          REVERSEDREF: "!"
      };
      superpath.chunks = []; // dictionnary of subpath
      function existy(x) {
          return (x !== null) && (x !== undefined);
      }
      /* T2D2
      for expandReversedChunks and expandChunks
      verify if the done expansion, only on the data string, is enough or
      if I need to expand the associated cmdList
      the later is perhaps useful to update the known absolute point and be able to solve some references
       */
      // expands all the chunks found in the data, (taking care to changes in the indexes of chunks using that path!)
      function expandChunks(path) {
          var newpathdata,
              index,
              idSep,
              idChunk,
              ref,
              expanded = "",
              delta,
              someChange = false;
          newpathdata = path.getAttribute("d");
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
      }
      function expandReversedChunks(path) {
          var newpathdata,
              index,
              idSep,
              idChunk,
              ref,
              delta,
              rData,
              someChange = false;
          newpathdata = path.getAttribute("d");
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
      }
      function buildCmdList(desc, startingPt) {
          // add a fake M command to resolve the absolute commands againt a reference point
          var data = "M" + startingPt.x + "," + startingPt.y + desc,
              cmdList = superpath.svg_parse_path(data),
              relCmdList = superpath.fullrelativePathCmdList(cmdList);
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
          for (i = 0; cmdList.cmd.length > i; i += 1) {
              cmd = cmdList.cmd[i];
              switch (cmd.command) {
              case 'l':
                  str += cmd.command + cmd.target.x + "," + cmd.target.y;
                  break;
              case 'c':
                  str += cmd.command + cmd.ctlpt1.x + "," + cmd.ctlpt1.y + " " + cmd.ctlpt2.x + "," + cmd.ctlpt2.y + " " + cmd.target.x + "," + cmd.target.y;
                  break;
              case 'q': case 't':
                  str += cmd.command + cmd.ctlpt1.x + "," + cmd.ctlpt1.y + " " + cmd.target.x + "," + cmd.target.y;
                  break;
              }
          }
          return str;
      }
      // take a data path, complete the chunk dictionnary with found chunks, and remove the chunk definition
      function findChunks(path) {
          var newpathdata = path.getAttribute("d"),
              chunkName,
              chunk,
              cmdList,
              cmdIndex,
              cmd,
              someChange = false;
          path.chunks = []; // to know chunks defined in a path
          cmdList = path.cmdList = superpath.svg_parse_path(newpathdata);
          cmdIndex = 0;
          do {
              cmd = cmdList.cmd[cmdIndex];
              if ((cmd.command === superpath.OPENCHUNK) && (existy(cmd.crtPt))) {
                  chunkName = cmd.chunkName;
                  chunk = superpath.chunks[chunkName] = {};
                  chunk.nam = chunkName;
                  // T2D2 here it's possible that cmd.crtPt isn't defined; must add processing of that case
                  chunk.description = buildCmdList(cmd.strDescription, cmd.crtPt);
                  // list of commands
                  chunk.reversedDescription = buildReversedCmdList(chunk.description);
                  chunk.path = path; // to know the path from which comes the chunk
                  chunk.data = strDescription(chunk.description);
                  chunk.rData = strDescription(chunk.reversedDescription);
                  path.chunks.push(chunk); // to have a pointer from the path to the chunks defined in it
                  // T2D2 process the replacement of the ( command in the cmdList
                  path.newpathdata = newpathdata.replace(newpathdata.slice(newpathdata.indexOf(superpath.OPENCHUNK), newpathdata.indexOf(superpath.ENDCHUNK) + 1), chunk.data);
                  someChange = true;
              }
              cmdIndex += 1;
          } while (cmdList.cmd.length > cmdIndex);
          return someChange;
      }

      function stringifyParameters(cmd) {
          var str = "";
          if (existy(cmd.ctlpt1)) { str += cmd.ctlpt1.x + "," + cmd.ctlpt1.y + " "; }
          if (existy(cmd.ctlpt2)) { str += cmd.ctlpt2.x + "," + cmd.ctlpt2.y + " "; }
          if (existy(cmd.target)) { str += cmd.target.x + "," + cmd.target.y; }
          return str;
      }
      
      // associated a command letter with a function to stringify such command with his attributes
      superpath.TokensToString = { 
              "h"                  : function() {  return this.command + this.d; },
              "v"                  : function() {  return this.command + this.d; },
              "H"                  : function() {  return this.command + this.d; },
              "V"                  : function() {  return this.command + this.d; },
              "z"                  : function() {  return this.command + stringifyParameters(this); },
              "default"            : function() {  return this.command + stringifyParameters(this); }
              };
      // extensions
      superpath.TokensToString[superpath.OPENCHUNK] = function() {  return this.command + this.chunkName + superpath.SEPARATOR + this.strDescription + superpath.ENDCHUNK; };
      superpath.TokensToString[superpath.DIRECTREF] = function() {  return this.command + this.ref + superpath.SEPARATOR; };
      superpath.TokensToString[superpath.REVERSEDREF] = function() {  return this.command + this.ref + superpath.SEPARATOR; };
      superpath.Command = function (letter) {
          var cmd = { };
          cmd.command = letter;
          cmd.toString = superpath.TokensToString[cmd.command] || superpath.TokensToString.default;
          return cmd;
      };

      function createsimplecommand(crtcmdcode, x, y) {
          var cmd = new superpath.Command(crtcmdcode), // m? or M
              pt = new superpath.Point(x, y); 
          cmd.crtPt = new superpath.Point(pt.x, pt.y);
          cmd.target = pt;
          return cmd;
      }
      var simpleCommand = function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                    return cmd;
                  }; 
      // table of rules for the creation of a command list from the codes
      superpath.cmdCreationRules = {
              'v': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, revCmdList.cmd[icmd - 1].crtPt.x, cmdList.cmd[icmd].d); 
                    cmd.d = cmd.target.y;
                    return cmd;
                  },
              'V': function(cmdList, revCmdList, icmd,  cmdcode) {
                    var cmd = createsimplecommand(cmdcode, revCmdList.cmd[icmd - 1].crtPt.x, cmdList.cmd[icmd].d);
                    if (crtcmdcode === 'V') {
                        cmd.command = 'v';
                        cmd.target.y -= revCmdList.cmd[icmd - 1].crtPt.y;
                    }
                    cmd.d = cmd.target.y;
                    return cmd;
                  },
              'h': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].d, revCmdList.cmd[icmd - 1].crtPt.y);
                    cmd.d = cmd.target.x;
                    return cmd;
                  },
              'H': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].d, revCmdList.cmd[icmd - 1].crtPt.y);
                    if (cmdcode === 'H') {
                        cmd.command = 'h';
                        cmd.target.x -= revCmdList.cmd[icmd - 1].crtPt.x;
                    }
                    cmd.d = cmd.target.x;
                    return cmd;
                  },
              'm': simpleCommand, // T2D2 check for relative move
              'M': simpleCommand,
              'l': simpleCommand,
              'L': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                    if (cmdcode === 'L') {
                        cmd.command = 'l';
                        cmd.target.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                    }
                    return cmd;
                  },
              'q': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                    cmd.ctlpt1 = new superpath.Point(cmdList.cmd[icmd].ctlpt1.x, cmdList.cmd[icmd].ctlpt1.y);
                    return cmd;
                  },
              'Q': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                    cmd.ctlpt1 = new superpath.Point(cmdList.cmd[icmd].ctlpt1.x, cmdList.cmd[icmd].ctlpt1.y);
                    if ((cmdcode === 'Q')||(cmdcode === 'T')) {
                        cmd.command = (cmdcode==='Q'?'q':'t');
                        cmd.ctlpt1.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                        cmd.target.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                    }
                    return cmd;
                  },
              'c': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                    cmd.ctlpt1 = new superpath.Point(cmdList.cmd[icmd].ctlpt1.x, cmdList.cmd[icmd].ctlpt1.y);
                    cmd.ctlpt2 = new superpath.Point(cmdList.cmd[icmd].ctlpt2.x, cmdList.cmd[icmd].ctlpt2.y);
                    return cmd;
                  },
              'C': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                    cmd.ctlpt1 = new superpath.Point(cmdList.cmd[icmd].ctlpt1.x, cmdList.cmd[icmd].ctlpt1.y);
                    cmd.ctlpt2 = new superpath.Point(cmdList.cmd[icmd].ctlpt2.x, cmdList.cmd[icmd].ctlpt2.y);
                    if (cmdcode === 'C') {
                        cmd.command = 'c';
                        cmd.ctlpt1.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                        cmd.ctlpt2.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                        cmd.target.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                    }
                    return cmd;
                  },
              'z': function(cmdList, revCmdList, icmd,  cmdcode) { 
                    var cmd = new superpath.Command('z');
                    return cmd;
                  },
              'default': function(cmdList, revCmdList, icmd,  cmdcode) { return null; }
      };
      // extension
      superpath.cmdCreationRules[superpath.OPENCHUNK] = function(cmdList, revCmdList, icmd, cmdcode) { 
                    var cmd = new superpath.Command(superpath.OPENCHUNK);
                    cmd.chunkName = cmdList.cmd[icmd].chunkName;
                    cmd.strDescription = cmdList.cmd[icmd].strDescription;
                    return cmd;
                  };
      
      // cmdList is obtained by calling  svg_parse_path on a path data    
      superpath.fullrelativePathCmdList = function (cmdList) {
          // transform the path data to use only relative commands
          var revCmdList = new superpath.CmdList(),
              crtPt = { },
              cmd = null,
              crtcmdcode,
              icmd = 0,
              len = cmdList.cmd.length;
          crtPt.x = cmdList.cmd[0].target.x;
          crtPt.y = cmdList.cmd[0].target.y;
          while (len > icmd) {
              // pour chaque commande passer en relatif et calculer le nouveau point courant
              crtcmdcode = cmdList.cmd[icmd].command;
              var token = superpath.cmdCreationRules[crtcmdcode] || superpath.cmdCreationRules.default;
              cmd = token(cmdList, revCmdList, icmd, crtcmdcode);
              if (cmd)  {  revCmdList.cmd.push(cmd); cmd = null; }
              icmd += 1;
          }
          return revCmdList;
      };
      superpath.Point = function (x, y) {
          this.x = x;
          this.y = y;
          this.translate = function (dx, dy) {
              this.x += dx;
              this.y += dy;
          };
      };
      superpath.CmdList = function () {
          this.cmd = [];
          this.getSubpathStartingPoint = function (id) {
              // I suppose that if the chunk exists, it has a startingPoint
              var icmd = 0,
                  cmd;
              for (icmd = 0; this.cmd.length > icmd + 1; icmd += 1) {
                  cmd = this.cmd[icmd];
                  if ((cmd.command === superpath.OPENCHUNK) && (cmd.chunkName === id)) {
                      if (existy(cmd.crtPt)) {
                          return cmd.crtPt;
                      }
                  }
              }
              return null;
          };
          
          this.reverseRule = {
                  'M': function(i, cmd, commandi) {
                        var pt = new superpath.Point(-1 * commandi.target.x, -1 * commandi.target.y);
                        cmd.target = pt;
                      },
                  'h': function(i, cmd, commandi) {
                        cmd.d = -1 * commandi.d;
                      },
                  'v': function(i, cmd, commandi) {
                        cmd.d = -1 * commandi.d;
                      },
                  'l': function(i, cmd, commandi) {
                        var pt = new superpath.Point(-1 * commandi.target.x, -1 * commandi.target.y);
                        cmd.target = pt;
                      },
                  'c': function(i, cmd, commandi) {
                        target = new superpath.Point(commandi.target.x, commandi.target.y);
                        cmd.ctlpt1 = new superpath.Point(commandi.ctlpt2.x - target.x, commandi.ctlpt2.y - target.y);
                        cmd.ctlpt2 = new superpath.Point(commandi.ctlpt1.x - target.x, commandi.ctlpt1.y - target.y);
                        cmd.target = new superpath.Point(-1 * target.x, -1 * target.y);
                      },
                  'q': function(i, cmd, commandi) {
                        target = new superpath.Point(commandi.target.x, commandi.target.y);
                        cmd.ctlpt1 = new superpath.Point(commandi.ctlpt1.x - target.x, commandi.ctlpt1.y - target.y);
                        cmd.target = new superpath.Point(-1 * target.x, -1 * target.y);
                        },
                  't': function(i, cmd, commandi) {
                        target = new superpath.Point(commandi.target.x, commandi.target.y);
                        cmd.ctlpt1 = new superpath.Point(commandi.ctlpt1.x - target.x, commandi.ctlpt1.y - target.y);
                        cmd.target = new superpath.Point(-1 * target.x, -1 * target.y);
                      }
                  }
          this.reverse = function () {
              // works only with relative commands, except the M
              // T2D2 process all the possible commands
              var revCmdList = new superpath.CmdList(),
                  i,
                  cmd,
                  pt,
                  target;
              for (i = this.cmd.length - 1; i >= 0; i -= 1) {
                  cmd = new superpath.Command(this.cmd[i].command);
                  var rule = this.reverseRule[cmd];
                  rule(i, cmd, this.cmd[i]);
                  revCmdList.push(cmd);
              }
              return revCmdList;
          };
          this.push = function (cmd) {
              this.cmd.push(cmd);
          };
          this.toString = function () {
              // T2D2 process all the possible commands
              var i = 0,
                  str = "";
              while (this.cmd.length > i) {
                  str += this.cmd[i].toString();
                  i += 1;
              }
              return str;
          };
      };
     // parsing path ; source inspired from canvg library
      // T2D2 join the author
      // T2D2 to complete for the A T and S commands
      // T2D2 check for the following problem:
      //  possible that doesn't work if the id of the chunk contains a cmd code and if a chunk contains a chunk
      // recursivity and circularity of the chunk functionality must be analyzed
      superpath.svg_parse_path = function (attribute_content) {
          var d = attribute_content,
              cmdList = new superpath.CmdList(),
              pp,
              p,
              newP,
              cmd,
              coord,
              cntrl,
              cntrl1,
              cntrl2,
              cp,
              idsubpath,
              descriptionsubpath;
          pp = this.PathParser = new ExtendedPathParser(superpath, d, superpath.DIRECTREF, superpath.REVERSEDREF, superpath.OPENCHUNK, superpath.ENDCHUNK); 
          pp.reset();
          while (!pp.isEnd()) {
              pp.nextCommand();
              switch (pp.command) {
              case 'M':
              case 'm':
                  p = pp.getAsCurrentPoint(pp.isRelativeCommand());
                  cmd = new superpath.Command(pp.command);
                  cmd.target = p;
                  cmd.absEndPt = p;
                  cmdList.push(cmd);
                  pp.start = pp.current;
                  while (!pp.isCommandOrEnd()) {
                      p = pp.getAsCurrentPoint(pp.isRelativeCommand());
                      cmd = new superpath.Command("L");
                      cmd.target = p;
                      cmd.absEndPt = new superpath.Point(p.x, p.y);
                      cmdList.push(cmd);
                  }
                  break;
              case 'L':
              case 'l':
                  do {
                      cmd = new superpath.Command(pp.command);
                      cmd.current = pp.current;
                      p = pp.getAsCurrentPoint(pp.isRelativeCommand());
                      cmd.target = p;
                      cmd.absEndPt = new superpath.Point(p.x, p.y);
                      if (pp.isRelativeCommand(cmd.command)) {
                          if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                              cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                          }
                      }
                      cmdList.push(cmd);
                  } while (!pp.isCommandOrEnd());
                  break;
              case 'H':
              case 'h':
                  do {
                      cmd = new superpath.Command(pp.command);
                      cmd.current = pp.current;
                      coord = pp.getScalar();
                      // t = pp.isRelativeCommand();
                      newP = new superpath.Point((pp.isRelativeCommand() ? pp.current.x : 0) + coord, pp.current.y);
                      pp.current = newP;
                      cmd.d = (pp.isRelativeCommand() ? pp.current.x : 0) + coord;
                      cmd.absEndPt = new superpath.Point(newP.x, newP.y);
                      if (pp.isRelativeCommand(cmd.command)) {
                          if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                              cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                          }
                      }
                      cmdList.push(cmd);
                  } while (!pp.isCommandOrEnd());
                  break;
              case 'V':
              case 'v':
                  do {
                      cmd = new superpath.Command(pp.command);
                      cmd.current = pp.current;
                      coord = pp.getScalar();
                      newP = new superpath.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + coord);
                      pp.current = newP;
                      cmd.d = (pp.isRelativeCommand() ? pp.current.x : 0) + coord;
                      cmd.absEndPt =  new superpath.Point(newP.x, newP.y);
                      if (pp.isRelativeCommand(cmd.command)) {
                          if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                              cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                          }
                      }
                      cmdList.push(cmd);
                  } while (!pp.isCommandOrEnd());
                  break;
              case 'C':
              case 'c':
                  do {
                      cmd = new superpath.Command(pp.command);
                      cmd.current = pp.current;
                      cntrl1 = pp.getAsControlPoint(pp.isRelativeCommand());
                      cntrl2 = pp.getAsControlPoint(pp.isRelativeCommand());
                      cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                      cmd.ctlpt1 = cntrl1;
                      cmd.ctlpt2 = cntrl2;
                      cmd.target = cp;
                      cmd.absEndPt =  new superpath.Point(cp.x, cp.y);
                      if (pp.isRelativeCommand(cmd.command)) {
                          if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                              cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                          }
                      }
                      cmdList.push(cmd);
                  } while (!pp.isCommandOrEnd());
                  break;
              case 'S':
              case 's':
                  /*
                  while (!pp.isCommandOrEnd()) {
                  var curr = pp.current;
                  var p1 = pp.getReflectedControlPoint();
                  var cntrl = pp.getAsControlPoint(pp.isRelativeCommand());
                  var cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                  pp.addMarker(cp, cntrl, p1);
                  bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
                  }
                   */
                  break;
              case 'Q':
              case 'q':
                  do {
                      cmd = new superpath.Command(pp.command);
                      cmd.current = pp.current;
                      cntrl = pp.getAsControlPoint(pp.isRelativeCommand());
                      cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                      cmd.ctlpt1 = cntrl;
                      cmd.target = cp;
                      cmd.absEndPt =  new superpath.Point(cp.x, cp.y);
                      if (pp.isRelativeCommand(cmd.command)) {
                          if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                              cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                          }
                      }
                      cmdList.push(cmd);
                  } while (!pp.isCommandOrEnd());
                  break;
              case 'T': // T2D2
              case 't':
                  do {
                      cmd = new superpath.Command(pp.command);
                      cmd.current = pp.current;
                      
                      // T2D2 cntrl = reflection of the control point on the previous command relative to the cuurent point or current point if the previous command isn't Q,q,T or t
                      cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                      cmd.ctlpt1 = cntrl;
                      cmd.target = cp;
                      cmd.absEndPt =  new superpath.Point(cp.x, cp.y);
                      if (pp.isRelativeCommand(cmd.command)) {
                          if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                              cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                          }
                      }
                      cmdList.push(cmd);
                  } while (!pp.isCommandOrEnd());
                  break;
              case superpath.OPENCHUNK:
                  cmd = new superpath.Command(pp.command);
                  idsubpath = pp.getSubpathRefId();
                  descriptionsubpath = pp.getSubpathDesc();
                  cmd.chunkName = idsubpath;
                  cmd.strDescription = descriptionsubpath; // T2D2 replace it by a list of commands??
                  if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                      cmd.crtPt = cmdList.cmd[cmdList.cmd.length - 1].absEndPt;
                  }
                  cmdList.push(cmd);
                  break;
              case superpath.REVERSEDREF:
              case superpath.DIRECTREF:
                  cmd = new superpath.Command(pp.command);
                  cmd.ref = pp.getSubpathRefId();
                  cmdList.push(cmd);
                  break;
              case 'A': // T2D2
              case 'a':
                  break;
              case 'Z':
              case 'z':
                  do {
                      cmd = new superpath.Command(pp.command);
                      cmd.current = pp.current;
                      cmdList.push(cmd);
                  } while (!pp.isCommandOrEnd());
                  // T2D2 verify this strange while
                  break;
              }
          }
          return cmdList;
      };
      function buildTablesOfPathUsingChunk(pathlist, pathDefinerList, pathDRefList, pathIRefList) {
          var iPath,
              path,
              pathdata,
              len = pathlist.length;
          // pathlist isn't a table but an html collection => no forEach method
          for (iPath = 0; len > iPath; iPath += 1) {
              path = pathlist[iPath];
              pathdata = path.getAttribute("d");
              // build list of path containing a chunk definition
              path.srcData = pathdata;
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
                  path.setAttribute("d", path.newpathdata);
                  if (path.newpathdata.indexOf(cmdchar) === -1) {
                      pathList.splice(iPath, 1);
                  }
                  someChange = true;
              }
              iPath += 1;
          }
          return someChange;
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
              pathDefinerList = [],
              pathDRefList = [],
              pathIRefList = [],
              someChange = false;
          buildTablesOfPathUsingChunk(pathlist, pathDefinerList, pathDRefList, pathIRefList);
          do {
              // try to process the chunk definitions and resolve the references until nothing appends
              someChange = false;
              // build chunk dictionnary
              // remove the path from the list of definers if completely solved
              someChange |= loopOnChunks(pathDefinerList, findChunks, superpath.OPENCHUNK);
              // expand direct chunks references
              // remove each path from the list of direct reference if completely solved
              someChange |= loopOnChunks(pathDRefList, expandChunks, superpath.DIRECTREF);
              // expand reversed chunks
              // remove the path from the list of reversed reference if completely solved
              someChange |= loopOnChunks(pathIRefList, expandReversedChunks, superpath.REVERSEDREF);
          } while (someChange);
          if ((pathDefinerList.length !== 0) || (pathDRefList.length !== 0) || (pathIRefList.length !== 0)) {
              console.log("Problem: some chunk reference seems impossible to solve!");
              if (pathDefinerList.length !== 0) { console.log("Problem with" + pathDefinerList[0].toString()) ; }
              if (pathDRefList.length !== 0) { console.log("Problem with reference" + pathDRefList[0].toString()); }
              if (pathIRefList.length !== 0) { console.log("Problem with inverse reference" + pathIRefList[0].toString()); }
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