import { async, TestBed } from '@angular/core/testing';
import { Action, NgxsModule, State, StateContext, Store } from '@ngxs/store';

import {
  AsyncStorageEngine,
  NgxsAsyncStoragePluginModule,
  STORAGE_ENGINE,
  StorageOption
} from '../';

describe('NgxsAsyncStoragePlugin', () => {
  class Increment {
    static type = 'INCREMENT';
  }

  class Decrement {
    static type = 'DECREMENT';
  }

  interface StateModel {
    count: number;
  }

  @State<StateModel>({
    name: 'counter',
    defaults: { count: 0 }
  })
  class MyStore {
    @Action(Increment)
    increment({ getState, setState }: StateContext<StateModel>) {
      setState({
        count: Number(getState().count) + 1
      });
    }

    @Action(Decrement)
    decrement({ getState, setState }: StateContext<StateModel>) {
      setState({
        count: Number(getState().count) - 1
      });
    }
  }

  @State<StateModel>({
    name: 'lazyLoaded',
    defaults: { count: 0 }
  })
  class LazyLoadedStore {}

  describe('when using localStorage', () => {
    afterEach(() => {
      localStorage.removeItem('@@STATE');
    });

    it('should read correctly', () => {
      TestBed.configureTestingModule({
        imports: [NgxsModule.forRoot([MyStore]), NgxsAsyncStoragePluginModule.forRoot()]
      });

      const store: Store = TestBed.get(Store);

      localStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(state.count).toBe(100);
        });
    });

    it('should write correctly', () => {
      TestBed.configureTestingModule({
        imports: [NgxsModule.forRoot([MyStore]), NgxsAsyncStoragePluginModule.forRoot()]
      });

      const store: Store = TestBed.get(Store);

      store.dispatch(new Increment());
      store.dispatch(new Increment());
      store.dispatch(new Increment());
      store.dispatch(new Increment());
      store.dispatch(new Increment());

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(state.count).toBe(5);

          expect(localStorage.getItem('@@STATE')).toBe(
            JSON.stringify({ counter: { count: 5 } })
          );
        });
    });

    it('should load initial values correctly', () => {
      localStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

      TestBed.configureTestingModule({
        imports: [NgxsModule.forRoot([MyStore]), NgxsAsyncStoragePluginModule.forRoot()]
      });

      const store: Store = TestBed.get(Store);

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(state.count).toBe(100);
        });
    });

    it('should migrate global localstorage', () => {
      const data = JSON.stringify({ counter: { count: 100, version: 1 } });
      localStorage.setItem('@@STATE', data);

      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([MyStore]),
          NgxsAsyncStoragePluginModule.forRoot({
            migrations: [
              {
                version: 1,
                versionKey: 'counter.version',
                migrate: (state: any) => {
                  state.counter = {
                    counts: state.counter.count,
                    version: 2
                  };
                  return state;
                }
              }
            ]
          })
        ]
      });

      const store: Store = TestBed.get(Store);

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(localStorage.getItem('@@STATE')).toBe(
            JSON.stringify({ counter: { counts: 100, version: 2 } })
          );
        });
    });

    it('should migrate single localstorage', () => {
      const data = JSON.stringify({ count: 100, version: 1 });
      localStorage.setItem('counter', data);

      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([MyStore]),
          NgxsAsyncStoragePluginModule.forRoot({
            key: 'counter',
            migrations: [
              {
                version: 1,
                key: 'counter',
                versionKey: 'version',
                migrate: (state: any) => {
                  state = {
                    counts: state.count,
                    version: 2
                  };
                  return state;
                }
              }
            ]
          })
        ]
      });

      const store: Store = TestBed.get(Store);

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(localStorage.getItem('counter')).toBe(
            JSON.stringify({ counts: 100, version: 2 })
          );
        });
    });

    it('should merge unloaded data from feature', () => {
      localStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([MyStore]),
          NgxsAsyncStoragePluginModule.forRoot(),
          NgxsModule.forFeature([LazyLoadedStore])
        ]
      });

      const store: Store = TestBed.get(Store);

      store
        .select((state: any) => state)
        .subscribe((state: { counter: StateModel; lazyLoaded: StateModel }) => {
          expect(state.lazyLoaded).toBeDefined();
        });
    });

    it('should migrate global localstorage', () => {
      const data = JSON.stringify({ counter: { count: 100, version: 1 } });
      localStorage.setItem('@@STATE', data);

      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([MyStore]),
          NgxsAsyncStoragePluginModule.forRoot({
            migrations: [
              {
                version: 1,
                versionKey: 'counter.version',
                migrate: (state: any) => {
                  state.counter = {
                    counts: state.counter.count,
                    version: 2
                  };
                  return state;
                }
              }
            ]
          })
        ]
      });

      const store: Store = TestBed.get(Store);

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(localStorage.getItem('@@STATE')).toBe(
            JSON.stringify({
              counter: { counts: 100, version: 2 }
            })
          );
        });
    });

    it('should migrate single localstorage', () => {
      const data = JSON.stringify({ count: 100, version: 1 });
      localStorage.setItem('counter', data);

      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([MyStore]),
          NgxsAsyncStoragePluginModule.forRoot({
            key: 'counter',
            migrations: [
              {
                version: 1,
                key: 'counter',
                versionKey: 'version',
                migrate: (state: any) => {
                  state = {
                    counts: state.count,
                    version: 2
                  };
                  return state;
                }
              }
            ]
          })
        ]
      });

      const store: Store = TestBed.get(Store);

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(localStorage.getItem('counter')).toBe(
            JSON.stringify({
              counts: 100,
              version: 2
            })
          );
        });
    });

    describe('when blank values are returned', () => {
      it('should use default data if null retrieved from localstorage', () => {
        localStorage.setItem('@@STATE', <any>null);

        @State<StateModel>({ name: 'counter', defaults: { count: 123 } })
        class TestStore {}

        TestBed.configureTestingModule({
          imports: [NgxsModule.forRoot([TestStore]), NgxsAsyncStoragePluginModule.forRoot()]
        });

        const store = TestBed.get(Store);

        store
          .select((state: any) => state.counter)
          .subscribe((state: StateModel) => {
            expect(state.count).toBe(123);
          });
      });

      it('should use default data if undefined retrieved from localstorage', () => {
        localStorage.setItem('@@STATE', <any>undefined);

        @State<StateModel>({ name: 'counter', defaults: { count: 123 } })
        class TestStore {}

        TestBed.configureTestingModule({
          imports: [NgxsModule.forRoot([TestStore]), NgxsAsyncStoragePluginModule.forRoot()]
        });

        const store = TestBed.get(Store);

        store
          .select((state: any) => state.counter)
          .subscribe((state: StateModel) => {
            expect(state.count).toBe(123);
          });
      });

      it('should use default data if "undefined" retrieved from localstorage', () => {
        localStorage.setItem('@@STATE', 'undefined');

        @State<StateModel>({ name: 'counter', defaults: { count: 123 } })
        class TestStore {}

        TestBed.configureTestingModule({
          imports: [NgxsModule.forRoot([TestStore]), NgxsAsyncStoragePluginModule.forRoot()]
        });

        const store = TestBed.get(Store);

        store
          .select((state: any) => state.counter)
          .subscribe((state: StateModel) => {
            expect(state.count).toBe(123);
          });
      });
    });
  });

  describe('when using sessionStorage', () => {
    afterEach(() => {
      sessionStorage.removeItem('@@STATE');
    });

    it('should read correctly', () => {
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([MyStore]),
          NgxsAsyncStoragePluginModule.forRoot({ storage: StorageOption.SessionStorage })
        ]
      });

      const store: Store = TestBed.get(Store);

      sessionStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(state.count).toBe(100);
        });
    });

    it('should write correctly', () => {
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([MyStore]),
          NgxsAsyncStoragePluginModule.forRoot({ storage: StorageOption.SessionStorage })
        ]
      });

      const store: Store = TestBed.get(Store);

      store.dispatch(new Increment());
      store.dispatch(new Increment());
      store.dispatch(new Increment());
      store.dispatch(new Increment());
      store.dispatch(new Increment());

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(state.count).toBe(5);

          expect(sessionStorage.getItem('@@STATE')).toBe(
            JSON.stringify({
              counter: { count: 5 }
            })
          );
        });
    });

    it('should load initial values correctly', () => {
      sessionStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([MyStore]),
          NgxsAsyncStoragePluginModule.forRoot({ storage: StorageOption.SessionStorage })
        ]
      });

      const store: Store = TestBed.get(Store);

      store
        .select((state: any) => state.counter)
        .subscribe((state: StateModel) => {
          expect(state.count).toBe(100);
        });
    });
  });

  it('should use a custom storage engine', () => {
    class CustomStorage implements AsyncStorageEngine {
      static Storage: any = {
        '@@STATE': {
          counter: {
            count: 100
          }
        }
      };

      async length() {
        return Object.keys(CustomStorage.Storage).length;
      }

      async getItem(key: string) {
        return CustomStorage.Storage[key];
      }

      async setItem(key: string, val: any) {
        return (CustomStorage.Storage[key] = val);
      }

      async removeItem(key: string) {
        delete CustomStorage.Storage[key];
        return;
      }

      async clear() {
        CustomStorage.Storage = {};
        return;
      }
    }

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([MyStore]),
        NgxsAsyncStoragePluginModule.forRoot({
          serialize(val) {
            return val;
          },
          deserialize(val) {
            return val;
          }
        })
      ],
      providers: [
        {
          provide: STORAGE_ENGINE,
          useClass: CustomStorage
        }
      ]
    });

    const store: Store = TestBed.get(Store);

    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());

    store
      .select((state: any) => state.counter)
      .subscribe((state: StateModel) => {
        expect(state.count).toBe(105);

        expect(CustomStorage.Storage['@@STATE']).toEqual({ counter: { count: 105 } });
      });
  });
});
