import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { NGXS_PLUGINS } from '@ngxs/store';

import { SimpleAsyncStorageEngine } from './async-storage-engine';
import { NgxsAsyncStoragePlugin } from './async-storage.plugin';
import {
  AsyncStorageEngine,
  NGXS_STORAGE_PLUGIN_OPTIONS,
  NgxsStoragePluginOptions,
  STORAGE_ENGINE,
  StorageOption
} from './symbols';

export function storageOptionsFactory(options: NgxsStoragePluginOptions) {
  return {
    key: '@@STATE',
    storage: StorageOption.LocalStorage,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    ...options
  };
}

export function engineFactory(options: NgxsStoragePluginOptions): AsyncStorageEngine | null {
  if (options.storage === StorageOption.LocalStorage) {
    // todo: remove any here
    return new SimpleAsyncStorageEngine(localStorage);
  } else if (options.storage === StorageOption.SessionStorage) {
    return new SimpleAsyncStorageEngine(sessionStorage);
  }

  return null;
}

export const USER_OPTIONS = new InjectionToken('USER_OPTIONS');

@NgModule()
export class NgxsAsyncStoragePluginModule {
  static forRoot(options?: NgxsStoragePluginOptions): ModuleWithProviders {
    return {
      ngModule: NgxsAsyncStoragePluginModule,
      providers: [
        {
          provide: NGXS_PLUGINS,
          useClass: NgxsAsyncStoragePlugin,
          multi: true
        },
        {
          provide: USER_OPTIONS,
          useValue: options
        },
        {
          provide: NGXS_STORAGE_PLUGIN_OPTIONS,
          useFactory: storageOptionsFactory,
          deps: [USER_OPTIONS]
        },
        {
          provide: STORAGE_ENGINE,
          useFactory: engineFactory,
          deps: [NGXS_STORAGE_PLUGIN_OPTIONS]
        }
      ]
    };
  }
}
