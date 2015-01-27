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
QUnit.test( "Test elementary path reversion", function( assert ) {
  var newdata = superpath.reversePathData("M 90,190L220,90");
  assert.equal( newdata, "M220,90L90,190", "Passed!" );
});
QUnit.test( "Test path reversion", function( assert ) {
  var newdata = superpath.reversePathData("M 90,190 220,90 330,150 L330,150 280,230 L330,310 280,400 120,375 z");
  assert.equal( newdata, "M120,375L280,400L330,310L280,230L330,150L330,150L220,90L90,190z", "Passed!" );
});
QUnit.test( "Test path transformation to fully relative path", function( assert ) {
    var data = "M90,190 220,90 330,150 330,150 280,230 330,310 280,400 120,375 z";
    var cmdList = superpath.svg_parse_path(data);
    cmdList = superpath.fullrelativePathCmdList(cmdList);
    assert.equal( cmdList.toString(), "M90,190l130,-100l110,60l0,0l-50,80l50,80l-50,90l-160,-25z", "Passed!");
});
QUnit.test( "Test parsing path data with superpath definition extension", function( assert ) {
    var data = "M 90,190 220,90 330,150 (p1|L330,150 280,230 L330,310 280,400)L120,375 z";
    var cmdList = superpath.svg_parse_path(data);
    var strCmdList = cmdList.toString(cmdList);
    assert.equal( strCmdList, "M90,190L220,90L330,150(p1|L330 150 280 230 L 330 310 280 400 )L120,375z", "Passed!");
});
QUnit.test( "Test finding current starting point for a subpath definition with an absolute path", function( assert ) {
    var data = "M 90,190 220,90 330,150 (p1|L280,230 L330,310 280,400)L120,375 z";
    var cmdList = superpath.svg_parse_path(data);
    cmdList.processCurrentPoints();
    var pt = cmdList.getSubpathStartingPoint("p1");
    assert.equal( pt.x+" "+pt.y, "330 150", "Passed!");
});
QUnit.test( "Test finding current starting point for a subpath definition with a relative path, with absolute positions preprocessing", function( assert ) {
    var data = "M90,190l130,-100 110,60 (p1|l-50,80l50,80 -50,90)l-160,-25 z";
    var cmdList = superpath.svg_parse_path(data);
    cmdList.processCurrentPoints();
    var pt = cmdList.getSubpathStartingPoint("p1");
    assert.equal( pt.x+" "+pt.y, "330 150", "Passed!");
});
QUnit.test( "Test finding current starting point for a subpath definition with a mixed path, with absolute positions preprocessing", function( assert ) {
    var data = "M90,190l130,-100 110,60 (p1|L280,230 L330,310 280,400)l-160,-25 z";
    var cmdList = superpath.svg_parse_path(data);
    cmdList.processCurrentPoints();
    var pt = cmdList.getSubpathStartingPoint("p1");
    assert.equal( pt.x+" "+pt.y, "330 150", "Passed!");
});
QUnit.test( "Test finding current starting point for a subpath definition with a relative path, without absolute positions preprocessing", function( assert ) {
    var data = "M90,190l130,-100 110,60 (p1|l-50,80l50,80 -50,90)l-160,-25 z";
    var cmdList = superpath.svg_parse_path(data);
    var pt = cmdList.getSubpathStartingPoint("p1");
    assert.equal( pt.x+" "+pt.y, "330 150", "Passed!");
});
QUnit.test( "Test finding current starting point for a subpath definition with a mixed path, without absolute positions preprocessing", function( assert ) {
    var data = "M90,190l130,-100 110,60 (p1|L280,230 L330,310 280,400)l-160,-25 z";
    var cmdList = superpath.svg_parse_path(data);
    var pt = cmdList.getSubpathStartingPoint("p1");
    assert.equal( pt.x+" "+pt.y, "330 150", "Passed!");
});