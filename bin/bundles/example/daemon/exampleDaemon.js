/**
 * Created by Alex.Taylor on 26/02/2016.
 */

// use strict
'use strict';

// require local dependencies
var daemon = require ('daemon');

/**
 * build example dameon class
 */
class exampleDaemon extends daemon {
    /**
     * construct example daemon class
     *
     * @param {eden} eden
     */
    constructor (eden) {
        // run super eden
        super (eden);
    }
}

/**
 * export example daemon class
 *
 * @type {exampleDaemon}
 */
module.exports = exampleDaemon;
