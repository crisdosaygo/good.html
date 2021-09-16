class Component extends Base {

  static MAX_RECORDS = 15;

  Regreet(clickEvent) {
    // clone the state
    const newState = cloneState('MyState');

    // update the greet count
    newState.greetCounts.value += 1;

    // add a record of the greet
    newState.timings.unshift({
      count: newState.greetCounts.value,
      time: (new Date).valueOf()
    });

    // ensure the number of records we keep is limited
    while(newState.timings.length > Component.MAX_RECORDS) {
      newState.timings.pop();
    }

    // apply the updated state
    setState('MyState', newState);
  }
}
