class Component extends Base {
  Regreet(clickEvent) {
    const newState = cloneState('MyState');
    newState.greetCounts.value += 1;
    setState('MyState', newState);
  }
}
