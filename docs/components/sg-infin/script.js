class Infin extends Base {
  constructor() {
    super();
    this.untilVisible().then(() => {
      this.#yer = new IntersectionObserver(
        entries => entries.forEach(entry => {
          this.topToPool();
          this.bottomToPool();
          if ( this.#ydirection >= 0 ) {
            this.poolToBottom();
          } else {
            this.poolToTop();
          }
        }), 
        {root: this.viewport}
      );
      this.#xer = [];
      // so when the first row crosses threshold, put new one on bottom
      // when last row crosses threashold, put one on top
      let start = 0;
      Array.from(this.viewport.querySelectorAll('tr.sc-item')).forEach(row => {
        row.style.top = `${start}px`;
        this.#yer.observe(row);
        start += row.clientHeight;

        {
          const i = this.#xer.length;
          const cellObserver = new IntersectionObserver(
            entries => entries.forEach(entry => {
              this.leftToPool(i);
              this.rightToPool(i);
              if ( this.#xdirection >= 0 ) {
                this.poolToRight(i);
              } else {
                this.poolToLeft(i);
              }
            }), 
            {root: this.viewport}
          );
          let cellStart = parseFloat(row.style.left || this.viewport.scrollLeft);
          this.#xer[i] = cellObserver;
          cellObserver.row = row;

          Array.from(row.querySelectorAll('td')).forEach(cell => {
            cell.style.left = `${cellStart}px`;
            cellStart += cell.clientWidth;
            this.#xer[i].observe(cell);
          });
          this.leftToPool(i);
          this.rightToPool(i);
        }
      });

      this.topToPool();
      this.bottomToPool();
    });
  }

  Recalculate() {
    // do nothing
  }

  rowsAbove() {
    const first = [];
    const start = this.viewport.scrollTop;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top) + el.clientHeight;
        if ( thisTop < start ) {
          first.push(el);
        }
      });
    return first;
  }

  rowsBelow() {
    const last = [];
    const end = this.viewport.scrollTop + this.viewport.clientHeight;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top);
        if ( thisTop > end ) {
          last.push(el);
        }
      });
    return last;
  }

  cellsLeft(i) {
    const left = [];
    const start = this.viewport.scrollLeft;
    Array.from(this.#xer[i].row.querySelectorAll('td.sc-item'))
      .find(el => {
        const thisLeft = parseFloat(el.style.left) + el.clientWidth;
        if ( thisLeft < start ) {
          left.push(el);
        }
      });
    return left;
  }

  cellsRight(i) {
    const right = [];
    const end = this.viewport.scrollLeft + this.viewport.clientWidth;
    Array.from(this.#xer[i].row.querySelectorAll('td.sc-item'))
      .find(el => {
        const thisLeft = parseFloat(el.style.left);
        if ( thisLeft > end ) {
          right.push(el);
        }
      });
    return right;
  }

  allRows() {
    return Array.from(this.viewport.querySelectorAll('tbody tr'));
  }

  allCells(i) {
    return Array.from(this.#xer[i].row.querySelectorAll('td'));
  }

  leftmostCellLeft(i) {
    let leftmostCellLeft = Infinity;
    Array.from(this.#xer[i].row.querySelectorAll('td.sc-item')).forEach(el => {
      const left = parseFloat(el.style.left);
      if ( left < leftmostCellLeft ) {
        leftmostCellLeft = left;
      }
    });
    return leftmostCellLeft;
  }

  rightmostCellRight(i) {
    let rightmostCellRight = -Infinity;
    Array.from(this.#xer[i].row.querySelectorAll('td.sc-item')).forEach(el => {
      const right = parseFloat(el.style.left) + el.clientWidth;
      if ( right > rightmostCellRight ) {
        rightmostCellRight = right;
      }
    });
    return rightmostCellRight;
  }

  highestRowTop() {
    let highestRowTop = Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item')).forEach(el => {
      const top = parseFloat(el.style.top);
      if ( top < highestRowTop ) {
        highestRowTop = top;
      }
    });
    return highestRowTop;
  }

  lowestRowBottom() {
    let lowestRowBottom = -Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item')).forEach(el => {
      const bottom = parseFloat(el.style.top) + el.clientHeight;
      if ( bottom > lowestRowBottom ) {
        lowestRowBottom = bottom;
      }
    });
    return lowestRowBottom;
  }

  // state 
    // hidden variables

    #updating = false;
    #yer;
    #xer;
    #viewport;
    #xdirection = 0;
    #ydirection = 0;
    #lastScrollTop = 0;
    #lastScrollLeft = 0;

    get viewport() {
      if ( this.#viewport ) return this.#viewport;
      this.#viewport = this.shadowRoot.querySelector('.box');
      return this.#viewport;
    }

  allToPool() {
    this.allRows().forEach(this.toPool);
  }

  topToPool() {
    this.rowsAbove().forEach(this.toPool);
  }

  bottomToPool() {
    this.rowsBelow().forEach(this.toPool);
  }

  leftToPool(i) {
    this.cellsLeft(i).forEach(cell => this.toPoolCell(cell));
  }

  rightToPool(i) {
    this.cellsRight(i).forEach(cell => this.toPoolCell(cell));
  }

  allCellsToPool(i) {
    this.allCells(i).forEach(cell => this.toPoolCell(cell));
  }

  poolToLeft(r, atST = false) {
    let BUFFER = Math.max(0, this.viewport.scrollLeft - 150);
    let i = 0, pool, leftmostCellLeft;
    leftmostCellLeft = this.leftmostCellLeft(r);
    if ( atST || leftmostCellLeft == Infinity ) {
      if ( atST ) {
        leftmostCellLeft = this.viewport.scrollLeft + this.viewport.clientWidth;
      } else {
        leftmostCellLeft = BUFFER;
        BUFFER -= this.viewport.clientWidth;
      }
      this.allCellsToPool(r);
    }
    const row = this.#xer[r].row;
    do {
      pool = row.querySelector('td.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = 0;
        pool.style.left = `${leftmostCellLeft-pool.clientWidth}px`;
        leftmostCellLeft -= pool.clientWidth;
      }
    } while( (i < 1 || atST) && pool && leftmostCellLeft > BUFFER );
  }

  poolToRight(r, atST = false) {
    let BUFFER = this.viewport.scrollLeft + this.viewport.clientWidth + 150;
    let i = 0, pool, rightmostCellRight;
    rightmostCellRight = this.rightmostCellRight(r);
    if ( atST || rightmostCellRight == -Infinity ) {
      if ( atST ) {
        rightmostCellRight = this.viewport.scrollLeft; 
      } else {
        rightmostCellRight = BUFFER; 
        BUFFER += this.viewport.clientWidth;
      }
      this.allCellsToPool(r);
    }
    const row = this.#xer[r].row;
    do {
      pool = row.querySelector('td.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = 0;
        pool.style.left = `${rightmostCellRight}px`;
        rightmostCellRight += pool.clientWidth;
      }
    } while ( (i < 1 || atST) && pool && rightmostCellRight < BUFFER );
  }

  toPool(el) {
    el.style.top = `-${el.clientHeight+10}px`;
    el.classList.add('sc-pool');
    el.classList.remove('sc-item');
  }

  toPoolCell(el) {
    el.style.top = `-${this.viewport.scrollTop+this.viewport.clientHeight+el.clientHeight+10}px`;
    el.classList.add('sc-pool');
    el.classList.remove('sc-item');
  }

  poolToTop(atST = false) {
    let BUFFER = Math.max(0, this.viewport.scrollTop - 50);
    let i = 0, pool, highestRowTop;
    highestRowTop = this.highestRowTop();
    if ( atST || highestRowTop == Infinity ) {
      if ( atST ) {
        highestRowTop = this.viewport.scrollTop + this.viewport.clientHeight;
      } else {
        highestRowTop = BUFFER;
        BUFFER -= this.viewport.clientHeight;
      }
      this.allToPool();
    }
    do {
      pool = this.viewport.querySelector('tr.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = `${highestRowTop-pool.clientHeight}px`;
        highestRowTop -= pool.clientHeight;
      }
    } while( (i < 1 || atST) && pool && highestRowTop > BUFFER );
  }

  poolToBottom(atST = false) {
    let BUFFER = this.viewport.scrollTop + this.viewport.clientHeight + 50;
    let i = 0, pool, lowestRowBottom;
    lowestRowBottom = this.lowestRowBottom();
    if ( atST || lowestRowBottom == -Infinity ) {
      if ( atST ) {
        lowestRowBottom = this.viewport.scrollTop; 
      } else {
        lowestRowBottom = BUFFER; 
        BUFFER += this.viewport.clientHeight;
      }
      this.allToPool();
    }
    do {
      pool = this.viewport.querySelector('tr.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = `${lowestRowBottom}px`;
        lowestRowBottom += pool.clientHeight;
      }
    } while ( (i < 1 || atST) && pool && lowestRowBottom < BUFFER );
  }

  UpdatePosition(scrollEvent) {
    if ( this.#updating ) return;
    this.#updating = true;
    const {target} = scrollEvent; 

    {
      const thisScrollTop = target.scrollTop;
      let dist = 0, needRejig = false;
      if ( thisScrollTop !== this.#lastScrollTop ) {
        dist = thisScrollTop - this.#lastScrollTop;
        this.#ydirection = Math.sign(dist);
        this.#lastScrollTop = thisScrollTop;
        needRejig = Math.abs(dist) > this.viewport.clientHeight;
        if ( needRejig ) {
          // we could debounce/throttle this on scroll
          setTimeout(() => {
            this.allToPool();
            if ( this.#ydirection > 0 ) {
              this.poolToBottom(true);
            } else {
              this.poolToTop(true);
            }
          }, 50);
        }
      }
    }

    {
      const thisScrollLeft = target.scrollLeft;
      let span = 0, needRejigX = false;
      if ( thisScrollLeft !== this.#lastScrollLeft ) {
        span = thisScrollLeft - this.#lastScrollLeft;
        this.#ydirection = Math.sign(span);
        this.#lastScrollLeft = thisScrollLeft;
        needRejigX = Math.abs(span) > this.viewport.clientWidth;
        if ( needRejigX ) {
          console.log('Rejig X');
        }
      }
    }
    this.#updating = false;
  }
}
