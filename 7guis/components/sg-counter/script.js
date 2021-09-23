class Counter extends Base {
  constructor() {
    super();
    const state = cloneState('data');
    state.counter.count = state.counter.initialCount;
    setState('data', state);
  }

  Increment() {
    const state = cloneState('data'); 
    state.counter.count++;
    setState('data', state);
  }
}
