QUnit.module("Parsing path");
QUnit.test( "Test parsing path data with superpath definition extension", function( assert ) {
    var data = "M 90,190 220,90 330,150 (p1|L330,150 280,230 L330,310 280,400)L120,375 z";
    var cmdList = superpath.svg_parse_path(data);
    var strCmdList = cmdList.toString(cmdList);
    assert.equal( strCmdList, "M90,190L220,90L330,150(p1|L330 150 280 230 L 330 310 280 400 )L120,375z", "Passed!");
});
QUnit.test( "Test parsing path data with three successive subpath definition", function( assert ) {
    var data = "M8,6#p2|#p3|(p5|L6,8)z";
    var cmdList = superpath.svg_parse_path(data);
    assert.equal( cmdList.toString(), "M8,6#p2|#p3|(p5|L6 8 )z", "Passed!");
});
QUnit.test( "Test parsing path data with three successive subpath definition", function( assert ) {
    var data = "M2,0 4,0 6,2(p1|L6,4)(p3|L4,6)(p4|L2,6)L0,4 0,2z";
    var cmdList = superpath.svg_parse_path(data);
    assert.equal( cmdList.toString(), "M2,0L4,0L6,2(p1|L6 4 )(p3|L4 6 )(p4|L2 6 )L0,4L0,2z", "Passed!");
});
QUnit.test( "Test parsing path data with two successive subpath definition", function( assert ) {
    var data = "M2,0 4,0 6,2(p1|L6,4)(p3|L4,6)L2,6 0,4 0,2z";
    var cmdList = superpath.svg_parse_path(data);
    assert.equal( cmdList.toString(), "M2,0L4,0L6,2(p1|L6 4 )(p3|L4 6 )L2,6L0,4L0,2z", "Passed!");
});
QUnit.test( "Test parsing path data with superpath definition extension with C (minimal data set)", function( assert ) {
    var data = "M 425,25 C 205,25 25,205 25,425";
    var cmdList = superpath.svg_parse_path(data);
    var relCmdList = superpath.fullrelativePathCmdList(cmdList);
    assert.equal( relCmdList.toString(), "M425,25c-220,0 -400,180 -400,400", "Passed!");
});
QUnit.test( "Test parsing path data with superpath definition extension with C", function( assert ) {
    var data = "M 425,25 C 205,25 25,205 25,425 25,645.8 205,825 425,825 (p3|C 315,825 225,735 225,625 225,514 314,425 425,425 535,425 625,335 625,225 625,114 535,25 425,25) z";
    var cmdList = superpath.svg_parse_path(data);
    var relCmdList = superpath.fullrelativePathCmdList(cmdList);
    assert.equal( relCmdList.toString(), "M425,25c-220,0 -400,180 -400,400c0,220.79999999999995 180,400 400,400(p3|C315 825 225 735 225 625 225 514 314 425 425 425 535 425 625 335 625 225 625 114 535 25 425 25 )z", "Passed!");
});
QUnit.module("Building command list from a partial path");
QUnit.test( "Test building command list from data", function( assert ) {
  var desc = "l0,0l-50,80l50,80 -50,80", 
      startingPt,
      data,
      cmdList;
  startingPt = {};
  startingPt.x = 330;
  startingPt.y = 150;
  data = "M"+startingPt.x+","+startingPt.y+desc;
  cmdList = superpath.svg_parse_path(data);
  assert.equal( cmdList.toString(), "M330,150l0,0l-50,80l50,80l-50,80", "Passed!" );
});
QUnit.test( "Test building command list from data and transform to relative", function( assert ) {
  var desc = "l0,0l-50,80l50,80 -50,80", 
      startingPt,
      data,
      cmdList,
      relCmdList;
  startingPt = {};
  startingPt.x = 330;
  startingPt.y = 150;
  data = "M"+startingPt.x+","+startingPt.y+desc;
  cmdList = superpath.svg_parse_path(data);
  relCmdList = superpath.fullrelativePathCmdList(cmdList);
  assert.equal( relCmdList.toString(), "M330,150l0,0l-50,80l50,80l-50,80", "Passed!" );
});
QUnit.test( "Test building command list from data and transform to relative and reverse", function( assert ) {
  var desc = "l0,0l-50,80l50,80 -50,80", 
      startingPt,
      data,
      cmdList,
      relCmdList,
      revCmdList;
  startingPt = {};
  startingPt.x = 330;
  startingPt.y = 150;
  data = "M"+startingPt.x+","+startingPt.y+desc;
  cmdList = superpath.svg_parse_path(data);
  relCmdList = superpath.fullrelativePathCmdList(cmdList);
  revCmdList = relCmdList.reverse();
  assert.equal( revCmdList.toString(), "l50,-80l-50,-80l50,-80l0,0M-330,-150", "Passed!" );
});
QUnit.module("Reverse order of a path");
QUnit.test( "Test elementary path reversion", function( assert ) {
  var data = "M 90,190L220,90";
  var cmdList = superpath.svg_parse_path(data);
  var relCmdList = superpath.fullrelativePathCmdList(cmdList);
  var revCmdList = relCmdList.reverse();
  assert.equal( relCmdList.toString(), "M90,190l130,-100", "Passed!" );
});
QUnit.module("Path transformation in a relative path");
QUnit.test( "Test path transformation to fully relative path", function( assert ) {
    var data = "M90,190 220,90 330,150 330,150 280,230 330,310 280,400 120,375 z";
    var cmdList = superpath.svg_parse_path(data);
    cmdList = superpath.fullrelativePathCmdList(cmdList);
    assert.equal( cmdList.toString(), "M90,190l130,-100l110,60l0,0l-50,80l50,80l-50,90l-160,-25z", "Passed!");
});
QUnit.module("Finding starting point of a chunk");
QUnit.test( "Test finding current starting point for a subpath definition with an absolute path", function( assert ) {
    var data = "M 90,190 220,90 330,150 (p1|L280,230 L330,310 280,400)L120,375 z";
    var cmdList = superpath.svg_parse_path(data);
    var pt = cmdList.getSubpathStartingPoint("p1");
    assert.deepEqual( pt.x + " " + pt.y , "330 150"  , "Passed!");
});
QUnit.test( "Test finding current starting point for a subpath definition with a relative path, with absolute positions preprocessing", function( assert ) {
    var data = "M90,190l130,-100 110,60 (p1|l-50,80l50,80 -50,90)l-160,-25 z";
    var cmdList = superpath.svg_parse_path(data);
    var pt = cmdList.getSubpathStartingPoint("p1");
// fails; why?    assert.deepEqual( pt, { "x":330, "y":150} , "Passed!");
    assert.deepEqual( pt.x + " " + pt.y , "330 150"  , "Passed!");
});
QUnit.test( "Test finding current starting point for a subpath definition with a mixed path, with absolute positions preprocessing", function( assert ) {
    var data = "M90,190l130,-100 110,60 (p1|L280,230 L330,310 280,400)l-160,-25 z";
    var cmdList = superpath.svg_parse_path(data);
    var pt = cmdList.getSubpathStartingPoint("p1");
    assert.deepEqual( pt.x + " " + pt.y , "330 150"  , "Passed!");
});
