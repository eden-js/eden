/* eslint-disable import/order, global-require */

// Require dependencies
const Path        = require('path');
const { addPath } = require('app-module-path');
const PrettyError = require('pretty-error');

// Set global app root
global.appRoot = Path.resolve(process.cwd());
global.edenRoot = Path.resolve(Path.dirname(__dirname));

// babel register
require('@babel/register')({
  cache   : true,
  presets : [
    ['@babel/preset-env', {
      targets : {
        node : 'current',
      },
    }],
  ],
  ignore : [
    // ignore
    (filePath) => {
      return (!filePath.includes('/bundles/') && !filePath.includes('/views/') && !filePath.includes(Path.resolve(`${global.edenRoot}`))) || (filePath.includes('node_modules') && !filePath.includes('/bundles/'));
    },
  ],
  plugins : [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-typescript',
    'add-module-exports',
  ],
  extensions : ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts'],
});

// loader
const loader = require('./loader');

// require config
const config = require('./aliases/config');


// base imports
const localImportLocations = loader.getImports().filter(i => !(config.get('ignore') || []).find(c => i.includes(c)));

// paths
for (const path of localImportLocations) {
  addPath(path);
}

// import locations
global.importLocations = loader.getImports(config.get('modules') || []).filter(i => !(config.get('ignore') || []).find(c => i.includes(c)));

// add paths
for (const path of global.importLocations.filter(p => !localImportLocations.includes(p))) {
  addPath(path);
}

// Keep these here to reduce amount of re-calls to high i/o functions
global.bundlesLocations = loader.getLocations(config.get('modules'), 'bundles').filter(i => !(config.get('ignore') || []).find(c => i.includes(c)));
global.bundleLocations = loader.getLocations(config.get('modules'), 'bundle').filter(i => !(config.get('ignore') || []).find(c => i.includes(c)));

// Require global variables
require('lib/utilities/global');

// Build classes
const prettyError = new PrettyError();

// print error global
global.printError = function printError(e) {
  console.error(prettyError.render(e)); // eslint-disable-line no-console
};

// Build unhandled rejection error handler
process.on('unhandledRejection', (e) => {
  // Log error
  global.printError(e);
});

// Build uncaught exception error handler
process.on('uncaughtException', (e) => {
  // Log error
  global.printError(e);
});
