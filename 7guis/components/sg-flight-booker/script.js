class Component extends Base {
  SetValence(inputEvent) {
    const {target: targ} = inputEvent;

    if ( !targ.checkValidity() ) return;

    const state = cloneState('data'); 
    
    state.flightBooker.valence = targ.value;

    setState('data', state);
  }

  SetOut(inputEvent) {
    const {target: targ} = inputEvent;

    if ( !targ.checkValidity() ) return;

    const state = cloneState('data'); 

    state.flightBooker.out = targ.value;

    setState('data', state);
  }

  SetBack(inputEvent) {
    const {target: targ} = inputEvent;

    if ( !targ.checkValidity() ) return;

    const state = cloneState('data'); 

    state.flightBooker.back = targ.value;

    setState('data', state);
  }

  Book(clickEvent) {
    const state = cloneState('data'); 

    const {valence, out, back} = state.flightBooker;
    
    alert(`
      You have booked a ${
        valence
      } flight departing ${
        out
      }${ valence === 'round-trip' ? ` and returning ${
        back
      }` : '' 
      }
    `);
  }
}
