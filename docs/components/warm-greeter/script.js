class Component extends Base {

  // note
    /* you can customize the attributes to track however you like, see:
     * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks
     * about attributeChangedCallback and observedAttributes
    **/
  static get observedAttributes() {
    return ['xyz', ...super.observedAttributes];
  }

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

  SpecialRegreet(clickEvent) {
    // clone the state
    const newState = cloneState('MyState');

    // update the greet count
    newState.greetCounts.value *= 2;

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
