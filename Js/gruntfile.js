// join and minify superpath code
module.exports = function(grunt) {

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // Load the plugin that provides the "concat" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  // Load the plugin that provides the "bump" task to automatically manage version number
  grunt.loadNpmTasks('grunt-bump');

  // Project configuration.
  grunt.initConfig({
    uglify: {
      superpathcodeminify: {
        src: 'SVGSuperPathParser.js',
        dest: 'SVGSuperPathParser.min.js'
      },
      pathparsercodeminify: {
        src: 'ExpandableSVGPathParser.js',
        dest: 'ExpandableSVGPathParser.min.js'
      },
      pathprocessorminify: {
        src: 'SuperPathProcessor.js',
        dest: 'SuperPathProcessor.min.js'
      }
    },
    bump: {
      options: {
        files: ['ExpandableSVGPathParser.js', 
                      'ExpandableSVGPathParser.min.js',
                      'SuperPathExpander.js',
                      'SuperPathExpander.min.js',
                      'SuperPathExpander.js',
                      'SuperPathExpander.min.js', 
                      'SuperPathProcessor.js',
                      'SuperPathProcessor.min.js'
                      ],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['ExpandableSVGPathParser.js', 
                      'ExpandableSVGPathParser.min.js',
                      'SuperPathExpander.js',
                      'SuperPathExpander.min.js',
                      'SuperPathExpander.js',
                      'SuperPathExpander.min.js', 
                      'SuperPathProcessor.js',
                      'SuperPathProcessor.min.js',
                      'gruntfile.js'
                      ],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
        globalReplace: false,
        prereleaseName: false,
        regExp: false
      }
    },
    concat: {
        buildexpander: {
            files: {
              "SuperPathExpander.js": ["SVGSuperPathParser.js", "ExpandableSVGPathParser.js"]
            }
        }
    },
    all: {}
  });

  // Define the default task
  grunt.registerTask('default', ['all']);
};

