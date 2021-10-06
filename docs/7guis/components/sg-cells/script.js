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
    console.log('Recalculating', await this.calculator.run()); 
  }
}
