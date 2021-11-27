// @ts-check
/*global window*/
/// <reference types="zone.js" />

if (typeof Zone !== 'undefined') {
  throw Error(
    'Patch loaded after zone.js, did you try loading the patch manually?',
  );
}

// This file is injected before zone.js itself so we can patch zone while it's loading
// to ensure we can capture all tasks zone.js knows about

Object.defineProperty(window, 'Zone', {
  configurable: true,
  get: () => undefined,
  set: value => {
    if (value !== undefined) {
      patchZoneToInterceptRootZone(value);

      Object.defineProperty(window, 'Zone', {
        value,
        configurable: true,
        writable: true,
        enumerable: true,
      });
    }
  },
});

/** @param {ZoneType} Zone */
function patchZoneToInterceptRootZone(Zone) {
  if (!Zone) {
    return;
  }

  const rootZone =
    /** @type {import('./types').PrivateZone & import('./types').PatchedRootZone} */ (
      Zone.root
    );

  /** @type {{[k in TaskType]: number}} */
  const taskCount = {microTask: 0, macroTask: 0, eventTask: 0};

  function isStable() {
    return taskCount.microTask === 0 && taskCount.macroTask === 0;
  }

  /** @type {(() => void)[]} */
  const stabilityListeners = [];

  const {_updateTaskCount} = rootZone;
  rootZone._updateTaskCount = function (task, change) {
    _updateTaskCount.call(this, task, change);
    taskCount[task.type] += change;

    if (change < 0 && stabilityListeners.length > 0 && isStable()) {
      for (const listener of stabilityListeners) {
        listener();
      }

      stabilityListeners.length = 0;
    }
  };

  rootZone._ngxWaitUntilStable = function () {
    return new Promise(resolve => {
      if (isStable()) {
        return resolve();
      }

      stabilityListeners.push(resolve);
    });
  };
}
