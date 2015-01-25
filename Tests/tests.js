QUnit.test( "Test elementary path reversion", function( assert ) {
  //var sp = new superpath();
  var newdata = superpath.reversePathData("M 90,190L220,90");
  assert.equal( newdata, "M220,90L90,190", "Passed!" );
});
QUnit.test( "Test path reversion", function( assert ) {
  //var sp = new superpath();
  var newdata = superpath.reversePathData("M 90,190 220,90 330,150 L330,150 280,230 L330,310 280,400 120,375 z");
  assert.equal( newdata, "M120,375L280,400L330,310L280,230L330,150L330,150L220,90L90,190z", "Passed!" );
});
QUnit.test( "Test path transformation to fully relative path", function( assert ) {
    var data = "M90,190 220,90 330,150 330,150 280,230 330,310 280,400 120,375 z";
    var cmdList = superpath.svg_parse_path(data);
    cmdList = superpath.fullrelativePathCmdList(cmdList);
    rData = superpath.svgSerializeCmdList(cmdList);
    assert.equal( rData, "M90,190l130,-100l110,60l0,0l-50,80l50,80l-50,90l-160,-25z", "Passed!");
});
QUnit.test( "Test path transformation to reversed fully relative path", function( assert ) {
    var data = "M90,190 220,90 330,150 330,150 280,230 330,310 280,400 120,375 z";
    rData = superpath.reversePathData2(data);
    assert.equal( rData, "M120,375l160,25l50,-90l-50,-80l50,-80l0,0l-110,-60l-130,100z", "Passed!");
});