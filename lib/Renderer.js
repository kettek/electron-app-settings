/**
 * A module that contains the code to run when electron-app-settings is loaded by a renderer process.
 *
 * @module Renderer
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2018 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license GPL-3.0
 */
// Ensure Main has loaded the Settings module
require('electron').remote.require('electron-app-settings');
const Settings            = require('./Settings');
const {ipcRenderer}       = require('electron');
module.exports = (function() {
  // Create our Renderer settings
  const renderer_settings = new Settings();
  
  // ---- Register this renderer instance to the main process
  ipcRenderer.send('configurator-add-listener');

  // ---- Unregister this renderer instance from the main process on close
  window.addEventListener('beforeunload', ()=>{
	ipcRenderer.send('configurator-remove-listener');
	return
  })
  
  // ---- Handle master *set calls (does not emit Settings events)
  ipcRenderer.on('configurator-master-set', (event, arg) => {
    renderer_settings._set(arg.key, arg.value, arg.is_default);
  });
  ipcRenderer.on('configurator-master-unset', (event, arg) => {
    renderer_settings._unset(arg.key, arg.value);
  });
  
  // ---- Emit settings to master when they change
  renderer_settings.on('set', (arg) => {
    ipcRenderer.send('configurator-set', arg);
  });
  renderer_settings.on('unset', (arg) => {
    ipcRenderer.send('configurator-unset', arg);
  });
  return renderer_settings;
})();
