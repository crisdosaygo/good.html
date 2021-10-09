class Cells extends Base {
  static EMPTY = '';
  static MAX_ITERATIONS = 10;
  static CHANGED = 1e12+1;
  static DEBUG = false;

  constructor() {
    super();
    const resizer = this.columnResizer();
    this.ResizeColumn = event => resizer.next(event);
  }

  async run({cell}) {
    Cells.DEBUG && console.log('running');
    console.log('run');
    const Formulas = [];
    const CellProxy = {};
    for( let [coord, {formula,value}] of Object.entries(cell) ) {
      const cellCoord = coord.split(':')[1];
      if ( formula ) {
        Formulas.push(() => {
          let newValue = Cells.EMPTY;
          try {
            newValue = runCode(CellProxy, `(function(){ 
              try {
                const result ${formula}; 
                return result;
              } catch(e) {
                console.warn(e);
                return e;
              }
            }())`);
            Cells.DEBUG && console.log({newValue});
          } catch(e) {
            console.info('cell error', coord, formula, e);
            newValue = 'error'; 
          } finally {
            if ( Number.isNaN(value) ) {
              newValue = 'not a number';
              console.info('cell error nan');
            }
          }
          CellProxy[cellCoord] = newValue;
          if ( newValue !== cell[coord].value ) {
            cell[coord].value = newValue;
            return Cells.CHANGED;
          }
        });
      }
      if ( value === Cells.EMPTY ) {
        CellProxy[cellCoord] = Cells.EMPTY; 
        CellProxy[cellCoord.toLowerCase()] = Cells.EMPTY; 
      } else {
        CellProxy[cellCoord] = !Number.isNaN(Number(value)) ? Number(value) : value;
        CellProxy[cellCoord.toLowerCase()] = !Number.isNaN(Number(value)) ? Number(value) : value;
      }
    }
    let iter = Cells.MAX_ITERATIONS;
    while( iter-- && Formulas.map(f => f()).some(status => status === Cells.CHANGED) ) {
      console.log('Iteration');
    }
    console.log('done');
  }

  fastUpdate() {
    const state = cloneState('data'); 
    const {cells} = state;

    Object.entries(cells.cell).forEach(([key, cellState]) => this.updateIfChanged(cellState));
  }

  async loadCalculator() {
    const calculator = await import('./components/sg-table/calculator.js');
    Object.assign(this, {calculator});
  }

  async Recalculate(event) {
    const cells = this.state;
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
      cells.cell[key].formula = '';
    }

    cells.cell[key].editFormula = false;

    await this.run(cells);
    setTimeout(() => target.scrollLeft = 0, 100);
    this.state = cells;
  }

  *columnResizer() {
    while(true) {
      let event = yield;
      if ( !event.target.matches('.column-sizer') ) continue;  
      if ( event.type === 'pointerdown' ) {
        let {pageX:newX} = event;
        const columnHeader = event.target.closest('th');
        const columnElement = columnHeader.closest('table').querySelector(`colgroup col[name="${columnHeader.getAttribute('name')}"]`);
        const {x:startX, width} = columnHeader.getBoundingClientRect();
        const attachRight = width - (newX - startX);
        const newWidth = () => {
          //const {x,y,width,height} = columnHeader.getBoundingClientRect();
          const nw = `${(newX - startX + attachRight).toFixed(3)}px`;
          return nw;
        };
        dragging: while(true) {
          event = yield;
          if ( event.type === 'pointerup' ) break dragging;
          ({pageX:newX} = event);
          columnElement.style.width = newWidth(); 
        }
      }
    }
  }
}
