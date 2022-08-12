/**
 * @module Errors
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2018-2021 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license MPL-2.0
 */

class SettingsError extends Error {
  /**
   * 
   * @param {string} message 
   * @param {*} err 
   */
  constructor(message, err) {
    super();
    this.message = message + ": " + err.message;
    this.stack = err.stack;
    this.code = err.code;
    this.name = this.constructor.name;
  }
}

module.exports = {
  SettingsError,
}