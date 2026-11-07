// The app's single source of truth. UI pieces read it through subscribe() and change it through set().
export interface Store<T> {
  get: () => T
  set: (patch: Partial<T>) => void
  subscribe: (listener: (state: T) => void) => void
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial
  const listeners: ((state: T) => void)[] = []
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch }
      for (const listener of listeners) listener(state)
    },
    subscribe(listener) {
      listeners.push(listener)
      listener(state)
    },
  }
}
