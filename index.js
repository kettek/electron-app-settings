/**
 * An easy-to-use, efficient, and multi-process safe settings framework for Electron.
 *
 * @module index
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2018-2021 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license MPL-2.0
 */
module.exports = (process.type === 'browser' ? require('./lib/Main') : require('./lib/Renderer'));
