class FnHandlers extends Base {
  litClick(click) {
    click.stopPropagation();
    const {state} = this;
    state.litCount++;
    this.state = state;
  }

  topClick(click) {
    click.stopPropagation();
    const {state} = this;
    state.topCount++;
    this.state = state;
  }

  toggleChurn(click) {
    click.stopPropagation();
    const {state} = this;
    if ( this.churnTimer ) {
      clearInterval(this.churnTimer);
      this.churnTimer = null;
      state.churning = false;
    } else {
      state.churning = true;
      this.churnTimer = setInterval(() => {
        const s = this.state;
        s.tick++;
        this.state = s;
      }, 1000);
    }
    this.state = state;
  }
}
