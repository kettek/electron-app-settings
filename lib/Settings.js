/**
 * @module Settings
 * @extends EventEmitter
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2018-2021 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license MPL-2.0
 */
const EventEmitter      = require('events').EventEmitter;
const SettingsPromises  = require('./SettingsPromises');

class Settings extends EventEmitter {
  constructor() {
    super();
    /**
     * The internal storage of the Settings object.
     *
     * @type {Object}
     * @private
     */
    this._storage = {};

    /**
     * Whether this Settings instance has received its master set.
     *
     * @type {Boolean}
     * @private
     */
    this._ready = false;

    /**
     * Async/await-compatible promises interface.
     *
     * @type {SettingsPromises}
     */
    this.promises = new SettingsPromises(this)
  }
  /**
   * @typedef {Object} StoragePair
   * @property {Object} obj The object that parents element
   * @property {string} element The element key
   * @private
   */
  /**
   * Retrieves the storing object and last key for a given storage path,
   * optionally creating the path as it does so.
   *
   * @param   {StorageKey} [key=""]
   *          The key to look for, using dot-syntax.
   *          Ex: "root.child.node" -> root: { child: { node: ... } }
   *          Ex: "root.child\\.node" -> root: { "child\.node": ... }
   * @param   {boolean} [create_path=false]
   *          Whether the storage structure should be created if it doesn't exist
   * @return  {StoragePair} 
   *          If key is "", will return { obj: this.storage, element: '' }
   *          If path does not exist and create_path is false, will return
   *            { obj: null, element: null }
   * @private
   */
  _getStoragePath(key="", create_path=false) {
    if (key == "") return { obj: this._storage, element: '' }
    let hierarchy = key.match(/([^\\\.]|\\.)+/g);
    let last_obj = null;
    let last_name = '';
    let obj = this._storage;
    for (let i = 0; i < hierarchy.length; i++) {
      last_obj = obj;
      last_name = hierarchy[i];
      if (i != hierarchy.length) {
        if (obj[hierarchy[i]] === undefined) {
          if (!create_path) {
            return {obj: null, element: null}
          } else {
            obj[hierarchy[i]] = {};
          }
        }
        obj = obj[hierarchy[i]];
      }
    }
  
    return {obj: last_obj, element: last_name};
  }
  /**
   * A dot-syntax formatted string representing an object/associative array structure.
   * @example "grandparent.parent.child" -> "grandparent": { "parent": { "child": ... } }
   * @example "grandparent.another\\.parent" -> "grandparent": { "another\.parent": ... }
   * @typedef {string} StorageKey
   */
  /**
   * Sets the given key to the provided value in the store.
   * If there is only one parameter, it is presumed that the entire storage
   * should be set to that value.
   *
   * @fires Settings#event:set
   * @param {StorageKey} key
   * @param {*} [value] - Value to store.
   * @param {boolean} [is_default=false] - Whether or not the value should overwrite existing data.
   * @example
   * settings.set("cat.ears", "soft");
   * settings.get("cat");
   * // => { "ears": "soft" }
   * @example
   * settings.set({"cat": {fuzzy: true, ears: "soft", legs: 4} });
   * settings.get()
   * // => { "cat": { "fuzzy": true, "ears": "soft", "legs": 4 } }
   * @example
   * settings.set("cat", {fuzzy: true, ears: "soft", meows: true});
   * settings.set("cat", {fuzzy: false}, true);
   * settings.get("cat");
   * // => { "fuzzy": true, "ears": "soft", "meows": true}
   */
  set(key, value, is_default) {
    if (typeof key === 'object') {
      is_default = value;
      value = key;
      key = '';
    }
    this._set(key, value, is_default);
    /**
     * set event.
     *
     * @event Settings#event:set
     * @type {object}
     * @property {StorageKey} key - The dot-syntax key string.
     * @property {*} value - The value to set.
     * @property {boolean} is_default - If it was a default value.
     */
    this.emit("set", {key: key, value: value, is_default: is_default});
  }
  /**
   * @see {@link ~Settings#set}
   * @private
   */
  _set(key, value, is_default=false) {
    if (typeof key === 'object') {
      is_default = value;
      value = key;
      key = '';
    }
    let {obj, element} = this._getStoragePath(key, true);
    if (element == '') {
      if (typeof value === 'object') {
        this._storage = is_default ? Object.assign(value, this._storage) : Object.assign(this._storage, value);
      } else {
        // Throw away value if attempting to overwrite storage with string
      }
    } else {
      if (typeof value === 'object') {
        if (!obj[element]) obj[element] = {};
        if (is_default) {
          obj[element] = Object.assign(value, obj[element]);
        } else {
          obj[element] = Object.assign(obj[element], value);
        }
      } else {
        obj[element] = is_default ? obj[element] === undefined ? value : obj[element] : value;
      }
    }
  }
  /**
   * Unsets the given key from the store.
   *
   * @fires Settings#event:unset
   * @param {StorageKey} key
   * @returns {boolean} - Whether or not the object was unset
   * @example
   * settings.set("cat", {fuzzy: true, meow: true});
   * settings.unset("cat.fuzzy");
   * settings.has("cat.fuzzy");
   * // => false
   */
  unset(key="") {
    let ret = this._unset(key);
    if (ret) {
      /**
       * unset event.
       *
       * @event Settings#event:unset
       * @type {object}
       * @property {StorageKey} key - The dot-syntax key that was unset.
       */
      this.emit('unset', {key: key});
    }
    return ret;
  }
  /**
   * @private
   * @see {@link module:Settings~Settings#unset}
   */
  _unset(key="") {
    let {obj, element} = this._getStoragePath(key, false);
    if (obj != null && element == "") {
      _storage = {};
      return true;
    } else if (obj == null || element == null) {
      return false;
    } else {
      delete obj[element];
      return true;
    }
  }
  /**
   * Gets the given key's value from the store
   *
   * @param {StorageKey} key
   * @returns {*|null}
   * @example
   * settings.set("cat", {meow: true, tail: true});
   * settings.get("cat");
   * // => {"meow": true, "tail": true}
   * settings.get();
   * // => { "cat": { "meow": true, "tail": true} }
   */
  get(key="") {
    let {obj, element} = this._getStoragePath(key, false);
    if (obj != null && element == "") return obj;
    else if (obj == null || element == null) return null;
    return obj[element];
  }
  /**
   * Checks if the given key is in the store
   *
   * @param {StorageKey} key
   * @returns {boolean}
   * @example
   * settings.set("cat", { meow: true });
   * settings.has("cat.bark");
   * // => false
   */
  has(key="") {
    let {obj, element} = this._getStoragePath(key, false);
    if (obj == null || element == null) return false;
    return true;
  }
}

module.exports = Settings;
