class Infin extends Base {
  constructor() {
    super();
    this.untilVisible().then(() => {
      this.#top = new IntersectionObserver(
        entries => entries.forEach(entry => {
          this.topToPool();
          this.bottomToPool();
          //console.log(entry);
          if ( this.#direction >= 0 ) {
            this.poolToBottom(entry);
          } else {
            this.poolToTop(entry);
          }
        }), 
        {root: this.viewport}
      );
      this.#bottom = new IntersectionObserver(
        entries => entries.forEach(entry => {
          this.topToPool();
          this.bottomToPool();
          if ( this.#direction >= 0 ) {
            this.poolToBottom(entry);
          } else {
            this.poolToTop(entry);
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
        this.#top.observe(row);
        this.#bottom.observe(row);
      });
      this.topToPool();
      this.bottomToPool();
    });
  }

  Recalculate() {
    // do nothing
  }

  first() {
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

  last() {
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

  all() {
    return Array.from(this.viewport.querySelectorAll('tbody tr'));
  }

  firstTop() {
    let firstTop = Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item')).forEach(el => {
      const top = parseFloat(el.style.top);
      if ( top < firstTop ) {
        firstTop = top;
      }
    });
    return firstTop;
  }

  lastBottom() {
    let lastBottom = -Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item')).forEach(el => {
      const bottom = parseFloat(el.style.top) + el.clientHeight;
      if ( bottom > lastBottom ) {
        lastBottom = bottom;
      }
    });
    return lastBottom;
  }

  // state 
    // hidden variables

    #updating = false;
    #top;
    #bottom;
    #viewport;
    #direction = 0;
    #lastScrollTop = 0;

    get viewport() {
      if ( this.#viewport ) return this.#viewport;
      this.#viewport = this.shadowRoot.querySelector('.box');
      return this.#viewport;
    }

  allToPool() {
    this.all().forEach(el => {
      //this.#top.unobserve(el);
      el.style.top = `-${el.scrollHeight+10}px`;
      el.classList.add('sc-pool');
      el.classList.remove('sc-item');
    });
  }

  topToPool() {
    this.first().forEach(el => {
      //this.#top.unobserve(el);
      el.style.top = `-${el.scrollHeight+10}px`;
      el.classList.add('sc-pool');
      el.classList.remove('sc-item');
    });
  }

  bottomToPool() {
    this.last().forEach(el => {
      //this.#bottom.unobserve(el);
      el.style.top = `-${el.scrollHeight+10}px`;
      el.classList.add('sc-pool');
      el.classList.remove('sc-item');
    });
  }

  poolToTop(entry) {
    let BUFFER = Math.max(0, this.viewport.scrollTop - 50);
    let i = 0, pool, firstTop;
    firstTop = this.firstTop();
    if ( firstTop == Infinity ) {
      //console.info(this.viewport.scrollTop, firstTop);
      //alert(firstTop);
      firstTop = this.viewport.scrollTop - this.viewport.clientHeight; 
      BUFFER -= this.viewport.clientHeight;
      this.allToPool();
    }
    do {
      pool = this.viewport.querySelector('.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = `${firstTop-pool.scrollHeight}px`;
        firstTop -= pool.scrollHeight;
      }
    } while( i < 1 && pool && firstTop > BUFFER );
    console.log(`Added ${i} to top`);
  }

  poolToBottom(entry) {
    let BUFFER = this.viewport.scrollTop + this.viewport.clientHeight + 50;
    let i = 0, pool, lastBottom;
    lastBottom = this.lastBottom();
    if ( lastBottom == -Infinity ) {
      //console.info(this.viewport.scrollTop, lastBottom);
      //alert(lastBottom);
      lastBottom = BUFFER; 
      BUFFER += this.viewport.clientHeight;
      this.allToPool();
    } else if ( lastBottom < this.viewport.scrollTop ) {
      alert('problem');
    }
    do {
      pool = this.viewport.querySelector('.sc-pool');
      if ( pool ) {
        i++;
        pool.classList.remove('sc-pool');
        pool.classList.add('sc-item');
        pool.style.top = `${lastBottom}px`;
        lastBottom += pool.scrollHeight;
      }
    } while ( i < 1 && pool && lastBottom < BUFFER );
    console.log(`Added ${i} to bottom`);
  }

  UpdatePosition(scrollEvent) {
    if ( this.#updating ) return;
    this.#updating = true;
    const {target} = scrollEvent; 
    if ( this.nextPop ) clearTimeout(this.nextPop);
    let thisScrollTop = target.scrollTop;
    if ( thisScrollTop !== this.#lastScrollTop ) {
      this.#direction = Math.sign(thisScrollTop - this.#lastScrollTop);
      this.#lastScrollTop = thisScrollTop;
    }
    console.log(this.#direction, this.#lastScrollTop);
    this.nextPop = setTimeout(() => {
      //console.info('setting');
      const rows = target.querySelectorAll('tbody tr');
      rows.forEach(el => el.style.left = target.scrollLeft+'px');
      //rows.forEach(el => el.style.top = target.scrollTop+'px');
    }, 50);
    this.#updating = false;
  }
}
