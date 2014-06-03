/*
 *			SuperPath - SVG Extension
 *
 *			Author: Jean-Claude Moissinac
 *			Copyright (c) Telecom ParisTech 2013-2014
 *					All rights reserved
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
 */
(function() {
  var superpath = {
    version: "0.0.1"
  };
 
   superpath.XMLRI_STRING = 1; // constant
  superpath.XMLRI_ELEMENTID = 2; // constant
  
  superpath.expandPaths = function() {
      var pathlist=document.getElementsByTagName("path");
      var len = pathlist.length;
      for (var i=0; i<len; ++i) {
          var pathdata = pathlist[i].getAttribute("d");
          if ((pathdata.search("P")!=-1)||(pathdata.search("R")!=-1)||(pathdata.search("p")!=-1)||(pathdata.search("r")!=-1))
          {
            pathlist[i].setAttribute("d", expandPieceInPathData(pathdata));
          }
      }          
  }
  
  function expandPieceInPathData(data)
  {
      var newpathdata = data;
      var index = newpathdata.search("#");                                                                                                
      var pieceref;
      while (index>0)
      {
        //alert(newpathdata[index-1]);
        switch(command = newpathdata[index-1])
        {
        case 'P':
        case 'p':
          iripiece = svg_parse_iri(newpathdata.slice(index).split(" ")[0]);
          newpathdata=newpathdata.replace(command+iripiece.string, iripiece.target.getAttribute("d"));
          break;
        case 'R':
        case 'r':
          iripiece = svg_parse_iri(newpathdata.slice(index).split(" ")[0]);
          newpathdata=newpathdata.replace(command+iripiece.string, reversePathData(svg_parse_path(iripiece.target.getAttribute("d"))));
          break;
        }
        index = newpathdata.search("#");
      }
      return newpathdata;
  }
  
  function reversePathData(cmdList)
  {
    // TODO reverse the piece (chunk) data
    var newdata = "";
    var crtPt;
    // reverse the command list to build the new data
    // some commands depends of the current point, like Q, 
    // so I need to add the current point when building the list 
    // or to replace absolutes commands by  relatives one
    var i = cmdList.length-1;
    while (i>0)
    {
      var cmd = cmdList[i];
      switch(cmd.command)
      {
        case 'l':
          var pt = cmd.parameters[0];;
          newdata += "l"+(-1.0*pt.x)+","+(-1.0*pt.y);
        break;
        case 'L':
          var pt = cmdList[i-1].endPt;
          newdata += "L"+pt.x+","+pt.y;
        break;
        case 'q':
           var ctrlPt = cmd.parameters[0];
           var targetPt = cmd.parameters[1];
           newdata += "q"+(-targetPt.x+ctrlPt.x)+","+(-targetPt.y+ctrlPt.y)+" "+(-1.0*targetPt.x)+","+(-1.0*targetPt.y);
        break;
        case 'Q':
          var pt = cmdList[i-1].endPt;
           var ctrlPt = cmd.parameters[0];
           var targetPt = cmd.parameters[1];
           newdata += "Q"+ctrlPt.x+","+ctrlPt.y+" "+pt.x+","+pt.y;
        break;
        case 'c':
           var ctrlPt1 = cmd.parameters[0];
           var ctrlPt2 = cmd.parameters[1];
           var targetPt = cmd.parameters[2];
           newdata += "c"+
                (-targetPt.x+ctrlPt2.x)+","+(-targetPt.y+ctrlPt2.y)+" "+
                (-targetPt.x+ctrlPt1.x)+","+(-targetPt.y+ctrlPt1.y)+" "+
                (-1.0*targetPt.x)+","+(-1.0*targetPt.y);
        break;
        case 'C':
          var pt = cmdList[i-1].endPt;
           var ctrlPt1 = cmd.parameters[0];
           var ctrlPt2 = cmd.parameters[1];
           var targetPt = cmd.parameters[2];
           newdata += "C"+ctrlPt2.x+","+ctrlPt2.y+" "+ctrlPt1.x+","+ctrlPt1.y+" "+pt.x+","+pt.y;
        break;
        case '':
          crtPt = cmd.current; 
          newdata += "l0,0";//"L"+crtPt.x+","+crtPt.y;
        break;        
      }
      i--;
    }
    return newdata;
  }
  
  
  function svg_parse_iri(attribute_content)
  {
    var iri = new Object();
    // alert(attribute_content);
    if (attribute_content[0] == '#') {
    iri.string = attribute_content;
    iri.target = document.getElementById(attribute_content.slice(1));
    // alert(iri.target);
    if (!iri.target) {
    iri.type = superpath.XMLRI_STRING;
    } else {
    iri.type = superpath.XMLRI_ELEMENTID;
    }
    } else {
    iri.type = superpath.XMLRI_STRING;
    iri.string = attribute_content;
    }
    return iri;
  }
  
  function svg_parse_idref(attribute_content)
  {
    var iri = new Object();
    iri.type = superpath.XMLRI_ELEMENTID;
    iri.target = document.getElementById(attribute_content);
    if (!iri.target) {
      iri.string = gf_strdup(attribute_content);
    }
  }
  
  // parsing path ; source inspired from canvg library
  function svg_parse_path(attribute_content) 
  {
    var d = attribute_content;
    this.compressSpaces = function(s) { return s.replace(/[\s\r\t\n]+/gm,' '); }
    this.trim = function(s) { return s.replace(/^\s+|\s+$/g, ''); }
    
    // TODO: convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
    d = d.replace(/,/gm,' '); // get rid of all commas
    d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([MmZzLlHhVvCcSsQqTtAa])/gm,'$1 $2'); // separate commands from commands
    d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([MmZzLlHhVvCcSsQqTtAa])/gm,'$1 $2'); // separate commands from commands
    d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([^\s])/gm,'$1 $2'); // separate commands from points
    d = d.replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa])/gm,'$1 $2'); // separate commands from points
    d = d.replace(/([0-9])([+\-])/gm,'$1 $2'); // separate digits when no comma
    d = d.replace(/(\.[0-9]*)(\.)/gm,'$1 $2'); // separate digits when no comma
    d = d.replace(/([Aa](\s+[0-9]+){3})\s+([01])\s*([01])/gm,'$1 $3 $4 '); // shorthand elliptical arc path syntax
    d = this.compressSpaces(d); // compress multiple spaces
    d = this.trim(d);
    this.PathParser = new (function(d) {
    	this.tokens = d.split(' ');
    	
    	this.reset = function() {
    		this.i = -1;
    		this.command = '';
    		this.previousCommand = '';
    		this.start = new this.Point(0, 0);
    		this.control = new this.Point(0, 0);
    		this.current = new this.Point(0, 0);
    		this.points = [];
    		this.angles = [];
    	}
    					
    	this.isEnd = function() {
    		return this.i >= this.tokens.length - 1;
    	}
    	
    	this.isCommandOrEnd = function() {
    		if (this.isEnd()) return true;
    		return this.tokens[this.i + 1].match(/^[A-Za-z]$/) != null;
    	}
    	
    	this.isRelativeCommand = function() {
    		switch(this.command)
    		{
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
    				return true;
    				break;
    		}
    		return false;
    	}
    				
    	this.getToken = function() {
    		this.i++;
    		return this.tokens[this.i];
    	}
    	
    	this.getScalar = function() {
    		return parseFloat(this.getToken());
    	}
    	
    	this.nextCommand = function() {
    		this.previousCommand = this.command;
    		this.command = this.getToken();
    	}				
    	
    	this.getPoint = function(relative) { // if relative is false, make the point absolute
    		var p = new this.Point(this.getScalar(), this.getScalar());
    		return (relative?p:this.makeAbsolute(p));
    	}
    	
    	this.getAsControlPoint = function(relative) {
    		var p = this.getPoint(relative);
    		this.control = p;
    		return p;
    	}
    	
    	this.getAsCurrentPoint = function(relative) {
    		var p = this.getPoint(relative);
    		this.current = p;
    		return p;	
    	}
    	
    	this.getReflectedControlPoint = function() {
    		if (this.previousCommand.toLowerCase() != 'c' && 
    		    this.previousCommand.toLowerCase() != 's' &&
    			this.previousCommand.toLowerCase() != 'q' && 
    			this.previousCommand.toLowerCase() != 't' ){
    			return this.current;
    		}
    		
    		// reflect point
    		var p = new this.Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);					
    		return p;
    	}
    	
      this.Point = function(x, y) {
    		this.x = x;
    		this.y = y;
    	}	
    
    	this.makeAbsolute = function(p) {
    		if (this.isRelativeCommand()) {
    			p.x += this.current.x;
    			p.y += this.current.y;
    		}
    		return p;
    	}
    	
    })(d);
    
    // get an command list representation of the path
    {
    	var pp = this.PathParser;
    	var cmdList = new Array();
    	cmdList.toString= function(){
    	  var i = 0;
    	  var str = "";
    	  while (i < this.length)
    	  {
    	      str += this[i].command + " " + this[i].parameters + "\n";
    	      i++;
        }
        return str;
      }
    	pp.reset();
    
    	while (!pp.isEnd()) {
    		pp.nextCommand();
    		switch (pp.command) {
    		case 'M':
    		case 'm':
    			var p = pp.getAsCurrentPoint(pp.isRelativeCommand());
    			var cmd = new Object();
          cmd.command = pp.command;
          cmd.parameters = new Array();
          cmd.parameters.push(p);
          cmdList.push(cmd);
    			pp.start = pp.current;
    			while (!pp.isCommandOrEnd()) {
    				var p = pp.getAsCurrentPoint(pp.isRelativeCommand());
    				var cmd = new Object();
            cmd.command = "M";
            cmd.parameters = new Array();
            cmd.parameters.push(p);
            cmdList.push(cmd);
    			}
    			break;
    		case 'L':
    		case 'l':
    			while (!pp.isCommandOrEnd()) {
    				var cmd = new Object();
            cmd.current = pp.current;
    				var p = pp.getAsCurrentPoint(pp.isRelativeCommand());
            cmd.command = pp.command;
            cmd.parameters = new Array();
            cmd.parameters.push(p);
            cmd.endPt = p;
            cmdList.push(cmd);
    			}
    			break;
    		case 'H':
    		case 'h':
    			while (!pp.isCommandOrEnd()) {
    				var cmd = new Object();
            cmd.current = pp.current;
    			  var coord = pp.getScalar();
    			  var t =   pp.isRelativeCommand();
    				var newP = new pp.Point((pp.isRelativeCommand() ? pp.current.x : 0) + coord, pp.current.y);
    				pp.current = newP;
            cmd.command = pp.command;
            cmd.parameters = new Array();
            cmd.parameters.push((pp.isRelativeCommand() ? pp.current.x : 0) + coord);
            cmd.endPt = newP;
            cmdList.push(cmd);
    			}
    			break;
    		case 'V':
    		case 'v':
    			while (!pp.isCommandOrEnd()) {
    				var cmd = new Object();
            cmd.current = pp.current;
    			  var coord = pp.getScalar();
    				var newP = new pp.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + coord);
    				pp.current = newP;
            cmd.command = pp.command;
            cmd.parameters = new Array();
            cmd.parameters.push((pp.isRelativeCommand() ? pp.current.x : 0) + coord);
            cmd.endPt = newP;
            cmdList.push(cmd);
    			}
    			break;
    		case 'C':
    		case 'c':
          while (!pp.isCommandOrEnd()) {
    				var cmd = new Object();
            cmd.current = pp.current;
    				var cntrl1 = pp.getAsControlPoint(pp.isRelativeCommand());
    				var cntrl2 = pp.getAsControlPoint(pp.isRelativeCommand());
    				var cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
            cmd.command = pp.command;
            cmd.parameters = new Array();
            cmd.parameters.push(cntrl1);
            cmd.parameters.push(cntrl2);
            cmd.parameters.push(cp);
            cmdList.push(cmd);
    			}
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
          while (!pp.isCommandOrEnd()) {
    				var cmd = new Object();
            cmd.current = pp.current;
    				var cntrl = pp.getAsControlPoint(pp.isRelativeCommand());
    				var cp = pp.getAsCurrentPoint(pp.isRelativeCommand());
            cmd.command = pp.command;
            cmd.parameters = new Array();
            cmd.parameters.push(cntrl);
            cmd.parameters.push(cp);
            cmd.endPt = cp;
            cmdList.push(cmd);
    			}
          break;
    		case 'T':
    		case 't':
          break;
    		case 'A':
    		case 'a':
          break;
    		case 'Z':
    		case 'z':
    		}
    	}
    }
    // add a null command "" with the current point
  	var cmd = new Object();
    cmd.current = pp.current;
    cmd.command = "";
    cmdList.push(cmd);
   
    return cmdList;
  }
  if (typeof define === "function" && define.amd) {
    define(superpath);
  } else if (typeof module === "object" && module.exports) {
    module.exports = superpath;
  } else {
    this.superpath = superpath;
  }
}).call(this);