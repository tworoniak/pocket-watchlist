import { act, renderHook } from '@testing-library/react-native';

import { useDebounce } from '../useDebounce';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useDebounce', () => {
  it('returns the initial value immediately without waiting', () => {
    const { result } = renderHook(() => useDebounce('hello', 400));
    expect(result.current).toBe('hello');
  });

  it('does not update before the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'hello' } },
    );

    rerender({ value: 'world' });

    act(() => {
      jest.advanceTimersByTime(399);
    });

    expect(result.current).toBe('hello');
  });

  it('updates exactly when the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'hello' } },
    );

    rerender({ value: 'world' });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current).toBe('world');
  });

  it('debounces rapid successive changes and only emits the last value', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => { jest.advanceTimersByTime(200); });

    rerender({ value: 'c' });
    act(() => { jest.advanceTimersByTime(200); });

    // Neither 'b' nor 'c' have fully settled yet
    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(400); });

    // Only the last value emitted
    expect(result.current).toBe('c');
  });

  it('uses 400ms as the default delay', () => {
    const { result, rerender } = renderHook(() => useDebounce('hello'));

    rerender();

    act(() => { jest.advanceTimersByTime(399); });
    expect(result.current).toBe('hello');

    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('hello');
  });

  it('respects a custom delay value', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 1000),
      { initialProps: { value: 'start' } },
    );

    rerender({ value: 'end' });

    act(() => { jest.advanceTimersByTime(999); });
    expect(result.current).toBe('start');

    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('end');
  });
});
