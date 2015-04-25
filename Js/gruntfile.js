// join and minify superpath code
module.exports = function(grunt) {

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // Load the plugin that provides the "concat" task.
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Project configuration.
  grunt.initConfig({
    uglify: {
      target1: {
        src: 'SVGSuperPathParser.js',
        dest: 'SVGSuperPathParser.min.js'
      },
      target2: {
        src: 'ExpandableSVGPathParser.js',
        dest: 'ExpandableSVGPathParser.min.js'
      },
      target3: {
        src: 'SuperPathProcessor.js',
        dest: 'SuperPathProcessor.min.js'
      }
    },
    concat: {
        target1: {
            files: {
              "SuperPathExpander.js": ["SVGSuperPathParser.js", "ExpandableSVGPathParser.js"]
            }
        }
    }
  });

  // Define the default task
  grunt.registerTask('default', ['concat']);
};

