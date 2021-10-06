class Cells extends Base {
  constructor() {
    super();
  }

  async run({cell}) {
    console.log('running');
    const Formulas = [];
    const CellProxy = {};
    for( let [coord, {formula,value}] of Object.entries(cell) ) {
      if ( formula ) {
        Formulas.push(() => {
          try {
            value = runCode(CellProxy, `(function(){ 
              const result ${formula}; 
              return result;
            }())`);
            console.log({value});
          } catch(e) {
            console.info('cell error', coord, formula, e);
            value = 'error'; 
          }
          cell[coord].value = value;
        });
      }
      CellProxy[coord] = value;
    }
    Formulas.forEach(f => f());
  }

  async loadCalculator() {
    const calculator = await import('./components/sg-cells/calculator.js');
    Object.assign(this, {calculator});
  }

  async Recalculate(event) {
    const state = cloneState('data'); 
    const {cells} = state;
    const {target} = event;
    const host = target.getRootNode().host;
    const entry = target.value.trim();
    const key = host.dataset.key;
   
    if ( ! cells.cell[key] ) {
      cells.cell[key] = {key, value:'', formula:''}; 
    }
    
    if ( entry.startsWith('=') ) {
      cells.cell[key].formula = entry;
    } else {
      cells.cell[key].value = entry;
    }

    await this.run(cells);
    setState('data', state);
  }
}
