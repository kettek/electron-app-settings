# electron-app-settings
An easy-to-use, efficient, and multi-process safe settings framework for [Electron](https://electron.atom.io) that presumes a single application configuration file.

Written to allow settings to be shared between the main process and renderer processes through [ipcMain](https://electronjs.org/docs/api/ipc-main) and [ipcRenderer](https://electronjs.org/docs/api/ipc-renderer) communication. The main process acts as the master to all renderer processes, loading the initial configuration file, managing synchronization, and the saving of the configuration on application quit.

Compatible with [electron-config](https://www.npmjs.com/package/electron-config) generated configuration files.

  * **Advantages**
    * Simple syntax allowing for escaped dot notation
      * e.g., "my\\.property" => {"my\\.property": ...}
    * Automatic merging of default values
    * IPC-based with no-config settings synchronization
    * Simple to use -- require wherever needed and begin usage!
  * **Disadvantages**
    * No key=>value monitoring (yet)
    * Only save-on-quit (to be further expanded)
    * Single settings file (could be changed, but might be beyond the module's scope)

## Installation

```
$ npm install electron-app-settings --save
```

## Usage
`electron-app-settings` can simply be required wherever it is needed, regardless of if it has been loaded in the main process or not, as the module will automatically handle setting itself up in the main process. If using a packer, it may be necessary to disable the use of `remote.require` via the `NO_REMOTE_REQUIRE` environment variable. If `NO_REMOTE_REQUIRE` is set, then you must ensure that the main process requires `electron-app-settings` as well as the renderer process.

The configuration file is presumed to be located at "[userData](https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname)/Settings" and will be saved on application quit.

```js
// MAIN PROCESS
const settings = require('electron-app-settings');

settings.set('cat', {
  name: 'Cat',
  limbs: 4,
  fuzzy: true
});

settings.get('cat.name');
// => "Cat"

settings.has('cat.bark');
// => false

/* Object-only merge-style defaults */
settings.set({
  { dog: {
    name: "Dog",
    tail: true
  }
}, true);

settings.get('cat');
// => {name: "Cat", limbs: 4, fuzzy: true, tail: true}
settings.get('dog');
// => {name: "Dog", tail: true}

// RENDERER PROCESS
const settings = require('electron-app-settings');

// ... on app-ready
  settings.get('cat');
  // => {name: "Cat", limbs: 4, fuzzy: true, tail: true}
```

### Promises API
`electron-app-settings` also has a Promise-style API accessible through the `promises` property of the settings object returned via `require('electron-app-settings')`. It functions exactly the same as the normal API with any return values being returned through the Promise's resolve callback. Access through the promises interface ensures that full renderer to main process IPC communication has already been completed.

```js
// RENDERER PROCESS
const settings = require('electron-app-settings');

// ... somewhere in an async function
  await settings.promises.get('cat');
  // => {name: "Cat", limbs: 4, fuzzy: true, tail: true}
```
