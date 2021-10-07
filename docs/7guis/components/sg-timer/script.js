class Component extends Base {
  constructor() {
    super();
    const {state} = this;
    this.untilLoaded().then(async () => {
      this.startKeepingTime(state);
      this.state = state;
    });
  }

  startKeepingTime(state) {
    if ( this.timeKeeper ) return;
    state.start = Date.now() - state.elapsed*1000;
    this.timeKeeper = setInterval(() => this.keepTime(), 40);
  }

  stopKeepingTime() {
    clearInterval(this.timeKeeper);
    this.timeKeeper = false;
  }

  keepTime() {
    const {state} = this;
    state.elapsed = (Date.now() - state.start)/1000;
    this.state = state;
    if ( state.timer.elapsed >= state.timer.duration ) {
      this.stopKeepingTime();
    }
  }

  setDuration(inputEvent) {
    const {state} = this;
    state.duration = inputEvent.target.valueAsNumber;

    if ( state.duration < state.elapsed ) {
      state.elapsed = state.duration;
      this.stopKeepingTime();
    }
    if ( state.duration > state.elapsed ) {
      this.startKeepingTime(state);
    }

    this.state = state;
  }

  Reset() {
    const {state} = this;
    state.elapsed = 0;
    this.stopKeepingTime(state);
    this.startKeepingTime(state);
    this.state = state;
  }
}
