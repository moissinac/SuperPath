  /*
   *            SVG Path Parser with capability to define extensiosn
   *
   *            Author: Jean-Claude Moissinac
   *            Copyright (c) Telecom ParisTech 2015
   *                    All rights reserved
   *
   *  SVGPathParser is free software; you can redistribute it and/or modify
   *  it under the terms of the GNU Lesser General Public License as published by
   *  the Free Software Foundation; either version 2, or (at your option)
   *  any later version.
   *
   *  SVG Path Parser is distributed in the hope that it will be useful,
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
//  "use strict";
  var pathparser = {
      version: "0.1.0"
      };
  var abscommands = "MZLHVCSQTA",
      relcommands = "mzlhvcsqta",
      commands = abscommands + relcommands;
  
  // parsing functions to build internal command representation from each parsed command
  var parseM = function(pp, cmdList) {
        var p = pp.getAsCurrentPoint(pp.isRelativeCommand());
        var cmd = new pathparser.Command(pp.command);
        cmd.target = p;
        cmd.absEndPt = p;
        cmdList.push(cmd);
        pp.start = pp.current;
        while (!pp.isCommandOrEnd()) {
            p = pp.getAsCurrentPoint(pp.isRelativeCommand());
            cmd = new pathparser.Command("L");
            cmd.target = p;
            cmd.absEndPt = new pathparser.Point(p.x, p.y);
            cmdList.push(cmd);
        }
  };
  var parseL = function(pp, cmdList) {
              var cmd;
              var p;
              do {
                  cmd = new pathparser.Command(pp.command);
                  cmd.current = pp.current;
                  p = pp.getAsCurrentPoint(pp.isRelativeCommand());
                  cmd.target = p;
                  cmd.absEndPt = new pathparser.Point(p.x, p.y);
                  if (pp.isRelativeCommand(cmd.command)) {
                      if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                          cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                      }
                  }
                  cmdList.push(cmd);
              } while (!pp.isCommandOrEnd());
  };
  var parseH = function(pp, cmdList) {
              var cmd;
              var p;
              var coord;
              var newP;
              do {
                  cmd = new pathparser.Command(pp.command);
                  cmd.current = pp.current;
                  coord = pp.getScalar();
                  // t = pp.isRelativeCommand();
                  newP = new pathparser.Point((pp.isRelativeCommand() ? pp.current.x : 0) + coord, pp.current.y);
                  pp.current = newP;
                  cmd.d = (pp.isRelativeCommand() ? pp.current.x : 0) + coord;
                  cmd.absEndPt = new pathparser.Point(newP.x, newP.y);
                  if (pp.isRelativeCommand(cmd.command)) {
                      if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                          cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                      }
                  }
                  cmdList.push(cmd);
              } while (!pp.isCommandOrEnd());
  };
  var parseV = function(pp, cmdList) {
              var cmd;
              var p;
              var coord;
              var newP;
              do {
                  cmd = new pathparser.Command(pp.command);
                  cmd.current = pp.current;
                  coord = pp.getScalar();
                  newP = new pathparser.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + coord);
                  pp.current = newP;
                  cmd.d = (pp.isRelativeCommand() ? pp.current.x : 0) + coord;
                  cmd.absEndPt =  new pathparser.Point(newP.x, newP.y);
                  if (pp.isRelativeCommand(cmd.command)) {
                      if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                          cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                      }
                  }
                  cmdList.push(cmd);
              } while (!pp.isCommandOrEnd());
  };
  var parseC = function(pp, cmdList) {
              var cmd;
              var cntrl1,
                  cntrl2,
                  cp;
              do {
                  cmd = new pathparser.Command(pp.command);
                  cmd.current = pp.current;
                  cntrl1 = pp.getAsControlPoint(pp.isRelativeCommand());
                  cntrl2 = pp.getAsControlPoint(pp.isRelativeCommand());
                  cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                  cmd.ctlpt1 = cntrl1;
                  cmd.ctlpt2 = cntrl2;
                  cmd.target = cp;
                  cmd.absEndPt =  new pathparser.Point(cp.x, cp.y);
                  if (pp.isRelativeCommand(cmd.command)) {
                      if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                          cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                      }
                  }
                  cmdList.push(cmd);
              } while (!pp.isCommandOrEnd());
  };
  var parseS = function(pp, cmdList) {
              var cmd;
              var p;
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
  };
  var parseQ = function(pp, cmdList) {
              var cmd;
              var cntrl,
                  cp;
              do {
                  cmd = new pathparser.Command(pp.command);
                  cmd.current = pp.current;
                  cntrl = pp.getAsControlPoint(pp.isRelativeCommand());
                  cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                  cmd.ctlpt1 = cntrl;
                  cmd.target = cp;
                  cmd.absEndPt =  new pathparser.Point(cp.x, cp.y);
                  if (pp.isRelativeCommand(cmd.command)) {
                      if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                          cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                      }
                  }
                  cmdList.push(cmd);
              } while (!pp.isCommandOrEnd());
  };
  var parseT = function(pp, cmdList) {
              var cmd;
              var cntrl,              
                  cp;
              do {
                  cmd = new pathparser.Command(pp.command);
                  cmd.current = pp.current;
                  
                  // T2D2 cntrl = reflection of the control point on the previous command relative to the cuurent point or current point if the previous command isn't Q,q,T or t
                  cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                  cmd.ctlpt1 = cntrl;
                  cmd.target = cp;
                  cmd.absEndPt =  new pathparser.Point(cp.x, cp.y);
                  if (pp.isRelativeCommand(cmd.command)) {
                      if (existy(cmdList.cmd[cmdList.cmd.length - 1].absEndPt)) {
                          cmd.absEndPt.translate(cmdList.cmd[cmdList.cmd.length - 1].absEndPt.x, cmdList.cmd[cmdList.cmd.length - 1].absEndPt.y);
                      }
                  }
                  cmdList.push(cmd);
              } while (!pp.isCommandOrEnd());
  };
  var parseA = function(pp, cmdList) {
  };
  var parseZ = function(pp, cmdList) {
              var cmd;
              do {
                  cmd = new pathparser.Command(pp.command);
                  cmd.current = pp.current;
                  cmdList.push(cmd);
              } while (!pp.isCommandOrEnd());
              // T2D2 verify this strange while
  };

  // defines parsing process associated to each command
  pathparser.ParseAbsToken = { // associative table which associate each absolute command with a parse function
          'M': parseM,
          'L': parseL,
          'H': parseH,
          'V': parseV,
          'C': parseC,
          'S': parseS,
          'Q': parseQ,
          'T': parseT,// T2D2
          'A': parseA, // T2D2
          'Z': parseZ
  };
  pathparser.ParseRelToken = { // associative table which associate each relative command with a parse function
          'm': parseM,
          'l': parseL,
          'h': parseH,
          'v': parseV,
          'c': parseC,
          's': parseS,
          'q': parseQ,
          't': parseT,
          'a': parseA,
          'z': parseZ
  };
  pathparser.ParseToken = {}; // associative table which associate each command with a parse function; by default, is the fusion of ParseAbsToken and ParseRelToken
  pathparser.addCommands = function(cmdDictionnary) {
      for (var property in cmdDictionnary) {
        if (cmdDictionnary.hasOwnProperty(property)) {
            pathparser.ParseToken[property] = cmdDictionnary[property];
            commands += property;
        }
      }
  };
  pathparser.addCommands(pathparser.ParseAbsToken);
  pathparser.addCommands(pathparser.ParseRelToken);

  
  function PathPreProcess(pathparser, d) {
      var regex = new RegExp("([" + commands + "])([" + commands + "])", "gm");
      // T2D2: convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
      this.compressSpaces = function (s) {
          return s.replace(/[\s\r\t\n]+/gm, ' ');
      };
      this.trim = function (s) {
          return s.replace(/^\s+|\s+$/g, '');
      };
      d = d.replace(/,/gm, ' '); // get rid of all commas
      // T2D2 understand why the following line is repeted two times
      d = d.replace(regex, '$1 $2'); // separate commands from commands
      d = d.replace(regex, '$1 $2'); // separate commands from commands
      regex = new RegExp("([" + commands + "])([^\s])", "gm");
      d = d.replace(regex, '$1 $2'); // separate commands from points
      regex = new RegExp("([^\s])([" + commands + "])", "gm");
      d = d.replace(regex, '$1 $2'); // separate commands from points
      d = d.replace(/([0-9])([+\-])/gm, '$1 $2'); // separate digits when no comma
      d = d.replace(/(\.[0-9]*)(\.)/gm, '$1 $2'); // separate digits when no comma
      d = d.replace(/([Aa](\s+[0-9]+){3})\s+ ([01])\s*([01])/gm, '$1 $3 $4 '); // shorthand elliptical arc path syntax
      d = this.compressSpaces(d); // compress multiple spaces
      d = this.trim(d);
      regex = new RegExp("^[" + commands + "]$", "gm");
      this.tokens = d.split(' ');
      this.reset = function () {
          this.i = -1;
          this.command = '';
          this.previousCommand = '';
          this.start = new pathparser.Point(0, 0);
          this.control = new pathparser.Point(0, 0);
          this.current = new pathparser.Point(0, 0);
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
      this.getScalar = function () {
          return parseFloat(this.getToken());
      };
      this.nextCommand = function () {
          this.previousCommand = this.command;
          this.command = this.getToken();
      };
      this.getPoint = function (relative) {
          // if relative is false, make the point absolute
          var pl = new pathparser.Point(this.getScalar(), this.getScalar());
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
          var pl = new pathparser.Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);
          return pl;
      };
      this.makeAbsolute = function (p) {
          if (this.isRelativeCommand()) {
              p.translate(this.current.x, this.current.y);
          }
          return p;
      };
  }
  
  function existy(x) {
      return (x !== null) && (x !== undefined);
  }

  function stringifyParameters(cmd) {
      var str = "";
      if (existy(cmd.ctlpt1)) { str += cmd.ctlpt1.x + "," + cmd.ctlpt1.y + " "; }
      if (existy(cmd.ctlpt2)) { str += cmd.ctlpt2.x + "," + cmd.ctlpt2.y + " "; }
      if (existy(cmd.target)) { str += cmd.target.x + "," + cmd.target.y; }
      return str;
  }
  
  // associate a command letter with a function to stringify such command with his attributes
  pathparser.TokensToString = { 
          "h"                  : function() {  return this.command + this.d; },
          "v"                  : function() {  return this.command + this.d; },
          "H"                  : function() {  return this.command + this.d; },
          "V"                  : function() {  return this.command + this.d; },
          "z"                  : function() {  return this.command + stringifyParameters(this); },
          "default"            : function() {  return this.command + stringifyParameters(this); }
          };
  pathparser.Command = function (letter) {
      var cmd = { };
      cmd.command = letter;
      cmd.toString = pathparser.TokensToString[cmd.command] || pathparser.TokensToString["default"];
      return cmd;
  };

  function createsimplecommand(crtcmdcode, x, y) {
      var cmd = new pathparser.Command(crtcmdcode), // m? or M
          pt = new pathparser.Point(x, y); 
      cmd.crtPt = new pathparser.Point(pt.x, pt.y);
      cmd.target = pt;
      return cmd;
  }
  var simpleCommand = function(cmdList, revCmdList, icmd,  cmdcode) { 
                var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                return cmd;
              }; 
  // table of rules for the creation of a command list from the codes
  pathparser.cmdCreationRules = {
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
                cmd.ctlpt1 = new pathparser.Point(cmdList.cmd[icmd].ctlpt1.x, cmdList.cmd[icmd].ctlpt1.y);
                return cmd;
              },
          'Q': function(cmdList, revCmdList, icmd,  cmdcode) { 
                var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                cmd.ctlpt1 = new pathparser.Point(cmdList.cmd[icmd].ctlpt1.x, cmdList.cmd[icmd].ctlpt1.y);
                if ((cmdcode === 'Q')||(cmdcode === 'T')) {
                    cmd.command = (cmdcode==='Q'?'q':'t');
                    cmd.ctlpt1.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                    cmd.target.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                }
                return cmd;
              },
          'c': function(cmdList, revCmdList, icmd,  cmdcode) { 
                var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                cmd.ctlpt1 = new pathparser.Point(cmdList.cmd[icmd].ctlpt1.x, cmdList.cmd[icmd].ctlpt1.y);
                cmd.ctlpt2 = new pathparser.Point(cmdList.cmd[icmd].ctlpt2.x, cmdList.cmd[icmd].ctlpt2.y);
                return cmd;
              },
          'C': function(cmdList, revCmdList, icmd,  cmdcode) { 
                var cmd = createsimplecommand(cmdcode, cmdList.cmd[icmd].target.x, cmdList.cmd[icmd].target.y);
                cmd.ctlpt1 = new pathparser.Point(cmdList.cmd[icmd].ctlpt1.x, cmdList.cmd[icmd].ctlpt1.y);
                cmd.ctlpt2 = new pathparser.Point(cmdList.cmd[icmd].ctlpt2.x, cmdList.cmd[icmd].ctlpt2.y);
                if (cmdcode === 'C') {
                    cmd.command = 'c';
                    cmd.ctlpt1.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                    cmd.ctlpt2.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                    cmd.target.translate(-revCmdList.cmd[icmd - 1].crtPt.x, -revCmdList.cmd[icmd - 1].crtPt.y);
                }
                return cmd;
              },
          'z': function(cmdList, revCmdList, icmd,  cmdcode) { 
                var cmd = new pathparser.Command('z');
                return cmd;
              },
          'default': function(cmdList, revCmdList, icmd,  cmdcode) { return null; }
  };
  pathparser.addCmdCreationRules = function(ruleDictionnary) {
      for (var property in ruleDictionnary) {
        if (ruleDictionnary.hasOwnProperty(property)) {
            pathparser.cmdCreationRules[property] = ruleDictionnary[property];
            commands += property;
        }
      }         
  };
  pathparser.addStringifier =  function(tokenDictionnary) {
      for (var property in tokenDictionnary) {
        if (tokenDictionnary.hasOwnProperty(property)) {
            pathparser.TokensToString[property] = tokenDictionnary[property];
        }
      }         
  };
  // cmdList is obtained by calling  svg_parse_path on a path data    
  pathparser.fullrelativePathCmdList = function (cmdList) {
      // transform the path data to use only relative commands
      var relCmdList = new pathparser.CmdList(),
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
          var token = pathparser.cmdCreationRules[crtcmdcode] || pathparser.cmdCreationRules["default"];
          if (token) {
            cmd = token(cmdList, relCmdList, icmd, crtcmdcode);
            if (cmd)  {  relCmdList.cmd.push(cmd); cmd = null; }
          }
          icmd += 1;
      }
      return relCmdList;
  };
  pathparser.Point = function (x, y) {
      this.x = x;
      this.y = y;
      this.translate = function (dx, dy) {
          this.x += dx;
          this.y += dy;
      };
  };
  pathparser.CmdList = function () {
      this.cmd = [];
      var simpleReverse =   function(i, cmd, commandi) {
                    var pt = new pathparser.Point(-1 * commandi.target.x, -1 * commandi.target.y);
                    cmd.target = pt;
                  };
      var qortReverse =  function(i, cmd, commandi) {
                    var target = new pathparser.Point(commandi.target.x, commandi.target.y);
                    cmd.ctlpt1 = new pathparser.Point(commandi.ctlpt1.x - target.x, commandi.ctlpt1.y - target.y);
                    cmd.target = new pathparser.Point(-1 * target.x, -1 * target.y);
                    };
      this.reverseRules = {
              'M': simpleReverse,
              'h': function(i, cmd, commandi) {
                    cmd.d = -1 * commandi.d;
                  },
              'v': function(i, cmd, commandi) {
                    cmd.d = -1 * commandi.d;
                  },
              'l': simpleReverse,
              'c': function(i, cmd, commandi) {
                    var target = new pathparser.Point(commandi.target.x, commandi.target.y);
                    cmd.ctlpt1 = new pathparser.Point(commandi.ctlpt2.x - target.x, commandi.ctlpt2.y - target.y);
                    cmd.ctlpt2 = new pathparser.Point(commandi.ctlpt1.x - target.x, commandi.ctlpt1.y - target.y);
                    cmd.target = new pathparser.Point(-1 * target.x, -1 * target.y);
                  },
              'q': qortReverse, // q or t
              't': qortReverse
              };
      this.reverse = function () {
          // works only with relative commands, except the M
          // T2D2 process all the possible commands
          var revCmdList = new pathparser.CmdList(),
              i,
              cmd,
              pt,
              target;
          for (i = this.cmd.length - 1; i >= 0; i -= 1) {
              cmd = new pathparser.Command(this.cmd[i].command);
              var rule = this.reverseRules[cmd];
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
  pathparser.svg_parse_path = function (attribute_content, parser) {
      var d = attribute_content,
          cmdList = new pathparser.CmdList(),
          pp;
      if (existy(parser))
        pp = this.PathParser = parser; 
      else
        pp = this.PathParser = new PathPreProcess(pathparser, d); 
      pp.reset();
      while (!pp.isEnd()) {
          pp.nextCommand();
          pathparser.ParseToken[pp.command](pp, cmdList);
      }
      return cmdList;
  };
  // T2D2 I need to understand the following lines (inspired from code of other modules)
  if (typeof define === "function" && define.amd) {
      define(pathparser);
  } else if (typeof module === "object" && module.exports) {
      module.exports = pathparser;
  } else {
      this.pathparser = pathparser;
  }
}).call(this);