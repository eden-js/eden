
// require dependencies
const uuid   = require ('uuid');
const events = require ('events');

// global vars
let socket = null;

/**
 * create live model class
 *
 * @extends events
 */
class model extends events {

  /**
   * construct model class
   *
   * @param {String} type
   * @param {Object} object
   */
  constructor (type, object) {
    // run super
    super ();

    // set id
    this.__id   = object.id;
    this.__data = object;
    this.__type = type;

    // bind methods
    this.get     = this.get.bind (this);
    this.build   = this.build.bind (this);
    this.refresh = this.refresh.bind (this);
    this.destroy = this.destroy.bind (this);

    // bind private methods
    this._update = this._update.bind (this);

    // build
    this.building = this.build ();
  }

  /**
   * returns data key
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get (key) {
    // check key
    if (!key || !key.length) return this.__data;
    
    // return this key
    return this.__data[key];
  }

  /**
   * builds this
   */
  async build () {
    // check if window
    if (typeof window !== 'undefined') socket = require ('socket/public/js/bootstrap');

    // listen
    await this.listen ();
  }

  /**
   * listens to model by id
   */
  async destroy () {
    // await building
    await this.building;

    // check loading
    if (!socket) return;

    // call eden
    await socket.call ('live.deafen.' + this.__type, this.__id, this.__uuid);

    // add on event
    socket.off ('live.update.' + this.__type + '.' + this.__id, this._update);
  }

  /**
   * refreshes this
   */
  async refresh () {
    // await building
    await this.building;

    // check loading
    if (!socket) return;

    // call eden
    let object = await socket.call ('live.refresh.' + this.__type, this.__id);

    // run update
    this._update (object);
  }

  /**
   * listens to model by id
   */
  async listen () {
    // await building
    await this.building;

    // check loading
    if (!socket) return;

    // set uuid
    if (!this.__uuid) this.__uuid = uuid ();

    // call eden
    await socket.call ('live.listen.' + this.__type, this.__id, this.__uuid);

    // add on event
    socket.on ('live.update.' + this.__type + '.' + this.__id, this._update);
  }

  /**
   * on update
   *
   * @param  {Object} object
   */
  _update (object) {
    // update details
    for (let key in object) {
      // check differences
      if (this.__data[key] !== object[key]) {
        // listen to object key
        this.__data[key] = object[key];

        // emit event
        this.emit (key, object[key]);
      }
    }

    // emit update
    this.emit ('update');
  }
}

/**
 * export live model class
 *
 * @type {model}
 */
exports = module.exports = model;