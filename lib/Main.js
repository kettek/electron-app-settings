/**
 * A module that contains the code to run when electron-app-settings is loaded by the main process.
 *
 * @module Main
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2018 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license GPL-3.0
 */
const Settings        = require('./Settings');
const {ipcMain, app}  = require('electron');
const path            = require('path');
const fs              = require('fs');
module.exports = (function() { 
  // ---- Create our main settings
  const main_settings = new Settings();
  
  // ---- Setup our loading/watching
  const settings_file = path.join(app.getPath('userData'), 'Settings');
  
  // ---- File watching
  let file_watcher = null;
  const enableWatchSettings = () => {
    try {
      file_watcher = fs.watch(settings_file, {peristent: false});
      file_watcher.on('change', () => {
        console.log('changed');
      });
    } catch (e) {
      file_watcher = null;
    }
  }
  const disableWatchSettings = () => {
    if (file_watcher == null) return;
    file_watcher.close();
  }
  
  // ---- File reading
  const readSettings = () => {
    try {
      let data = fs.readFileSync(settings_file, {encoding: 'utf8'});
      main_settings._set(JSON.parse(data));
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  }
  
  // ---- File writing
  let isWriting = false;
  const writeSettings = () => {
    if (isWriting) return;
    isWriting = true;
    disableWatchSettings();
    fs.writeFile(settings_file, JSON.stringify(main_settings._storage), 'utf8', enableWatchSettings);
    isWriting = false;
  }
  
  // Save settings on quit
  app.on('before-quit', () => {
    writeSettings();
  });
  
  // ---- Register any listeners that request
  ipcMain.on('configurator-add-listener', (event) => {
    let listener = event.sender;
    // -- Set our *set master events to listeners
    main_settings.on('set', (arg) => {
      listener.send('configurator-master-set', arg);
    });
    main_settings.on('unset', (arg) => {
      listener.send('configurator-master-unset', arg);
    });
    // -- Send our settings over to the listener
    listener.send('configurator-master-set', {key: main_settings._storage});
  });
  
  // ---- Change our settings from listener events
  ipcMain.on('configurator-set', (event, arg) => {
    main_settings.set(arg.key, arg.value, arg.is_default)
  });
  ipcMain.on('configurator-unset', (event, arg) => {
    main_settings.unset(arg.key)
  });
  // ---- Load and watch settings file
  readSettings();
  enableWatchSettings();
  return main_settings;
})();