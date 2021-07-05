import {
  ExtractState,
  MergeState,
  ObservableState,
  PartialState,
} from '@reismannnr2/observable-state';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface PartialStateOptions<T> {
  deps?: unknown[];
  distinct?: boolean;
  pipe?: (o$: Observable<T>) => Observable<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const partialStateDefaultOption: Required<PartialStateOptions<any>> = {
  deps: [],
  distinct: false,
  pipe: (o$) => o$,
};

export const usePartialState$ = <T, P>(
  state$: ObservableState<T>,
  extract: ExtractState<T, P>,
  merge: MergeState<T, P>,
  options: PartialStateOptions<P> = {},
): PartialState<P> => {
  const options_ = { ...partialStateDefaultOption, ...options };
  const { deps, distinct, pipe } = options_;
  const partial$ = useMemo(
    () =>
      distinct
        ? state$.distinctPartial$(extract, merge, pipe)
        : state$.partial$(extract, merge, pipe),
    deps.concat(state$, distinct),
  );
  useEffect(() => {
    return () => partial$.close();
  }, deps.concat(state$, distinct));
  return partial$;
};

export const useChildState$ = <T, K extends keyof T>(
  state$: ObservableState<T>,
  key: K,
  options?: PartialStateOptions<T[K]>,
): PartialState<T[K]> =>
  usePartialState$(
    state$,
    (state) => state[key],
    (state, value) => ({
      ...state,
      [key]: value,
    }),
    options,
  );

export const useArrayStateElement$ = <I>(
  array$: ObservableState<I[]>,
  index: number,
  options: PartialStateOptions<I> = {},
): PartialState<I> => {
  return usePartialState$(
    array$,
    (ary) => ary[index],
    (ary, elem) => {
      const copy = ary.slice();
      copy[index] = elem;
      return copy;
    },
    {
      ...options,
      deps: options.deps ? options.deps.concat(index) : [index],
    },
  );
};

export interface ArrayActions<I> {
  move: (from: number, to: number) => void;
  swap: (a: number, b: number) => void;
  append: (...items: I[]) => void;
  prepend: (...items: I[]) => void;
  insert: (index: number, ...items: I[]) => void;
  remove: (...indices: number[]) => void;
  replace: (index: number, item: I) => void;
  update: (index: number, transform: (prev: I) => I) => void;
}

export const useArrayActions = <I>(
  update: (f: (prev: I[]) => I[]) => void,
): ArrayActions<I> => {
  return useMemo(() => {
    return {
      move: (from: number, to: number) => {
        if (from === to) {
          return;
        }
        update((prev) => {
          const next = prev.slice();
          next.splice(to, 0, ...next.splice(from, 1));
          return next;
        });
      },
      swap: (a: number, b: number) => {
        update((prev) => {
          const next = prev.slice();
          next[a] = prev[b];
          next[b] = prev[a];
          return next;
        });
      },
      append: (...items: I[]) => {
        update((prev) => prev.concat(items));
      },
      prepend: (...items: I[]) => {
        update((prev) => items.concat(prev));
      },
      insert: (index: number, ...items: I[]) => {
        update((prev) => {
          const next = prev.slice();
          next.splice(index, 0, ...items);
          return next;
        });
      },
      remove: (...indices: number[]) => {
        update((prev) => prev.filter((_, i) => !indices.includes(i)));
      },
      replace: (index: number, item: I) => {
        update((prev) => {
          const next = prev.slice();
          next[index] = item;
          return next;
        });
      },
      update: (index, transform) => {
        update((prev) => {
          const next = prev.slice();
          next[index] = transform(prev[index]);
          return next;
        });
      },
    };
  }, [update]);
};

export const useArrayStateActions = <I>(
  array$: ObservableState<I[]>,
): ArrayActions<I> => {
  const update = useCallback(
    (action: (prev: I[]) => I[]) => array$.update(action),
    [array$],
  );
  return useArrayActions(update);
};

export const useCurrentPartialState$ = <T, P>(
  state$: ObservableState<T>,
  extract: (state: T) => P,
  deps: unknown[] = [],
): [P, Dispatch<SetStateAction<P>>] => {
  const depsWithState = deps.concat(state$);
  const [state, setState] = useState(extract(state$.currentState));
  useEffect(() => {
    const subscription = state$
      .pipe(map(extract), distinctUntilChanged())
      .subscribe((state) => setState(state));
    return () => subscription.unsubscribe();
  }, depsWithState);
  return [state, setState];
};

export const useCurrentState$ = <T>(
  state$: ObservableState<T>,
): [T, Dispatch<SetStateAction<T>>] => {
  return useCurrentPartialState$(state$, (v) => v, [state$]);
};

export const useElementState$ = <I>(
  element: I,
  index: number,
  action: ArrayActions<I>,
): ObservableState<I> => {
  const element$ = useMemo(() => new ObservableState(element), [
    element,
    index,
    action,
  ]);
  useEffect(() => {
    const subscription = element$.subscribe((element) => {
      action.replace(index, element);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [element$, action, index]);
  return element$;
};

export const useLocalState$ = <T>(init: T): ObservableState<T> => {
  return useMemo(() => new ObservableState<T>(init), []);
};
