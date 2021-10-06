class Cells extends Base {
  constructor() {
    super();
    this.loadCalculator();
  }

  async loadCalculator() {
    const calculator = await import('./components/sg-cells/calculator.js');
    Object.assign(this, {calculator});
  }

  async Recalculate(event) {
    const state = cloneState('data'); 
    const {target} = event;
    const host = target.getRootNode().host;
    const entry = target.value.trim();
    
    if ( entry.startsWith('=') ) {
      state.cells.cell[host.dataset.key].formula = entry;
    } else {
      state.cells.cell[host.dataset.key].value = entry;
    }

    await this.calculator.run(state.cells);
    setState('data', state);
  }
}
