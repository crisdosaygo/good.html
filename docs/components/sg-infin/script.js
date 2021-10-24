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
      this.#xer = new IntersectionObserver(
        entries => entries.forEach(entry => {
          this.leftToPool();
          this.rightToPool();
          if ( this.#xdirection >= 0 ) {
            this.poolToRight();
          } else {
            this.poolToLeft();
          }
        }), 
        {root: this.viewport}
      );

      // so when the first row crosses threshold, put new one on bottom
      // when last row crosses threashold, put one on top
      let start = 0;
      Array.from(this.viewport.querySelectorAll('tr.sc-item')).forEach(row => {
        start += row.scrollHeight;
        row.style.top = `${start}px`;
        this.#yer.observe(row);
      });

      start = 0;
      Array.from(this.viewport.querySelectorAll('td.sc-item')).forEach(cell => {
        start += cell.scrollWidth;
        cell.style.left = `${start}px`;
        this.#xer.observe(cell);
      });
      this.topToPool();
      this.bottomToPool();
      this.leftToPool();
      this.rightToPool();
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

  allRows() {
    return Array.from(this.viewport.querySelectorAll('tbody tr'));
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

  leftToPool() {

  }

  rightToPool() {

  }

  poolToLeft() {

  }

  poolToRight() {

  }

  toPool(el) {
    el.style.top = `-${el.scrollHeight+10}px`;
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
      pool = this.viewport.querySelector('.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = `${highestRowTop-pool.scrollHeight}px`;
        highestRowTop -= pool.scrollHeight;
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
      pool = this.viewport.querySelector('.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = `${lowestRowBottom}px`;
        lowestRowBottom += pool.scrollHeight;
      }
    } while ( (i < 1 || atST) && pool && lowestRowBottom < BUFFER );
  }

  UpdatePosition(scrollEvent) {
    if ( this.#updating ) return;
    this.#updating = true;
    const {target} = scrollEvent; 
    const thisScrollTop = target.scrollTop;
    const thisScrollLeft = target.scrollLeft;
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
    // when scrolling diagonal we don't update properly because they go off screen and
    // fixed by making the rows 100% width
    // are not triggered by intersection anymore
    if ( thisScrollLeft !== this.#lastScrollLeft ) {
      this.#lastScrollLeft = thisScrollLeft;
      if ( this.nextPop ) clearTimeout(this.nextPop);
      this.nextPop = setTimeout(() => {
        const rows = target.querySelectorAll('tbody tr');
        rows.forEach(el => el.style.paddingLeft = target.scrollLeft+'px');
      }, 25);
    }
    this.#updating = false;
  }
}
