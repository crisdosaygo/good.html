class Infin extends Base {
  constructor() {
    super();
    this.untilVisible().then(() => {
      this.#top = new IntersectionObserver(
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

  topToPool() {
    this.first().forEach(el => {
      //this.#top.unobserve(el);
      el.style.top = `-${el.scrollHeight+10}px`;
      el.classList.add('sc-pool');
      el.classList.remove('sc-item');
    })
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
    const pool = this.viewport.querySelector('.sc-pool');
    const firstTop = this.firstTop();
    if ( pool ) {
      pool.classList.remove('sc-pool');
      pool.classList.add('sc-item');
      pool.style.top = `${firstTop-pool.scrollHeight}px`;
    }
  }

  poolToBottom(entry) {
    const pool = this.viewport.querySelector('.sc-pool');
    const lastBottom = this.lastBottom();
    if ( pool ) {
      pool.classList.remove('sc-pool');
      pool.classList.add('sc-item');
      pool.style.top = `${lastBottom}px`;
    }
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
    this.nextPop = setTimeout(() => {
      //console.info('setting');
      const rows = target.querySelectorAll('tbody tr');
      rows.forEach(el => el.style.left = target.scrollLeft+'px');
      //rows.forEach(el => el.style.top = target.scrollTop+'px');
    }, 50);
    this.#updating = false;
  }
}
