import {ApplicationRef, enableProdMode} from '@angular/core';
import {enableDebugTools} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {production} from './env/env';

if (production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(appModuleRef => {
    if (!production) {
      enableDebugTools(
        appModuleRef.injector.get(ApplicationRef).components[0]!,
      );
    }
  });
