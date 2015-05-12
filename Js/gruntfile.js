// join and minify superpath code
module.exports = function(grunt) {

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // Load the plugin that provides the "concat" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  // Load the plugin that provides the "watch" task.
  grunt.loadNpmTasks('grunt-contrib-watch');
  // Load the plugin that provides the "bump" task to automatically manage version number
  grunt.loadNpmTasks('grunt-bump');
  // Load the plugin that provides the "git" task to automatically update the code in a git repository
  grunt.loadNpmTasks('grunt-git');

  // Project configuration.
  grunt.initConfig({
    srcFiles: ["SVGSuperPathParser.js", "ExpandableSVGPathParser.js"],
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
        src: 'SuperPathExpander.js',
        dest: 'SuperPathExpander.min.js'
      }
    },
    git: {
    },
    bump: {
      options: {
        files: ['ExpandableSVGPathParser.js', 
                      'ExpandableSVGPathParser.min.js',
                      'SuperPathExpander.js',
                      'SuperPathExpander.min.js',
                      'SVGSuperPathParser.js',
                      'SVGSuperPathParser.min.js', 
                      ],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['ExpandableSVGPathParser.js', 
                      'ExpandableSVGPathParser.min.js',
                      'SuperPathExpander.js',
                      'SuperPathExpander.min.js',
                      'SVGSuperPathParser.js',
                      'SVGSuperPathParser.min.js', 
                      'gruntfile.js'
                      ],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'https://github.com/moissinac/SuperPath',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
        globalReplace: false,
        prereleaseName: false,
        regExp: false
      }
    },
    concat: {
        buildexpander: {
            files: {
              "SuperPathExpander.js": "<%= srcFiles %>"
            }
        }
    },
    watch: {
      buildexpander: {
        files: "<%= srcFiles %>",
        tasks:  ["concat", "uglify"]
      }
    },
    all: {}
  });

  // Define the default task
  grunt.registerTask('default', ['concat', 'watch']);
};

