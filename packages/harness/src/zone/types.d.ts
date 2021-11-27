/// <reference types="zone.js" />

export interface PrivateZone extends Zone {
  // https://github.com/angular/angular/blob/ac59b990fcb3b5e24302254eeecb9448442861b9/packages/zone.js/lib/zone.ts#L974
  _updateTaskCount: (task: Task, change: number) => void;
}

export interface PatchedRootZone extends Zone {
  _ngxWaitUntilStable(): Promise<void>;
}
