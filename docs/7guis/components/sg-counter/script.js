class Counter extends Base {
  Increment() {
    const state = cloneState('data'); 
    state.counter.count++;
    setState('data', state);
  }
}
