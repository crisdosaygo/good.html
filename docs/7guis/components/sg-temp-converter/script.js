class Component extends Base {
  SetKelvin(inputEvent) {
    const {target: targ} = inputEvent;

    if ( !targ.checkValidity() ) return;

    const type = targ.name;
    const value = Number(targ.value);

    const state = cloneState('data');
    const {temperatureConverter: t} = state;


    switch(type) {
      case "C":
        t.k = this.cToK(value);
        break;
      case "F":
        t.k = this.fToK(value);
        break;
      default: {
        throw new TypeError(`Unknown temperature type: ${type}`);
      }break;
    }

    t.c = parseFloat(this.kToC(t.k).toFixed(2));
    t.f = parseFloat(this.kToF(t.k).toFixed(2));

    setState('data', state);
  }

  kToC(k) {
    return k - 273.15;
  }

  kToF(k) {
    return (k - 273.15) * 9/5 + 32;
  }

  cToK(c) {
    return c + 273.15;
  }

  fToK(f) {
    return (f - 32) * 5/9 + 273.15;
  }
}
