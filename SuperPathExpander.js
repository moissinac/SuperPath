var XMLRI_STRING = 1; // constant
var XMLRI_ELEMENTID = 2; // constant
function expandPaths() {
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
  // TODO reverse the path data
  var newdata = "";
  // reverse the command list to build the new data
  // I suspect that some commands depends of the current point
  var i = cmdList.length-1;
  while (i>=0)
  {
    var cmd = cmdList[i];
    switch(cmd.command)
    {
      case 'L':
        var pt = cmd.parameters[0];
        newdata += "L"+pt.x+","+pt.y;              
      break;
    }
    i--;
  }
  return newdata;
}

// take a path data (d attribute); return a list of commands with parameters
/* inspired by gpac et de canvg
function svg_parse_path(attribute_content)
{
this.isEnd = function() {
return this.i >= this.tokens.length - 1;
}

var d_commands = new Object();
var d = attribute_content;
if (d.strlen()) {
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

this.tokens = d.split(' ');

var pt, cur_pt = new Object(), prev_m_pt = new Object();
var command;
var i, k;
var c, prev_c = 'M';
i = 0;
cur_pt.x = cur_pt.y = 0;
prev_m_pt.x = prev_m_pt.y = 0;
while(1) {
while ( (d[i]==' ') || (d[i] =='\t') ) i++;
c = d[i];
if (!c) break;
next_command:
switch (c) {
case 'm':
case 'M':
	i++;
	i += svg_parse_number(&(d[i]), &(pt->x), 0);
	i += svg_parse_number(&(d[i]), &(pt->y), 0);
	if (c == 'm') {
		pt->x += cur_pt.x;
		pt->y += cur_pt.y;
	}
	cur_pt.x = pt->x;
	cur_pt.y = pt->y;
	prev_m_pt = cur_pt;
	prev_c = c;
	break;
case 'L':
case 'l':
	i++;
	i += svg_parse_number(&(d[i]), &(pt->x), 0);
	i += svg_parse_number(&(d[i]), &(pt->y), 0);
	if (c == 'l') {
		pt->x += cur_pt.x;
		pt->y += cur_pt.y;
	}
	cur_pt.x = pt->x;
	cur_pt.y = pt->y;
	prev_c = c;
	break;
case 'H':
case 'h':
	i++;
	i += svg_parse_number(&(d[i]), &(pt->x), 0);
	if (c == 'h') {
		pt->x += cur_pt.x;
	}
	pt->y = cur_pt.y;
	cur_pt.x = pt->x;
	prev_c = c;
	break;
case 'V':
case 'v':
	i++;
	i += svg_parse_number(&(d[i]), &(pt->y), 0);
	if (c == 'v') {
		pt->y += cur_pt.y;
	}
	pt->x = cur_pt.x;
	cur_pt.y = pt->y;
	prev_c = c;
	break;
case 'C':
case 'c':
	i++;

	for (k=0; k<3; k++) {
		i += svg_parse_number(&(d[i]), &(pt->x), 0);
		i += svg_parse_number(&(d[i]), &(pt->y), 0);
		if (c == 'c') {
			pt->x += cur_pt.x;
			pt->y += cur_pt.y;
		}
	}
	cur_pt.x = pt->x;
	cur_pt.y = pt->y;
	prev_c = c;
	break;
case 'S':
case 's':
	i++;

	for (k=0; k<2; k++) {
		i += svg_parse_number(&(d[i]), &(pt->x), 0);
		i += svg_parse_number(&(d[i]), &(pt->y), 0);
		if (c == 's') {
			pt->x += cur_pt.x;
			pt->y += cur_pt.y;
		}
	}
	cur_pt.x = pt->x;
	cur_pt.y = pt->y;
	prev_c = c;
	break;
case 'Q':
case 'q':
	i++;

	for (k=0; k<2; k++) {
		i += svg_parse_number(&(d[i]), &(pt->x), 0);
		i += svg_parse_number(&(d[i]), &(pt->y), 0);
		if (c == 'q') {
			pt->x += cur_pt.x;
			pt->y += cur_pt.y;
		}
	}
	cur_pt.x = pt->x;
	cur_pt.y = pt->y;
	prev_c = c;
	break;
case 'T':
case 't':
	i++;
	i += svg_parse_number(&(d[i]), &(pt->x), 0);
	i += svg_parse_number(&(d[i]), &(pt->y), 0);
	if (c == 't') {
		pt->x += cur_pt.x;
		pt->y += cur_pt.y;
	}
	cur_pt.x = pt->x;
	cur_pt.y = pt->y;
	prev_c = c;
	break;
case 'A':
case 'a':
	{
		Fixed tmp;
		i++;
		i += svg_parse_number(&(d[i]), &(pt->x), 0);
		i += svg_parse_number(&(d[i]), &(pt->y), 0);

		i += svg_parse_number(&(d[i]), &(tmp), 0);
		i += svg_parse_number(&(d[i]), &(tmp), 0);
		i += svg_parse_number(&(d[i]), &(tmp), 0);

		i += svg_parse_number(&(d[i]), &(pt->x), 0);
		i += svg_parse_number(&(d[i]), &(pt->y), 0);
		if (c == 'a') {
			pt->x += cur_pt.x;
			pt->y += cur_pt.y;
		}
		cur_pt.x = pt->x;
		cur_pt.y = pt->y;
	}
	prev_c = c;
	break;
case 'Z':
case 'z':
	i++;
	prev_c = c;
	cur_pt = prev_m_pt;
	break;
default:
	i--;
	switch (prev_c) {
	case 'M':
		c = 'L';
		break;
	case 'm':
		c = 'l';
		break;
	default:
		c = prev_c;
	}
	goto next_command;
}
}
}
}
*/

function svg_parse_iri(attribute_content)
{
var iri = new Object();
// alert(attribute_content);
if (attribute_content[0] == '#') {
iri.string = attribute_content;
iri.target = document.getElementById(attribute_content.slice(1));
// alert(iri.target);
if (!iri.target) {
iri.type = XMLRI_STRING;
} else {
iri.type = XMLRI_ELEMENTID;
}
} else {
iri.type = XMLRI_STRING;
iri.string = attribute_content;
}
return iri;
}

function svg_parse_idref(attribute_content)
{
var iri = new Object();
iri.type = XMLRI_ELEMENTID;
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
	
	this.getPoint = function() {
		var p = new this.Point(this.getScalar(), this.getScalar());
		return this.makeAbsolute(p);
	}
	
	this.getAsControlPoint = function() {
		var p = this.getPoint();
		this.control = p;
		return p;
	}
	
	this.getAsCurrentPoint = function() {
		var p = this.getPoint();
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

// get an absolute representation of the path
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
			var p = pp.getAsCurrentPoint();
			var cmd = new Object();
      cmd.command = "M";
      cmd.parameters = new Array();
      cmd.parameters.push(p);
      cmdList.push(cmd);
			pp.start = pp.current;
			while (!pp.isCommandOrEnd()) {
				var p = pp.getAsCurrentPoint();
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
				var p = pp.getAsCurrentPoint();
				var cmd = new Object();
        cmd.command = "L";
        cmd.parameters = new Array();
        cmd.parameters.push(p);
        cmdList.push(cmd);
			}
			break;
		case 'H':
		case 'h':
			while (!pp.isCommandOrEnd()) {
			  var coord = pp.getScalar();
			  var t =   pp.isRelativeCommand();
				var newP = new pp.Point((pp.isRelativeCommand() ? pp.current.x : 0) + coord, pp.current.y);
				pp.current = newP;
				var cmd = new Object();
        cmd.command = "H";
        cmd.parameters = new Array();
        cmd.parameters.push((pp.isRelativeCommand() ? pp.current.x : 0) + coord);
        cmdList.push(cmd);
			}
			break;
		case 'V':
		case 'v':
			while (!pp.isCommandOrEnd()) {
			  var coord = pp.getScalar();
				var newP = new pp.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + coord);
				pp.current = newP;
				var cmd = new Object();
        cmd.command = "V";
        cmd.parameters = new Array();
        cmd.parameters.push((pp.isRelativeCommand() ? pp.current.x : 0) + coord);
        cmdList.push(cmd);
			}
			break;
		case 'C':
		case 'c':
			/*
      while (!pp.isCommandOrEnd()) {
				var curr = pp.current;
				var p1 = pp.getPoint();
				var cntrl = pp.getAsControlPoint();
				var cp = pp.getAsCurrentPoint();
				pp.addMarker(cp, cntrl, p1);
				bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
				if (ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
			}
			*/
      break;
		case 'S':
		case 's':
			/*
      while (!pp.isCommandOrEnd()) {
				var curr = pp.current;
				var p1 = pp.getReflectedControlPoint();
				var cntrl = pp.getAsControlPoint();
				var cp = pp.getAsCurrentPoint();
				pp.addMarker(cp, cntrl, p1);
				bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
				if (ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
			}
			*/
      break;
		case 'Q':
		case 'q':
			/*
      while (!pp.isCommandOrEnd()) {
				var curr = pp.current;
				var cntrl = pp.getAsControlPoint();
				var cp = pp.getAsCurrentPoint();
				pp.addMarker(cp, cntrl, cntrl);
				bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);
				if (ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
			}
			*/
      break;
		case 'T':
		case 't':
			/*
      while (!pp.isCommandOrEnd()) {
				var curr = pp.current;
				var cntrl = pp.getReflectedControlPoint();
				pp.control = cntrl;
				var cp = pp.getAsCurrentPoint();
				pp.addMarker(cp, cntrl, cntrl);
				bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);
				if (ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
			}
			*/
      break;
		case 'A':
		case 'a':
			/*
      while (!pp.isCommandOrEnd()) {
			    var curr = pp.current;
				var rx = pp.getScalar();
				var ry = pp.getScalar();
				var xAxisRotation = pp.getScalar() * (Math.PI / 180.0);
				var largeArcFlag = pp.getScalar();
				var sweepFlag = pp.getScalar();
				var cp = pp.getAsCurrentPoint();

				// Conversion from endpoint to center parameterization
				// http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
				// x1', y1'
				var currp = new pp.Point(
					Math.cos(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.sin(xAxisRotation) * (curr.y - cp.y) / 2.0,
					-Math.sin(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.cos(xAxisRotation) * (curr.y - cp.y) / 2.0
				);
				// adjust radii
				var l = Math.pow(currp.x,2)/Math.pow(rx,2)+Math.pow(currp.y,2)/Math.pow(ry,2);
				if (l > 1) {
					rx *= Math.sqrt(l);
					ry *= Math.sqrt(l);
				}
				// cx', cy'
				var s = (largeArcFlag == sweepFlag ? -1 : 1) * Math.sqrt(
					((Math.pow(rx,2)*Math.pow(ry,2))-(Math.pow(rx,2)*Math.pow(currp.y,2))-(Math.pow(ry,2)*Math.pow(currp.x,2))) /
					(Math.pow(rx,2)*Math.pow(currp.y,2)+Math.pow(ry,2)*Math.pow(currp.x,2))
				);
				if (isNaN(s)) s = 0;
				var cpp = new this.Point(s * rx * currp.y / ry, s * -ry * currp.x / rx);
				// cx, cy
				var centp = new this.Point(
					(curr.x + cp.x) / 2.0 + Math.cos(xAxisRotation) * cpp.x - Math.sin(xAxisRotation) * cpp.y,
					(curr.y + cp.y) / 2.0 + Math.sin(xAxisRotation) * cpp.x + Math.cos(xAxisRotation) * cpp.y
				);
				// vector magnitude
				var m = function(v) { return Math.sqrt(Math.pow(v[0],2) + Math.pow(v[1],2)); }
				// ratio between two vectors
				var r = function(u, v) { return (u[0]*v[0]+u[1]*v[1]) / (m(u)*m(v)) }
				// angle between two vectors
				var a = function(u, v) { return (u[0]*v[1] < u[1]*v[0] ? -1 : 1) * Math.acos(r(u,v)); }
				// initial angle
				var a1 = a([1,0], [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry]);
				// angle delta
				var u = [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry];
				var v = [(-currp.x-cpp.x)/rx,(-currp.y-cpp.y)/ry];
				var ad = a(u, v);
				if (r(u,v) <= -1) ad = Math.PI;
				if (r(u,v) >= 1) ad = 0;

				// for markers
				var dir = 1 - sweepFlag ? 1.0 : -1.0;
				var ah = a1 + dir * (ad / 2.0);
				var halfWay = new this.Point(
					centp.x + rx * Math.cos(ah),
					centp.y + ry * Math.sin(ah)
				);
				pp.addMarkerAngle(halfWay, ah - dir * Math.PI / 2);
				pp.addMarkerAngle(cp, ah - dir * Math.PI);

				bb.addPoint(cp.x, cp.y); // TODO: this is too naive, make it better
				if (ctx != null) {
					var r = rx > ry ? rx : ry;
					var sx = rx > ry ? 1 : rx / ry;
					var sy = rx > ry ? ry / rx : 1;

					ctx.translate(centp.x, centp.y);
					ctx.rotate(xAxisRotation);
					ctx.scale(sx, sy);
					ctx.arc(0, 0, r, a1, a1 + ad, 1 - sweepFlag);
					ctx.scale(1/sx, 1/sy);
					ctx.rotate(-xAxisRotation);
					ctx.translate(-centp.x, -centp.y);
				}
			}
			*/
      break;
		case 'Z':
		case 'z':
			/*
      if (ctx != null) ctx.closePath();
			pp.current = pp.start;
			*/
		}
	}
}
return cmdList;
}
