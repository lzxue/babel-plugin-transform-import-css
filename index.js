// node >= 8
// babel == 7

const t = require('@babel/types');

const CssImport = require('./css-import-visitor');
const {
  jsToAst, jsStringToAst, constAst, postcss,
} = require('./helpers');

/* main() { */

module.exports = function(/*babel*/) {
  // is plugin initialized?
  // const initialized = false;

  const pluginApi = {
    manipulateOptions (options) {
      // if (initialized) return options;
      return options;

      // e.g. { generateScopedName }
      // const currentConfig = { ...defaultOptions, ...retreiveOptions(options, pluginApi) };

      // TODO:
      // require('./postcss-hook')(currentConfig)
      // const initialized = true;
    },

    visitor: {
      ImportDeclaration: {
        exit: CssImport(({ src, css, options, importNode, babelData }) => {
          const { code, classesMap } = postcss.process(css, src);

          // const jssObject = cssToJss({ code });
          // writeJssFile(jssObject, src);

          // issues: Fails for import statement with no name #2
          if (importNode.local) {
            babelData.replaceWithMultiple([
              classesMapConstAst({ classesMap, importNode }),
              jsStringToAst(loadStylesString),
              putStyleIntoHeadAst({ code }),
            ]);
          } else {
            babelData.replaceWithMultiple([
              jsStringToAst(loadStylesString),
              putStyleIntoHeadAst({ code }),
            ]);
          }
          
        }),
      },
    },
  };
  return pluginApi;
};

/* } */
const loadStylesString = `function loadStyles(css, doc) {

  if (!doc) doc = document;

  var head = doc.head || doc.getElementsByTagName('head')[0];

  // no <head> node? create one...
  if (!head) {
    head = doc.createElement('head');
    var body = doc.body || doc.getElementsByTagName('body')[0];
    if (body) {
      body.parentNode.insertBefore(head, body);
    } else {
      doc.documentElement.appendChild(head);
    }
  }

  var style = doc.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet) {  // IE
    style.styleSheet.cssText = css;
  } else {                 // the world
    style.appendChild(doc.createTextNode(css));
  }
  head.appendChild(style);
  return style;
}
`


function classesMapConstAst({ importNode, classesMap }) {
  // XXX: class-names API extending with jssObject (css-in-js object generated on source css)
  const classesMapAst = jsToAst(classesMap);
  const classesMapVarNameAst = t.identifier(importNode.local.name);

  return constAst(classesMapVarNameAst, classesMapAst);
}

function putStyleIntoHeadAst({ code }) {
  return jsStringToAst(`loadStyles(\`${ code }\`)`);
}
