/**
 * Promises/async API for accessing Settings.
 *
 * @module SettingsPromises
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2020 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license GPL-3.0
 */

const {ipcRenderer}       = require('electron');

class SettingsPromises {
  constructor(settings) {
    /**
     * The reference to the owning Settings object.
     *
     * @type {Settings}
     * @private
     */
    this._settings = settings;
  }
  /**
   * Sets the given key to the provided value in the store.
   * If there is only one parameter, it is presumed that the entire storage
   * should be set to that value.
   *
   * @fires Settings#event:set
   * @param {StorageKey} key
   * @param {*} [value] - Value to store.
   * @param {boolean} [is_default=false] - Whether or not the value should overwrite existing data.
   * @returns {Promise} Promise object that always resolves.
   * @example
   * await settings.promises.set("cat.ears", "soft");
   * await settings.promises.get("cat");
   * // => { "ears": "soft" }
   * @example
   * await settings.promises.set({"cat": {fuzzy: true, ears: "soft", legs: 4} });
   * await settings.promises.get()
   * // => { "cat": { "fuzzy": true, "ears": "soft", "legs": 4 } }
   * @example
   * await settings.promises.set("cat", {fuzzy: true, ears: "soft", meows: true});
   * await settings.promises.set("cat", {fuzzy: false}, true);
   * await settings.promises.get("cat");
   * // => { "fuzzy": true, "ears": "soft", "meows": true}
   */
  set(key, value, is_default) {
    return new Promise((resolve, reject) => {
      if (!this._settings._ready) {
        ipcRenderer.once('configurator-master-set', (event, arg) => {
          this._settings.set(key, value, is_default);
          resolve();
        });
      } else {
        this._settings.set(key, value, is_default);
        resolve();
      }
    });
  }
  /**
   * Unsets the given key from the store.
   *
   * @fires Settings#event:unset
   * @param {StorageKey} key
   * @returns {Promise} Promise object representing whether or not the object was unset
   * @example
   * await settings.promises.set("cat", {fuzzy: true, meow: true});
   * await settings.promises.unset("cat.fuzzy");
   * await settings.promises.has("cat.fuzzy");
   * // => false
   */
  unset(key="") {
    return new Promise((resolve, reject) => {
      if (!this._settings._ready) {
        ipcRenderer.once('configurator-master-set', (event, arg) => {
          resolve(this._settings.unset(key));
        });
      } else {
        resolve(this._settings.unset(key));
      }
    });
  }
  /**
   * Gets the given key's value from the store.
   *
   * @param {StorageKey} key
   * @returns {Promise} Promise object representing the given key's value.
   * @example
   * await settings.promises.set("cat", {meow: true, tail: true});
   * await settings.promises.get("cat");
   * // => {"meow": true, "tail": true}
   * await settings.promises.get();
   * // => { "cat": { "meow": true, "tail": true} }
   */
  get(key="") {
    return new Promise((resolve, reject) => {
      if (!this._settings._ready) {
        ipcRenderer.once('configurator-master-set', (event, arg) => {
          resolve(this._settings.get(key));
        });
      } else {
        resolve(this._settings.get(key));
      }
    });
  }
  /**
   * Checks if the given key is in the store.
   *
   * @param {StorageKey} key
   * @returns {Promise} Promise object representing if the key exists.
   * @example
   * await settings.promises.set("cat", { meow: true });
   * await settings.promises.has("cat.bark");
   * // => false
   */
  has(key="") {
    return new Promise((resolve, reject) => {
      if (!this._settings._ready) {
        ipcRenderer.once('configurator-master-set', (event, arg) => {
          resolve(this._settings.has(key));
        });
      } else {
        resolve(this._settings.has(key));
      }
    });
  }
}

module.exports = SettingsPromises;
