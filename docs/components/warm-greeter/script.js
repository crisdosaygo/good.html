class Component extends Base {
  static MAX_RECORDS = 15;
  Regreet(clickEvent) {
    const newState = cloneState('MyState');
    newState.greetCounts.value += 1;
    newState.timings.unshift({
      count: newState.greetCounts.value,
      time: (new Date).valueOf()
    });
    while(newState.timings.length > Component.MAX_RECORDS) {
      newState.timings.pop();
    }
    console.log(newState.timings);
    setState('MyState', newState);
  }
}
