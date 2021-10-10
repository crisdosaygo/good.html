class Table extends Base {
  static #DragSizeStart = new Set(['pointerdown', 'contextmenu']);
  static get EMPTY() { return ''; }
  static get MAX_ITERATIONS() { return 10; }
  static get CHANGED() { return 1e12+1; }
  static get DEBUG() { return false; }

  constructor() {
    super();
    const resizer = this.columnResizer();
    this.ResizeColumn = event => resizer.next(event);
  }

  async run({cell}) {
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
    }
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
    picking: while(true) {
      let event = yield;
      const {target} = event;
      sizing: if ( target.matches('.column-sizer') ) {
        if ( event.type === 'contextmenu' ) {
          event.preventDefault();
        }

        if ( Table.#DragSizeStart.has(event.type) ) {
          const {clientX:startX} = event;
          const columnHeader = target.closest('th');
          const columnElement = columnHeader.closest('table').querySelector(`colgroup col[name="${columnHeader.getAttribute('name')}"]`);
          const previousColumnElement = columnElement.previousElementSibling;
          if ( ! previousColumnElement ) continue picking;
          const widthBack = parseFloat(previousColumnElement.width || previousColumnElement.style.width)
          const widthFront = parseFloat(columnElement.width || columnElement.style.width)
          let newX = startX;

          dragging: while(true) {
            event = yield;
            if ( event.type === 'pointerup' ) break dragging;
            if ( event.target.matches('.column-sizer') && event.target !== target ) {
              //continue newTarget;
              break dragging;
            }
            ({clientX:newX} = event);
            const [back, front] = newWidth();
            previousColumnElement.width = back;
            columnElement.width = front;
          }

          function newWidth() {
            return [
              `${(widthBack + newX - startX).toFixed(3)}px`,
              `${(widthFront + startX - newX).toFixed(3)}px`
            ];
          }
        }
      }
    }
  }
}
