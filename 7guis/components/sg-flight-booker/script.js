class Component extends Base {
  constructor() {
    super();
    const state = cloneState('data');
    state.flightBooker.valence = state.flightBooker.initialValence;
    setState('data', state);
  }

  SetOut(inputEvent) {
    const {target: targ} = inputEvent;

    if ( !targ.checkValidity() ) return;

  }

  SetBack(inputEvent) {
    const {target: targ} = inputEvent;

    if ( !targ.checkValidity() ) return;
  }

  Book(clickEvent) {

  }
}
