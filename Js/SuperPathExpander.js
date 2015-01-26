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
Hypothesis:
after a ref, there is always an explicit command
Method:
1) build a dictionnary of subpath definition
2) build a list of used subpath in each path
3) replace the reference of all directly defined subpath
4) for each reversely used subpath,
4.1) build the relative path geometrically identical of the path where the subpath is defined
4.2) build the reverse of the relative path
4.3) extract the reverse subpath
4.4) replace all references of the reverse subpath

but for 4.2, I need to have a completely defined path: how to deal with path where a path is defined but is followed by a reference to a reverse subpath???

pour limiter la difficulté
je pose que les subpath sont tous traités en relatif
je pose qu'un subpath commence par une commande explicite
pour l'instant, je pose qu'un path où est défini un subpath ne doit pas voir cette définition suivie par une référence à un subpath inversé (!)
sinon cette définition ne sera pas utilisable en inversé!!!!
je dois pouvoir traiter le reste (assez facilement?)

possible useful parser: see http://pastie.org/1036541

je vais mettre les définitions de chunk dans les path qui les définissent
je vais construire une table associative de chunks qui associe un nom de chunk à un path qui le définit

je peux construire une liste de path qui définissent des subpath
je peux construire une liste de subpath qui sont exploitables (possèdent une description par une liste de commandes relatives)
je peux construire une liste de path qui référencent des path dans la direction d'origine
je peux construire une liste de path qui référencent des path dans la direction invsersée

algo?
si un path définit un subpath
       résoudre les définitions du path qui précédent la définition du subpath (est-ce nécessaire? pour transformer en relatif des commandes absolues, j'ai besoin de savoir d'où je pars)
       en fait je dois remonter en arrière jusqu'à la première commande absolue rencontrée
 */
(function () {
    "use strict";
    var superpath = {
        version: "0.1.0",
        SEPARATOR: "|",
        OPENCHUNK: "(",
        ENDCHUNK: ")",
        DIRECTREF: "#",
        REVERSEDREF: "!"
    };
    superpath.chunks = []; // dictionnary of subpath
    function existy(x) {
        return (x !== null) && (x !== undefined);
    }
    // expands all the chunks found in the data, (taking care to changes in the indexes of chunks using that path!)
    function expandChunks(path, data) {
        var newpathdata,
            index,
            idSep,
            idChunk,
            ref,
            expanded,
            delta,
            iPath,
            chunk;
        if (!existy(data)) {
            data = path.getAttribute("d");
        }
        newpathdata = data;
        index = newpathdata.search(superpath.DIRECTREF);
        while (index > 0) {
            // index is the begining of the id (after superpath.DIRECTREF), superpath.SEPARATOR is the separator with the following
            idSep = newpathdata.indexOf(superpath.SEPARATOR, index + 1);
            if (idSep !== -1) {
                idChunk = newpathdata.slice(index + 1, idSep);
                ref = superpath.DIRECTREF + idChunk + superpath.SEPARATOR;
                expanded = superpath.chunks[idChunk].description + " ";
            } else {
                idChunk = newpathdata.slice(index + 1);
                ref = superpath.DIRECTREF + idChunk;
                expanded = superpath.chunks[idChunk].description;
            }
            newpathdata = newpathdata.replace(ref, expanded);
            delta = expanded.length - ref.length;
            // adjust chunks indexes for chunks defined by that path (only if there are after the replace!)
            for (iPath = 0; path.chunks.length > iPath; iPath += 1) {
                chunk = path.chunks[iPath];
                if (chunk.start > index) {
                    chunk.start += delta;
                    chunk.end += delta;
                }
            }
            // search for next chunk refernce in the path
            index = newpathdata.search(superpath.DIRECTREF);
        }
        return newpathdata;
    }
    function expandReversedChunks(path, data) {
        var newpathdata,
            index,
            idSep,
            idChunk,
            ref,
            delta,
            rData,
            iPath,
            chunk;
        if (!existy(data)) {
            data = path.getAttribute("d");
        }
        newpathdata = data;
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
            if (existy(superpath.chunks[idChunk].rData)) {
                rData = superpath.chunks[idChunk].rData;
            } else {
                rData = superpath.processReversedChunk(superpath.chunks[idChunk]);
            }
            newpathdata = newpathdata.replace(ref, rData);
            delta = rData.length - ref.length;
            // adjust chunks start and end indexes for chunks defined by that path (only if there are after the replace!)
            if (existy(path.chunks)) {
                for (iPath = 0; path.chunks.length > iPath; iPath += 1) {
                    chunk = path.chunks[iPath];
                    if (chunk.start > index) {
                        chunk.start += delta;
                        chunk.end += delta;
                    }
                }
            }
            // search for next reversed ref
            index = newpathdata.search(superpath.REVERSEDREF);
        }
        return newpathdata;
    }
    function buildCmdList(desc, startingPt) {
        // add a fake M command to resolve the absolute commands againt a reference point
        var data = "M"+startingPt.x+","+startingPt.y+desc,
            cmdList = superpath.svg_parse_path(data),
            relCmdList = superpath.fullrelativePathCmdList(cmdList);
        relCmdList.cmd = relCmdList.cmd.slice(1); // remove the fake starting 'M' command
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
        for (i=0; cmdList.cmd.length>i; i += 1) { 
            cmd = cmdList.cmd[i];
            switch(cmd.command) {
            case 'l': 
                str += cmd.command + cmd.parameters[0].x + "," + cmd.parameters[0].y;
                break;
            } 
        }
        return str;
    }
    // take a data path, complete the chunk dictionnary with found chunks, and remove the chunk definition
    function findChunks(path) {
        var newpathdata = path.getAttribute("d"),
            iStart = 0,
            chunkSeparation,
            chunkName,
            chunk,
            cmdList,
            cmdIndex,
            cmd;
        path.chunks = []; // to know chunks defined in a path
        cmdList = path.cmdList = superpath.svg_parse_path(newpathdata);
        cmdIndex = 0;
        do {
            cmd = cmdList.cmd[cmdIndex];
            if (cmd.command === "(") {
                chunkName = cmd.parameters[0];
                chunk = superpath.chunks[chunkName] = {};
                chunk.description = buildCmdList(cmd.parameters[1], cmd.crtPt); // list of commands
                chunk.reversedDescription = buildReversedCmdList(chunk.description);
                chunk.path = path; // to know the path from which comes the chunk
                chunk.data = strDescription(chunk.description);
                chunk.rData = strDescription(chunk.reversedDescription);
                // T2D2 process the replacement of the ( command
                newpathdata = newpathdata.replace(newpathdata.slice(newpathdata.indexOf("("), newpathdata.indexOf(")")+1), chunk.data);
            }
            cmdIndex += 1;
        } while (cmdList.cmd.length>cmdIndex);
        return newpathdata;
    }

    superpath.expandPaths = function () {
        var pathlist = document.getElementsByTagName("path"),
            len = pathlist.length,
            iPath = 0,
            path,
            pathdata;
        // build chunk dictionnary
        for (iPath = 0; len > iPath; iPath += 1) {
            path = pathlist[iPath];
            pathdata = path.getAttribute("d");
            if (pathdata.indexOf(superpath.OPENCHUNK) !== -1) {
                path.setAttribute("d", findChunks(path));
                // trouve les morceaux et remplace les définitions par leur valeur
            }
        }
        // expand direct chunks references
        for (iPath = 0; len > iPath; iPath += 1) {
            path = pathlist[iPath];
            pathdata = path.getAttribute("d");
            if (pathdata.search(superpath.DIRECTREF) !== -1) {
                path.setAttribute("d", expandChunks(path, pathdata));
            }
        }
        // expand reversed chunks
        for (iPath = 0; len > iPath; iPath += 1) {
            path = pathlist[iPath];
            pathdata = path.getAttribute("d");
            if (pathdata.search(superpath.REVERSEDREF) !== -1) {
                path.setAttribute("d", expandReversedChunks(path, pathdata));
            }
        }
    };
// T2D2 take chunk.start and chunk.end into account to get just the selected part of the command list
    superpath.processReversedChunk = function (chunk) {
        if (!existy(chunk.revCmdList)) {
            if (!existy(chunk.relCmdList)) {
                if (!existy(chunk.pathCmdList)) {
                    var path = chunk.path,
                        pathdata = path.getAttribute("d");
                    chunk.pathCmdList = this.svg_parse_path(pathdata);
                }
                chunk.relCmdList = this.fullrelativePathCmdList(chunk.pathCmdList);
            }
            chunk.revCmdList = this.reversedRelativeCmdList(chunk.relCmdList);
        }
        return this.svgSerializeCmdList(chunk.revCmdList);
    };
// cmdList is obtained by calling  svg_parse_path on a path data
    superpath.fullrelativePathCmdList = function (cmdList) {
        // transform the path data to use only relative commands
        var crtPt = {},
            icmd = 0,
            len = cmdList.cmd.length,
            pt;
        crtPt.x = cmdList.cmd[0].parameters[0].x;
        crtPt.y = cmdList.cmd[0].parameters[0].y;
        while (len > icmd) {
            // pour chaque commande passer en relatif et calculer le nouveau point courant
            console.log(cmdList.cmd[icmd].command);
            switch (cmdList.cmd[icmd].command) {
            case 'm':
            case 'M':
                cmdList.cmd[icmd].crtPt = {};
                cmdList.cmd[icmd].crtPt.x = cmdList.cmd[icmd].parameters[0].x;
                cmdList.cmd[icmd].crtPt.y = cmdList.cmd[icmd].parameters[0].y;
                break;
            case 'l':
                cmdList.cmd[icmd].crtPt = {};
                cmdList.cmd[icmd].crtPt.x = cmdList.cmd[icmd - 1].crtPt.x - cmdList.cmd[icmd].parameters[0].x;
                cmdList.cmd[icmd].crtPt.y = cmdList.cmd[icmd - 1].crtPt.y - cmdList.cmd[icmd].parameters[0].y;
                break;
            case 'L':
                cmdList.cmd[icmd].crtPt = {};
                cmdList.cmd[icmd].command = 'l';
                pt = {};
                pt.x = cmdList.cmd[icmd].parameters[0].x;
                pt.y = cmdList.cmd[icmd].parameters[0].y;
                cmdList.cmd[icmd].parameters[0].x = pt.x - cmdList.cmd[icmd - 1].crtPt.x;
                cmdList.cmd[icmd].parameters[0].y = pt.y - cmdList.cmd[icmd - 1].crtPt.y;
                cmdList.cmd[icmd].crtPt.x = pt.x;
                cmdList.cmd[icmd].crtPt.y = pt.y;
                break;
            case 'q':
                cmdList.cmd[icmd].crtPt = {};
                cmdList.cmd[icmd].crtPt.x = cmdList.cmd[icmd - 1].crtPt.x - cmdList.cmd[icmd].parameters[1].x;
                cmdList.cmd[icmd].crtPt.y = cmdList.cmd[icmd - 1].crtPt.y - cmdList.cmd[icmd].parameters[1].y;
                break;
            case 'Q':
                cmdList.cmd[icmd].crtPt = {};
                cmdList.cmd[icmd].command = 'q';
                cmdList.cmd[icmd].crtPt.x = cmdList.cmd[icmd].parameters[2].x;
                cmdList.cmd[icmd].crtPt.y = cmdList.cmd[icmd].parameters[2].y;
                cmdList.cmd[icmd].parameters[0].x -= cmdList.cmd[icmd - 1].crtPt.x;
                cmdList.cmd[icmd].parameters[0].y -= cmdList.cmd[icmd - 1].crtPt.y;
                cmdList.cmd[icmd].parameters[1].x -= cmdList.cmd[icmd - 1].crtPt.x;
                cmdList.cmd[icmd].parameters[1].y -= cmdList.cmd[icmd - 1].crtPt.y;
                cmdList.cmd[icmd].parameters[2].x -= cmdList.cmd[icmd - 1].crtPt.x;
                cmdList.cmd[icmd].parameters[2].y -= cmdList.cmd[icmd - 1].crtPt.y;
                break;
            case 'c':
                cmdList.cmd[icmd].crtPt = {};
                cmdList.cmd[icmd].crtPt.x = cmdList.cmd[icmd - 1].crtPt.x - cmdList.cmd[icmd].parameters[2].x;
                cmdList.cmd[icmd].crtPt.y = cmdList.cmd[icmd - 1].crtPt.y - cmdList.cmd[icmd].parameters[2].y;
                break;
            case 'C':
                cmdList.cmd[icmd].crtPt = {};
                cmdList.cmd[icmd].command = 'c';
                cmdList.cmd[icmd].crtPt.x = cmdList.cmd[icmd].parameters[1].x;
                cmdList.cmd[icmd].crtPt.y = cmdList.cmd[icmd].parameters[1].y;
                cmdList.cmd[icmd].parameters[0].x -= cmdList.cmd[icmd - 1].crtPt.x;
                cmdList.cmd[icmd].parameters[0].y -= cmdList.cmd[icmd - 1].crtPt.y;
                cmdList.cmd[icmd].parameters[1].x -= cmdList.cmd[icmd - 1].crtPt.x;
                cmdList.cmd[icmd].parameters[1].y -= cmdList.cmd[icmd - 1].crtPt.y;
                break;
            case 'z': //
                break;
            }
            icmd += 1;
        }
        return cmdList;
    };
    superpath.svgSerializeCmdList = function (cmdList) {
        var data = "",
            pt;
        cmdList.cmd.forEach(function (cmd) {
            data += cmd.command;
            switch (cmd.command) {
            case 'l':
            case 'L':
                pt = cmd.parameters[0];
                data += pt.x + "," + pt.y;
                break;
            case 'm':
            case 'M':
                pt = cmd.parameters[0];
                data += pt.x + "," + pt.y;
                break;
            case 'q':
                break;
            case 'Q':
                break;
            case 'c':
                break;
            case 'C':
                break;
            case 'z': //
                break;
            }
        });
        return data;
    };
    superpath.reversedRelativeCmdList = function (cmdList) {
        var newCmdList = new superpath.CmdList,
            len = cmdList.cmd.length,
            icmd = len - 1,
            closedPath = (cmdList.cmd[icmd].command === 'z' ? true : false),
            cmd = {};
        // reverse the complete relative path
        if (closedPath) {
            cmd.command = 'M';
            cmd.parameters = [];
            cmd.parameters[0] = {
            };
            cmd.parameters[0].x = cmdList.cmd[icmd - 1].crtPt.x;
            cmd.parameters[0].y = cmdList.cmd[icmd - 1].crtPt.y;
            newCmdList.push(cmd);
            icmd -= 1;
        }
        // if closed, let the first M command as is; else ???
        while (icmd > 0) {
            switch (cmdList.cmd[icmd].command) {
            case 'l':
                cmd = {};
                cmd.command = 'l';
                cmd.parameters = cmdList.cmd[icmd].parameters;
                cmd.parameters[0].x *= -1;
                cmd.parameters[0].y *= -1;
                newCmdList.push(cmd);
                break;
            case 'q':
                break;
            case 'c':
                break;
            case 'z': // go from the starting point of the original path to the end
                break;
            }
            icmd -= 1;
        }
        if (closedPath) {
            cmd = {
            };
            cmd.command = 'z';
            newCmdList.push(cmd);
        }
        return newCmdList;
    };
    superpath.reversePathData2 = function (data) {
        var cmdList = this.svg_parse_path(data);
        cmdList = this.fullrelativePathCmdList(cmdList);
        cmdList = this.reversedRelativeCmdList(cmdList);
        return this.svgSerializeCmdList(cmdList);
    };
    superpath.reversePathData = function (data) {
        // T2D2 reverse the piece (chunk) data as a part of a complete path, then extract the chunk
        // T2D2 isolate the code which reverse a path then isolate the case for each command
        /*  T2D2
        I think i need to change all the commands to relative
        then I can get a reverse relative path
        I need to be able to find the reversed chunk associated with a chunk
        I think it for chunk to(startchunk, endchunk) teh reversed chunk is from (lchunk-endchunk, lchunk-startchunk)
         */
        var newdata = "",
            crtPt,
            i,
            cmd,
            previousCmd,
            pt,
            ctrlPt,
            targetPt,
            ctrlPt1,
            ctrlPt2,
            closedPath = false,
            cmdList = this.svg_parse_path(data);
        // reverse the command list to build the new data
        // some commands depends of the current point, like Q,
        // so I need to add the current point when building the list
        // or to replace absolutes commands by  relatives one
        i = cmdList.cmd.length - 1;
        if (cmdList.cmd[i].command === 'z') {
            crtPt = cmdList.cmd[i - 1].parameters[0];
            newdata += "M" + crtPt.x + "," + crtPt.y;
            closedPath = true;
            i -= 1;
        } else {
            crtPt = cmdList.cmd[i].parameters[0];
            newdata += "M" + crtPt.x + "," + crtPt.y;
        }
        while (i > 0) {
            cmd = cmdList.cmd[i];
            previousCmd = cmdList.cmd[i - 1];
            switch (cmd.command) {
            case 'l':
                pt = cmd.parameters[0];
                newdata += "l" + (-1.0 * pt.x) + "," + (-1.0 * pt.y);
                break;
            case 'L':
                pt = previousCmd.parameters[0];
                newdata += "L" + pt.x + "," + pt.y;
                break;
            case 'q':
                ctrlPt = cmd.parameters[0];
                targetPt = cmd.parameters[1];
                newdata += "q" + (-targetPt.x + ctrlPt.x) + "," + (-targetPt.y + ctrlPt.y) + " " + (-1.0 * targetPt.x) + "," + (-1.0 * targetPt.y);
                break;
            case 'Q':
                pt = cmdList.cmd[i - 1].endPt;
                ctrlPt = cmd.parameters[0];
                targetPt = cmd.parameters[1];
                newdata += "Q" + ctrlPt.x + "," + ctrlPt.y + " " + pt.x + "," + pt.y;
                break;
            case 'c':
                ctrlPt1 = cmd.parameters[0];
                ctrlPt2 = cmd.parameters[1];
                targetPt = cmd.parameters[2];
                newdata += "c" +
                    (-targetPt.x + ctrlPt2.x) + "," + (-targetPt.y + ctrlPt2.y) + " " +
                    (-targetPt.x + ctrlPt1.x) + "," + (-targetPt.y + ctrlPt1.y) + " " +
                    (-1.0 * targetPt.x) + "," + (-1.0 * targetPt.y);
                break;
            case 'C':
                pt = cmdList.cmd[i - 1].endPt;
                ctrlPt1 = cmd.parameters[0];
                ctrlPt2 = cmd.parameters[1];
                targetPt = cmd.parameters[2];
                newdata += "C" + ctrlPt2.x + "," + ctrlPt2.y + " " + ctrlPt1.x + "," + ctrlPt1.y + " " + pt.x + "," + pt.y;
                break;
            case 'z': //
                break;
            }
            i -= 1;
        }
        newdata += (closedPath ? "z" : "");
        return newdata;
    };
    superpath.CmdList = function() {
        this.cmd = [];
        this.processCurrentPoints = function(startCmd) {
            var icmd = startCmd,
                crtCmd;
            for (; icmd > 0; icmd -= 1) {
            // T2D2
            }
        };
        this.getSubpathStartingPoint = function(id) {
            var icmd = 0,
                cmd;
            for (icmd=0; this.cmd.length>icmd+1; icmd += 1) {
                cmd = this.cmd[icmd];
                if ((cmd.command==="(")&&(cmd.parameters[0]===id)) {
                    if (existy(cmd.crtPt)) {
                        return cmd.crtPt;
                    } else {
                    // try to process the starting point for the subpath
                    // here it could be efficient to only start from the current cmd and reward until the first known absolute point
                        this.processCurrentPoints(icmd);
                    }
                }
            }
            return null;
        };
        this.reverse = function(){
          var revCmdList = new superpath.CmdList,
              i,
              cmd,
              pt;
          for (i=this.cmd.length - 1; i >= 0; i -= 1) {
              cmd = {};
              cmd.command = this.cmd[i].command;
              cmd.parameters = [];
              pt = {};
              pt.x = -1 * this.cmd[i].parameters[0].x; // T2D2 différencier suivant la commande 
              pt.y = -1 * this.cmd[i].parameters[0].y;
              cmd.parameters.push(pt); 
              revCmdList.push(cmd);
          }
          return revCmdList;
        }    
        this.push = function(cmd) {
            this.cmd.push(cmd);
        }
        this.toString = function () {
            var i = 0,
                ipar,
                str = "";
            while (this.cmd.length>i) {
                str += this.cmd[i].command;
                if (existy(this.cmd[i].parameters)) {
                  if (this.cmd[i].command === "(")
                  {
                      str += this.cmd[i].parameters[0] + "|" + this.cmd[i].parameters[1];
                  } else {
                    for (ipar=0; this.cmd[i].parameters.length>ipar; ipar += 1) {
                        str+= this.cmd[i].parameters[ipar].x+","+this.cmd[i].parameters[ipar].y;
                    }
                  }
                }
                i += 1;
            }
            return str;
        };
    }
    // parsing path ; source inspired from canvg library
    // T2D2 join the author
    // T2D2 check for the following problem:
    //  possible that doesn't work if the id of the chunk contains a cmd code and if a chunk contains a chunk
    // recursivity and circularity of the chunk functionality must be analyzed
    superpath.svg_parse_path = function (attribute_content) {
        var d = attribute_content,
            cmdList = new superpath.CmdList,
            pp,
            p,
            newP,
            cmd,
            coord,
            cntrl,
            cntrl1,
            cntrl2,
            cp,
            t,
            idsubpath,
            descriptionsubpath;
        this.compressSpaces = function (s) {
            return s.replace(/[\s\r\t\n]+/gm, ' ');
        };
        this.trim = function (s) {
            return s.replace(/^\s+|\s+$/g, '');
        };
        // T2D2: convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
        d = d.replace(/,/gm, ' '); // get rid of all commas
        // T2D2 undestand why the following line is repeted two times
        d = d.replace(/([MmZzLlHhVvCcSsQqTtAa(#!)])([MmZzLlHhVvCcSsQqTtAa(#!)])/gm, '$1 $2'); // separate commands from commands
        d = d.replace(/([MmZzLlHhVvCcSsQqTtAa(#!)])([MmZzLlHhVvCcSsQqTtAa(#!)])/gm, '$1 $2'); // separate commands from commands
        d = d.replace(/([MmZzLlHhVvCcSsQqTtAa(#!)])([^\s])/gm, '$1 $2'); // separate commands from points
        d = d.replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa(#!)])/gm, '$1 $2'); // separate commands from points
        d = d.replace(/([0-9])([+\-])/gm, '$1 $2'); // separate digits when no comma
        d = d.replace(/(\.[0-9]*)(\.)/gm, '$1 $2'); // separate digits when no comma
        d = d.replace(/([Aa](\s+[0-9]+){3})\s+ ([01])\s*([01])/gm, '$1 $3 $4 '); // shorthand elliptical arc path syntax
        d = this.compressSpaces(d); // compress multiple spaces
        d = this.trim(d);
        this.PathParser = new (function(d) {
            this.tokens = d.split(' ');
            this.reset = function () {
                this.i = -1;
                this.command = '';
                this.previousCommand = '';
                this.start = new this.Point(0, 0);
                this.control = new this.Point(0, 0);
                this.current = new this.Point(0, 0);
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
                return this.tokens[this.i + 1].match(/^[A-Za-z(#!]$/) !== null;
            };
            this.isRelativeCommand = function () {
                switch (this.command) {
                case 'm':
                case 'l':
                case 'h':
                case 'v':
                case 'c':
                case 's':
                case 'q':
                case 't':
                case 'a':
                case 'z':
                // folowing lines are for superpath extension
                case '#':
                case '!':
                case '(':
                    return true;
                }
                return false;
            };
            this.getToken = function () {
                this.i += 1;
                return this.tokens[this.i];
            };
            this.getId = function () {
                var id = this.getToken();
                return id.slice(0,id.indexOf("|"));
            };
            this.getSubpathDesc = function () {
                var str = this.getToken();
                var toc = this.getToken();
                while (toc !== ")") { str +=  toc+" "; toc = this.getToken(); };
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
                var p = new this.Point(this.getScalar(), this.getScalar());
                return (relative ? p : this.makeAbsolute(p));
            };
            this.getAsControlPoint = function (relative) {
                var p = this.getPoint(relative);
                this.control = p;
                return p;
            };
            this.getAsCurrentPoint = function (relative) {
                var p = this.getPoint(relative);
                this.current = p;
                return p;
            };
            this.getReflectedControlPoint = function () {
                if (this.previousCommand.toLowerCase() !== 'c' &&
                        this.previousCommand.toLowerCase() !== 's' &&
                        this.previousCommand.toLowerCase() !== 'q' &&
                        this.previousCommand.toLowerCase() !== 't') {
                    return this.current;
                }
                // reflect point
                var p = new this.Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);
                return p;
            };
            this.Point = function (x, y) {
                this.x = x;
                this.y = y;
            };
            this.makeAbsolute = function (p) {
                if (this.isRelativeCommand()) {
                    p.x += this.current.x;
                    p.y += this.current.y;
                }
                return p;
            };
        })(d);
        pp = this.PathParser;
        pp.reset();
        while (!pp.isEnd()) {
            pp.nextCommand();
            switch (pp.command) {
            case 'M':
            case 'm':
                p = pp.getAsCurrentPoint(pp.isRelativeCommand());
                cmd = {};
                cmd.command = pp.command;
                cmd.parameters = [];
                cmd.parameters.push(p);
                cmd.endPt = p;
                cmd.absEndPt = p;
                cmdList.push(cmd);
                pp.start = pp.current;
                while (!pp.isCommandOrEnd()) {
                    p = pp.getAsCurrentPoint(pp.isRelativeCommand());
                    cmd = {};
                    cmd.command = "L";
                    cmd.parameters = [];
                    cmd.parameters.push(p);
                    cmd.endPt = {};
                    cmd.endPt.x = p.x;
                    cmd.endPt.y = p.y;
                    cmd.absEndPt = {};
                    cmd.absEndPt.x = p.x;
                    cmd.absEndPt.y = p.y;
                    cmdList.push(cmd);
                }
                break;
            case 'L':
            case 'l':
                do {
                    cmd = {};
                    cmd.current = pp.current;
                    p = pp.getAsCurrentPoint(pp.isRelativeCommand());
                    cmd.command = pp.command;
                    cmd.parameters = [];
                    cmd.parameters.push(p);
                    cmd.endPt = {};
                    cmd.endPt.x = p.x;
                    cmd.endPt.y = p.y;
                    cmd.absEndPt = {};
                    cmd.absEndPt.x = p.x;
                    cmd.absEndPt.y = p.y;
                    if (pp.isRelativeCommand(cmd.command)) {
                        if (existy(cmdList.cmd[cmdList.cmd.length-1].absEndPt)) {
                          cmd.absEndPt.x += cmdList.cmd[cmdList.cmd.length-1].absEndPt.x;
                          cmd.absEndPt.y += cmdList.cmd[cmdList.cmd.length-1].absEndPt.y;
                        }
                    }
                    cmdList.push(cmd);
                } while (!pp.isCommandOrEnd());
                break;
            case 'H':
            case 'h':
                do {
                    cmd = {};
                    cmd.current = pp.current;
                    coord = pp.getScalar();
                    t = pp.isRelativeCommand();
                    newP = new pp.Point((pp.isRelativeCommand() ? pp.current.x : 0) + coord, pp.current.y);
                    pp.current = newP;
                    cmd.command = pp.command;
                    cmd.parameters = [];
                    cmd.parameters.push((pp.isRelativeCommand() ? pp.current.x : 0) + coord);
                    cmd.endPt = newP;
                    cmdList.push(cmd);
                } while (!pp.isCommandOrEnd());
                break;
            case 'V':
            case 'v':
                do {
                    cmd = {};
                    cmd.current = pp.current;
                    coord = pp.getScalar();
                    newP = new pp.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + coord);
                    pp.current = newP;
                    cmd.command = pp.command;
                    cmd.parameters = [];
                    cmd.parameters.push((pp.isRelativeCommand() ? pp.current.x : 0) + coord);
                    cmd.endPt = newP;
                    cmdList.push(cmd);
                } while (!pp.isCommandOrEnd());
                break;
            case 'C':
            case 'c':
                do {
                    cmd = {};
                    cmd.current = pp.current;
                    cntrl1 = pp.getAsControlPoint(pp.isRelativeCommand());
                    cntrl2 = pp.getAsControlPoint(pp.isRelativeCommand());
                    cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                    cmd.command = pp.command;
                    cmd.parameters = [];
                    cmd.parameters.push(cntrl1);
                    cmd.parameters.push(cntrl2);
                    cmd.parameters.push(cp);
                    cmd.endPt = cp;
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
                    cmd = {};
                    cmd.current = pp.current;
                    cntrl = pp.getAsControlPoint(pp.isRelativeCommand());
                    cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
                    cmd.command = pp.command;
                    cmd.parameters = [];
                    cmd.parameters.push(cntrl);
                    cmd.parameters.push(cp);
                    cmd.endPt = cp;
                    cmdList.push(cmd);
                } while (!pp.isCommandOrEnd());
                break;
            case '(':
                cmd = {};
                cmd.command = pp.command;
                cmd.parameters = [];
                idsubpath = pp.getId();
                descriptionsubpath = pp.getSubpathDesc();
                cmd.parameters.push(idsubpath);
                cmd.parameters.push(descriptionsubpath);
                if (existy(cmdList.cmd[cmdList.cmd.length-1].absEndPt)) {
                    cmd.crtPt = cmdList.cmd[cmdList.cmd.length-1].absEndPt; 
                }
                cmdList.push(cmd);
                break;
            case '#':
                cmd = {};
                cmd.command = pp.command;
                cmdList.push(cmd);
                break;
            case '!':
                cmd = {};
                cmd.command = pp.command;
                cmdList.push(cmd);
                break;
            case 'T':
            case 't':
                break;
            case 'A':
            case 'a':
                break;
            case 'Z':
            case 'z':
                do {
                    cmd = {};
                    cmd.current = pp.current;
                    cmd.command = pp.command;
                    cmdList.push(cmd);
                } while (!pp.isCommandOrEnd());
                break;
            }
        }
        return cmdList;
    };
    if (typeof define === "function" && define.amd) {
        define(superpath);
    } else if (typeof module === "object" && module.exports) {
        module.exports = superpath;
    } else {
        this.superpath = superpath;
    }
}).call(this);