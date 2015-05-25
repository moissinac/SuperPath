QUnit.module("Parsing path");
QUnit.test( "Test very simple path", function( assert ) {
    var data = "M 90,190 220,90 330,150 L330,150 280,230 L330,310 280,400 L120,375 z";
    var cmdList = pathparser.svg_parse_path(data);
    var strCmdList = cmdList.toString();
    assert.equal( strCmdList, "M90,190L220,90L330,150L330,150L280,230L330,310L280,400L120,375z", "Passed!");
});
QUnit.test( "Basic parsing of path with Q and T commands", function( assert ) {
    var data = "M200,300 Q400,50 600,300 T1000,300";
    var cmdList = pathparser.svg_parse_path(data);
    var strCmdList = cmdList.toString();
    assert.equal( strCmdList, "M200,300Q400,50 600,300T1000,300", "Passed!");
});
QUnit.test( "Test path with Q and T commands; transform to relative path", function( assert ) {
    var data = "M200,300 Q400,50 600,300 T1000,300";
    var cmdList = pathparser.svg_parse_path(data);
    var relCmdList = pathparser.fullrelativePathCmdList(cmdList);
    assert.equal( relCmdList.toString(), "M200,300q200,-250 400,0t400,0", "Passed!");
});
QUnit.test( "Test path with Q and T commands: M200,300 Q400,50 600,300 T1000,300; transform to relative path then reverse", function( assert ) {
    var data = "M200,300 Q400,50 600,300 T1000,300";
    var cmdList = pathparser.svg_parse_path(data);
    var relCmdList = pathparser.fullrelativePathCmdList(cmdList);
    var revCmdList = relCmdList.reverse();
    assert.equal( revCmdList.toString(), "q-200,250 -400,0q-200,-250 -400,0M-200,-300", "Passed!");
});
QUnit.test( "Basic parsing of path with C and S commands", function( assert ) {
    var data = "M100,200 C100,100 250,100 250,200 S400,300 400,200";
    var cmdList = pathparser.svg_parse_path(data);
    var strCmdList = cmdList.toString();
    assert.equal( strCmdList, "M100,200C100,100 250,100 250,200S400,300 400,200", "Passed!");
});
QUnit.test( "Test path with C and S commands; transform to relative path", function( assert ) {
    var data = "M100,200 C100,100 250,100 250,200 S400,300 400,200";
    var cmdList = pathparser.svg_parse_path(data);
    var relCmdList = pathparser.fullrelativePathCmdList(cmdList);
    assert.equal( relCmdList.toString(), "M100,200c0,-100 150,-100 150,0s150,100 150,0", "Passed!");
});
QUnit.test( "Test path with C and S commands: M100,200 C100,100 250,100 250,200 S400,300 400,200; transform to relative path then reverse", function( assert ) {
    var data = "M100,200 C100,100 250,100 250,200 S400,300 400,200";
    var cmdList = pathparser.svg_parse_path(data);
    var relCmdList = pathparser.fullrelativePathCmdList(cmdList);
    var revCmdList = relCmdList.reverse();
    assert.equal( revCmdList.toString(), "c0,100 -150,100 -150,0c0,-100 -150,-100 -150,0M-100,-200", "Passed!");
});
QUnit.test( "Basic parsing of path with C and S commands", function( assert ) {
    var data = "M425,825 C 315,825 225,735 225,625 S314,425 425,425 S625,335 625,225 S535,25 425,250";
    var cmdList = pathparser.svg_parse_path(data);
    var strCmdList = cmdList.toString();
    assert.equal( strCmdList, "M425,825C315,825 225,735 225,625S314,425 425,425S625,335 625,225S535,25 425,250", "Passed!");
});
QUnit.test( "Test path with C and S commands; transform to relative path", function( assert ) {
    var data = "M425,825 C 315,825 225,735 225,625 S314,425 425,425 S625,335 625,225 S535,25 425,250";
    var cmdList = pathparser.svg_parse_path(data);
    var relCmdList = pathparser.fullrelativePathCmdList(cmdList);
    assert.equal( relCmdList.toString(), "M425,825c-110,0 -200,-90 -200,-200s89,-200 200,-200s200,-90 200,-200s-90,-200 -200,25", "Passed!");
});
QUnit.test( "Test path with C and S commands (used in a sample with subpath): M425,825 C 315,825 225,735 225,625 S314,425 425,425 S625,335 625,225 S535,25 425,25; transform to relative path then reverse", function( assert ) {
    var data = "M425,825 C 315,825 225,735 225,625 S314,425 425,425 S625,335 625,225 S535,25 425,250";
    var cmdList = pathparser.svg_parse_path(data);
    var relCmdList = pathparser.fullrelativePathCmdList(cmdList);
    var revCmdList = relCmdList.reverse();
    assert.equal( revCmdList.toString(), "c110,-225 200,-135 200,-25c0,110 -89,200 -200,200c-111,0 -200,90 -200,200c0,110 90,200 200,200M-425,-825", "Passed!");
});
