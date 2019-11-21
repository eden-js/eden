/**
 * Create Daemons Task class
 *
 * @task daemons
 */
class DaemonsTask {
  /**
   * Construct Daemons Task class
   *
   * @param {Loader} runner
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind public methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * run in background
   *
   * @param {*} files
   */
  async run(files) {
    // run models in background
    await this._runner.thread(this.thread, {
      files,

      parser  : require.resolve('lib/utilities/parser'),
      appRoot : global.appRoot,
    });

    // Restart server
    this._runner.restart();
  }

  /**
   * Run assets task
   *
   * @param   {array} files
   *
   * @returns {Promise}
   */
  async thread(data) {
    // Require dependencies
    const fs        = require('fs-extra');
    const glob      = require('@edenjs/glob');
    const deepMerge = require('deepmerge');

    // Require local dependencies
    const parser = require(data.parser);

    // create parse function
    const parse = (file) => {
      // get mount
      const hooks     = [];
      const events    = [];
      const cluster   = file.tags.cluster ? file.tags.cluster.map(c => c.value) : null;
      const priority  = file.tags.priority ? parseInt(file.tags.priority[0].value, 10) : null;
      const endpoints = [];

      // set classes
      const daemons = [Object.assign({}, file, {
        cluster,
        priority,

        methods : undefined,
      })];

      // forEach
      file.methods.forEach((method) => {
        // combine tags
        const combinedTags = deepMerge(file.tags || {}, method.tags);

        // parse endpoints
        [...(method.tags.endpoint || [])].forEach((tag) => {
          // Comply with max-length 100 (TravicCI)
          const methodPriority = method.tags.priority;
          // create route
          const endpoint = Object.assign({
            fn       : method.method,
            all      : !!method.tags.all,
            file     : file.file,
            endpoint : (tag.value || '').trim(),
            priority : methodPriority ? parseInt(methodPriority[0].value, 10) : priority,
          }, parser.acl(combinedTags));

          // push endpoint
          endpoints.push(endpoint);
        });

        // parse events
        [...(method.tags.on || [])].forEach((tag) => {
          // Comply with max-length 100 (TravicCI)
          const methodPriority = method.tags.priority;
          // create route
          const e = Object.assign({
            fn       : method.method,
            all      : !!method.tags.all,
            file     : file.file,
            event    : (tag.value || '').trim(),
            priority : methodPriority ? parseInt(methodPriority[0].value, 10) : priority,
          }, parser.acl(combinedTags));

          // push event
          events.push(e);
        });

        // parse endpoints
        ['pre', 'post'].forEach((type) => {
          // pre/post
          [...(method.tags[type] || [])].forEach((tag) => {
            // Comply with max-length 100 (TravicCI)
            const methodPriority = method.tags.priority;
            // create route
            const hook = Object.assign({
              type,

              fn       : method.method,
              file     : file.file,
              hook     : (tag.value || '').trim(),
              priority : methodPriority ? parseInt(methodPriority[0].value, 10) : priority,
            }, parser.acl(combinedTags));

            // push hook
            hooks.push(hook);
          });
        });
      });

      // return daemons
      return {
        daemons,

        'daemon.hooks'     : hooks,
        'daemon.events'    : events,
        'daemon.endpoints' : endpoints,
      };
    };

    // Set config
    let config = {};

    // run through files
    const files = await glob(data.files);

    // loop files
    files.forEach((file) => {
      // parse file
      config = deepMerge(config, parse(parser.file(file)));
    });

    // Loop types in config
    for (const type of Object.keys(config)) {
      // Write config file
      fs.writeJson(`${data.appRoot}/.edenjs/.cache/${type}.json`, config[type]);
    }
  }

  /**
   * Watch task
   *
   * @return {string[]}
   */
  watch() {
    // Return files
    return [
      'daemons/**/*.{js,jsx,ts,tsx}',
    ];
  }
}

/**
 * Export Daemons Task class
 *
 * @type {DaemonsTask}
 */
module.exports = DaemonsTask;
