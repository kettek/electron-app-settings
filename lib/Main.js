/**
 * A module that contains the code to run when electron-app-settings is loaded by the main process.
 *
 * @module Main
 * @author Ketchetwahmeegwun T. Southall / kts of kettek
 * @copyright 2018-2022 Ketchetwahmeegwun T. Southall <kettek1@kettek.net>
 * @license MPL-2.0
 */
const Settings          = require('./Settings');
const { SettingsError } = require('./Errors')
const {ipcMain, app}    = require('electron');
const path              = require('path');
const fs                = require('fs');

/**
 * Returns an instance of Settings.
 *
 * @returns {Settings}
 */
function createSettings() {
  // ---- Create our main settings
  const main_settings = new Settings();
  
  // ---- Setup our loading/watching
  const settings_file = path.join(app.getPath('userData'), 'Settings');
  const settings_backup = path.join(app.getPath('userData'), 'SettingsBackup');

  // ---- Make our directories
  try {
    fs.mkdirSync(settings_backup)
  } catch(e) {
    if (e.code != 'EEXIST') {
      console.error(new SettingsError("Could not create settings backup", e).message)
    }
  }
  
  // ---- File watching
  let file_watcher = null;
  const enableWatchSettings = () => {
    try {
      file_watcher = fs.watch(settings_file, {persistent: false});
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
      main_settings._ready = true;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        // If we errored, let's try to read the most recent backup.
        let backup_files = fs.readdirSync(settings_backup).sort();
        for (let i = backup_files.length-1; i >= 0; i--) {
          try {
            let data = fs.readFileSync(path.join(settings_backup, backup_files[i]), {encoding: 'utf8'});
            main_settings._set(JSON.parse(data));
            main_settings._ready = true;
            return;
          } catch(err) {
            // Ignore, I suppose.
          }
        }
        // Let's set data to blank, then.
        main_settings._set({});
        main_settings._ready = true;
        console.error(new SettingsError("Could not load settings file nor any backups", e).message);
      }
    }
  }
  
  // ---- File writing
  let isWriting = false;
  const writeSettings = (cb) => {
    if (isWriting) return;
    isWriting = true;
    disableWatchSettings();
    // Backup settings hourly if possible.
    const backup_path = path.join(settings_backup, (new Date().toISOString().split(':')[0]));
    fs.access(backup_path, fs.constants.F_OK, (err) => {
      if (err) {
        fs.writeFile(settings_file, JSON.stringify(main_settings._storage), 'utf8', () => {
          cb();
          enableWatchSettings();
          isWriting = false;
        });
      } else {
        fs.rename(settings_file, backup_path, (err) => {
          fs.writeFile(settings_file, JSON.stringify(main_settings._storage), 'utf8', () => {
            cb();
            enableWatchSettings();
            isWriting = false;
          });
        });
      }
    })
  }
  
  // Save settings on quit
  let forceQuit = false;
  app.on('before-quit', (event) => {
    if (!forceQuit) {
      event.preventDefault();
      writeSettings(() => {
        forceQuit = true;
        app.quit();
      });
    }
  });
  
  let listeners = [];

  // ---- Register any listeners that request
  ipcMain.on('configurator-add-listener', (event) => {
    let listener = event.sender;
    listeners.push(listener);
    // -- Send our settings over to the listener
    listener.send('configurator-master-set', {key: main_settings._storage});
  });

  // ---- Remove any listeners that request
  ipcMain.on('configurator-remove-listener', (event) => {
    let listener = event.sender;
    listeners = listeners.filter(item => item !== listener);
  });

  main_settings.on('set', (arg) => {
    listeners.forEach((listener) => {
      listener.send('configurator-master-set', arg);
    });
  });
  
  main_settings.on('unset', (arg) => {
    listeners.forEach((listener) => {
      listener.send('configurator-master-unset', arg);
    });
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
}

module.exports = createSettings();
