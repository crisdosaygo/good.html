class Infin extends Base {
  constructor() {
    super();
    this.untilVisible().then(() => {
      this.#top = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if ( this.#direction >= 0 ) {
            this.topToPool(this.first().first);
            this.poolToBottom(entry);
          } else {
            this.poolToTop(entry);
            this.bottomToPool(this.last().last);
          }
        }), 
        {root: this.viewport, threshold: 1.0}
      );
      this.#bottom = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if ( this.#direction >= 0 ) {
            this.topToPool(this.first().first);
            this.poolToBottom(entry);
          } else {
            this.poolToTop(entry);
            this.bottomToPool(this.last().last);
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
      });
      this.topToPool(this.first().first);
      this.bottomToPool(this.last().last);
    });
  }

  first() {
    let first, firstTop = Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top);
        if ( thisTop < firstTop ) {
          firstTop = thisTop;
          first = el;
        }
      });
    console.log('f', first);
    return {first, firstTop};
  }

  last() {
    let last, lastTop = -Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top);
        if ( thisTop > lastTop ) {
          lastTop = thisTop;
          last = el;
        }
      });
    console.log('l', last);
    return {last, lastTop};
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

  topToPool(el) {
    console.log("Top to pool", el);
    this.#top.unobserve(el);
    el.style.top = `-${el.scrollHeight+10}px`;
    el.classList.add('sc-pool');
    el.classList.remove('sc-item');
    this.#top.observe(this.first().first);
  }

  bottomToPool(el) {
    console.log("Bottom to pool", el);
    this.#bottom.unobserve(el);
    el.style.top = `-${el.scrollHeight+10}px`;
    el.classList.add('sc-pool');
    el.classList.remove('sc-item');
    this.#bottom.observe(this.last().last);
  }

  poolToTop(entry) {
    console.log("Pool to top", entry);
    const pool = this.viewport.querySelector('.sc-pool');
    const {firstTop,first} = this.first();
    if ( pool ) {
      pool.classList.remove('sc-pool');
      pool.classList.add('sc-item');
      pool.style.top = `${firstTop-pool.scrollHeight}px`;
      this.#top.observe(pool);
    }
  }

  poolToBottom(entry) {
    console.log("Pool to bottom", entry);
    const pool = this.viewport.querySelector('.sc-pool');
    const {lastTop, last} = this.last();
    if ( pool ) {
      pool.classList.remove('sc-pool');
      pool.classList.add('sc-item');
      pool.style.top = `${lastTop+last.scrollHeight}px`;
      this.#bottom.observe(pool);
    }
  }

  UpdatePosition(scrollEvent) {
    if ( this.#updating ) return;
    this.#updating = true;
    const {target} = scrollEvent; 
    //console.log('scrolling');
    //if ( this.nextPop ) clearTimeout(this.nextPop);
    let thisScrollTop = target.scrollTop;
    if ( thisScrollTop !== this.#lastScrollTop ) {
      this.#direction = Math.sign(thisScrollTop - this.#lastScrollTop);
      this.#lastScrollTop = thisScrollTop;
    }
    //this.nextPop = setTimeout(() => {
      //console.info('setting');
      const rows = target.querySelectorAll('tbody');
      rows.forEach(el => el.style.left = target.scrollLeft+'px');
      //rows.forEach(el => el.style.top = target.scrollTop+'px');
    //}, 50);
    this.#updating = false;
  }
}
