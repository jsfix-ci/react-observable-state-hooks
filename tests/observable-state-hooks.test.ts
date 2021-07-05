import { ObservableState } from '@reismannnr2/observable-state';
import { act, renderHook } from '@testing-library/react-hooks';
import {
  useArrayActions,
  useArrayStateActions,
  useArrayStateElement$,
  useChildState$,
  useCurrentState$,
  useElementState$,
  useLocalState$,
} from 'src/observable-state-hooks';

describe('observable-state-hooks', () => {
  const initialState = {
    text: 'text',
    numbers: [1, 2, 3],
  };
  test('useChildState$', () => {
    const state$ = new ObservableState(initialState);
    const { result, unmount } = renderHook(() => {
      return useChildState$(state$, 'text', { distinct: true });
    });
    act(() => result.current.update(() => 'updated'));
    expect(state$.currentState.text).toBe('updated');
    expect(result.current.currentState).toBe('updated');
    unmount();
  });
  test('useArrayStateElement$', () => {
    const state$ = new ObservableState(initialState);
    const initial = state$.currentState.numbers;
    const { result, unmount } = renderHook(() => {
      const numbers$ = useChildState$(state$, 'numbers');
      return useArrayStateElement$(numbers$, 1);
    });
    act(() => result.current.update((v) => v + 1));
    expect(result.current.currentState).toBe(3);
    expect(state$.currentState.numbers).toEqual([1, 3, 3]);
    expect(initial).toEqual([1, 2, 3]);
    unmount();
  });
  test('useArrayActions', () => {
    let list: number[] = [0];
    const update = (next: (prev: number[]) => number[]) => {
      list = next(list);
    };
    const { result, unmount } = renderHook(() => useArrayActions(update));
    const actions = result.current;
    actions.append(1, 2);
    expect(list).toEqual([0, 1, 2]);
    actions.move(0, 0);
    expect(list).toEqual([0, 1, 2]);
    actions.move(0, 2);
    expect(list).toEqual([1, 2, 0]);
    actions.move(2, 0);
    expect(list).toEqual([0, 1, 2]);
    actions.move(0, 2);
    expect(list).toEqual([1, 2, 0]);
    actions.prepend(0, 1);
    expect(list).toEqual([0, 1, 1, 2, 0]);
    actions.remove(1, 4);
    expect(list).toEqual([0, 1, 2]);
    actions.swap(0, 1);
    expect(list).toEqual([1, 0, 2]);
    actions.replace(0, 0);
    expect(list).toEqual([0, 0, 2]);
    actions.insert(1, 1);
    expect(list).toEqual([0, 1, 0, 2]);
    actions.remove(0, 2);
    expect(list).toEqual([1, 2]);
    actions.move(0, 1);
    expect(list).toEqual([2, 1]);
    actions.update(0, (prev) => prev + 1);
    expect(list).toEqual([3, 1]);
    unmount();
  });
  test('useArrayStateActions', () => {
    const state$ = new ObservableState(initialState);
    const { result, unmount } = renderHook(() => {
      const numbers$ = useChildState$(state$, 'numbers');
      return useArrayStateActions(numbers$);
    });
    act(() => {
      result.current.append(4, 5, 6);
    });
    expect(state$.currentState.numbers).toEqual([1, 2, 3, 4, 5, 6]);
    act(() => {
      result.current.move(1, 0);
    });
    expect(state$.currentState.numbers).toEqual([2, 1, 3, 4, 5, 6]);
    unmount();
  });
  test('useCurrentState', () => {
    const state$ = new ObservableState(initialState);
    const { result, unmount } = renderHook(() => useCurrentState$(state$));
    expect(result.current[0].text).toBe('text');
    act(() => state$.update((state) => ({ ...state, text: 'updated' })));
    expect(result.current[0].text).toBe('updated');
    unmount();
  });
  test('useElementState$', () => {
    let list: number[] = [0, 1, 2];
    const update = (next: (prev: number[]) => number[]) => {
      list = next(list);
    };
    const index = 1;
    const { result, unmount } = renderHook(() => {
      const actions = useArrayActions(update);
      return useElementState$(list[index], index, actions);
    });
    act(() => {
      result.current.update((prev) => prev + 5);
    });
    expect(list).toEqual([0, 6, 2]);
    unmount();
  });
  test('useLocalState$', () => {
    const { result, unmount } = renderHook(() => useLocalState$(false));
    expect(result.current.currentState).toBe(false);
    act(() => {
      result.current.update((prev) => !prev);
    });
    expect(result.current.currentState).toBe(true);
    unmount();
  });
});
