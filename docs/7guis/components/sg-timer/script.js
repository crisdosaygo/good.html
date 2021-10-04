class Component extends Base {
  constructor() {
    super();
    const state = cloneState('data');
    this.untilLoaded().then(async () => {
      this.startKeepingTime(state);
    });
    setState('data', state);
  }

  startKeepingTime(state) {
    if ( this.timeKeeper ) return;
    state.timer.start = Date.now() - state.timer.elapsed*1000;
    this.timeKeeper = setInterval(() => this.keepTime(), 40);
  }

  stopKeepingTime() {
    clearInterval(this.timeKeeper);
    this.timeKeeper = false;
  }

  keepTime() {
    const state = cloneState('data');
    state.timer.elapsed = (Date.now() - state.timer.start)/1000;
    setState('data', state);

    if ( state.timer.elapsed >= state.timer.duration ) {
      this.stopKeepingTime();
    }
  }

  setDuration(inputEvent) {
    const state = cloneState('data');
    state.timer.duration = inputEvent.target.valueAsNumber;

    if ( state.timer.duration < state.timer.elapsed ) {
      state.timer.elapsed = state.timer.duration;
      this.stopKeepingTime();
    }
    if ( state.timer.duration > state.timer.elapsed ) {
      this.startKeepingTime(state);
    }

    setState('data', state);
  }

  Reset() {
    const state = cloneState('data');
    state.timer.elapsed = 0;
    this.stopKeepingTime(state);
    this.startKeepingTime(state);
    setState('data', state);
  }
}
