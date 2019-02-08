import { tap } from 'rxjs/operators';

import { Inject, Injectable } from '@angular/core';
import {
  actionMatcher,
  getValue,
  InitState,
  NgxsNextPluginFn,
  NgxsPlugin,
  setValue,
  UpdateState
} from '@ngxs/store';

import {
  AsyncStorageEngine,
  NGXS_STORAGE_PLUGIN_OPTIONS,
  NgxsStoragePluginOptions,
  STORAGE_ENGINE
} from './symbols';

@Injectable()
export class NgxsAsyncStoragePlugin implements NgxsPlugin {
  constructor(
    @Inject(NGXS_STORAGE_PLUGIN_OPTIONS) private _options: NgxsStoragePluginOptions,
    @Inject(STORAGE_ENGINE) private _engine: AsyncStorageEngine
  ) {}

  handle(state: any, event: any, next: NgxsNextPluginFn) {
    const options = this._options || <any>{};
    const matches = actionMatcher(event);
    const isInitAction = matches(InitState) || matches(UpdateState);
    const keys = Array.isArray(options.key) ? options.key : [options.key];
    let hasMigration = false;

    if (isInitAction) {
      for (const key of keys) {
        const isMaster = key === '@@STATE';
        this._engine.getItem(key!).then(val => {
          if (val !== 'undefined' && typeof val !== 'undefined' && val !== null) {
            try {
              val = options.deserialize!(val);
            } catch (e) {
              console.error(
                'Error ocurred while deserializing the store value, falling back to empty object.'
              );
              val = {};
            }

            if (options.migrations) {
              options.migrations.forEach(strategy => {
                const versionMatch =
                  strategy.version === getValue(val, strategy.versionKey || 'version');
                const keyMatch = (!strategy.key && isMaster) || strategy.key === key;
                if (versionMatch && keyMatch) {
                  val = strategy.migrate(val);
                  hasMigration = true;
                }
              });
            }

            if (!isMaster) {
              state = setValue(state, key!, val);
            } else {
              state = { ...state, ...val };
            }
          }
        });
      }
    }

    return next(state, event).pipe(
      tap(async nextState => {
        if (!isInitAction || (isInitAction && hasMigration)) {
          for (const key of keys) {
            const newState = await nextState;
            let val = await nextState;

            if (key !== '@@STATE') {
              val = getValue(newState, key!);
            }
            this._engine.setItem(key!, options.serialize!(val)).catch(e => {
              console.error(
                'Error ocurred while serializing the store value, value not updated.'
              );
            });
          }
        }
      })
    );
  }
}
