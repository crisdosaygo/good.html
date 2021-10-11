class Table extends Base {
  static #DragSizeStart = new Set(['pointerdown', 'contextmenu']);
  static get EMPTY() { return ''; }
  static get MAX_ITERATIONS() { return 10; }
  static get CHANGED() { return 1e12+1; }
  static get DEBUG() { return false; }

  constructor() {
    super();
    const resizer = this.Resizer();
    this.ResizeAxial = event => resizer.next(event);
  }

  SelectColumn(focusEvent) {
    const {path:[th]} = focusEvent;
    const colElement = th.closest('table').querySelector(`col[name="${th.getAttribute('name')}"]`);
    colElement.classList.add('selected');
  }

  DeselectColumn(focusEvent) {
    const {path:[th]} = focusEvent;
    const colElement = th.closest('table').querySelector(`col[name="${th.getAttribute('name')}"]`);
    colElement.classList.remove('selected');
  }

  async run({cell}) {
    let iter = Table.MAX_ITERATIONS;
    const Formulas = [];
    do {
      Formulas.length = 0;
      const CellProxy = {};
      for( let [coord, {formula,value}] of Object.entries(cell) ) {
        const cellCoord = coord.split(':')[1];
        if ( formula ) {
          Formulas.push(() => {
            let newValue = Table.EMPTY;
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
              Table.DEBUG && console.log(`Cell ${cellCoord} has changed.`, cell[coord].value, newValue);
              cell[coord].value = newValue;
              return Table.CHANGED;
            } else {
              Table.DEBUG && console.log(`Cell ${cellCoord} did NOT change.`);
            }
          });
        }
        if ( value === Table.EMPTY ) {
          CellProxy[cellCoord] = Table.EMPTY; 
          CellProxy[cellCoord.toLowerCase()] = Table.EMPTY; 
        } else {
          CellProxy[cellCoord] = !Number.isNaN(Number(value)) ? Number(value) : value;
          CellProxy[cellCoord.toLowerCase()] = !Number.isNaN(Number(value)) ? Number(value) : value;
        }
      }
    } while( iter-- && Formulas.map(f => f()).some(status => status === Table.CHANGED) );
  }

  fastUpdate() {
    const state = this.state;
    const cells = state.cells || state;

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

  *Resizer() {
    picking: while(true) {
      let event = yield;
      const {target} = event;
      sizing: if ( target.matches('.sizer') ) {
        if ( event.type === 'contextmenu' ) {
          event.preventDefault();
        }

        if ( Table.#DragSizeStart.has(event.type) ) {
          const {clientX:startX,clientY:startY} = event;
          const header = target.closest('th');

          if ( target.matches('.column') ) {
            const columnElement = header.closest('table').querySelector(`colgroup col[name="${header.getAttribute('name')}"]`);
            const previousColumnElement = columnElement.previousElementSibling;
            if ( ! previousColumnElement ) continue picking;
            const widthBack = parseFloat(previousColumnElement.width || previousColumnElement.style.width || previousColumnElement.getBoundingClientRect().width);
            const widthFront = parseFloat(columnElement.width || columnElement.style.width)
            let newX = startX;

            col_size_dragging: while(true) {
              event = yield;
              if ( event.type === 'pointerup' ) break col_size_dragging;
              if ( event.target.matches('.column.sizer') && event.target !== target ) {
                //continue newTarget;
                break col_size_dragging;
              }
              ({clientX:newX} = event);
              const [back, front] = newWidth();
              if ( previousColumnElement.matches('.row-header') ) {
                previousColumnElement.closest('.box').style.setProperty(`--row-headers-width`, back);
              } else {
                previousColumnElement.width = back;
              }
              columnElement.width = front;
            }

            function newWidth() {
              return [
                `${(widthBack + newX - startX).toFixed(3)}px`,
                `${(widthFront + startX - newX).toFixed(3)}px`
              ];
            }
          } else if ( target.matches('.row') ) {
            const rowElement = header.closest('tr')
            const previousRowElement = rowElement.previousElementSibling || rowElement.closest('table').querySelector('thead').lastElementChild;
            if ( ! previousRowElement ) continue picking;
            const heightBack = parseFloat(previousRowElement.height || previousRowElement.style.height || previousRowElement.getBoundingClientRect().height )
            const heightFront = parseFloat(rowElement.height || rowElement.style.height || rowElement.getBoundingClientRect().height)
            let newY = startY;

            row_size_dragging: while(true) {
              event = yield;
              if ( event.type === 'pointerup' ) break row_size_dragging;
              if ( event.target.matches('.row.sizer') && event.target !== target ) {
                //continue newTarget;
                break row_size_dragging;
              }
              ({clientY:newY} = event);
              const [back, front] = newHeight();
              if ( previousRowElement.matches('.column-header') ) {
                previousRowElement.closest('.box').style.setProperty(`--column-headers-height`, back);
              } else {
                previousRowElement.style.height = back;
              }
              //rowElement.style.height = front;
            }

            function newHeight() {
              return [
                `${(heightBack + newY - startY).toFixed(3)}px`,
                `${(heightFront + startY - newY).toFixed(3)}px`
              ];
            }
          }
        }
      }
    }
  }
}
