class Infin extends Base {
  constructor() {
    super();
    this.untilVisible().then(() => {
      this.#top = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if ( entry.boundingClientRect.y == entry.intersectionRect.y ) return;
          console.log('top', this.#direction);
          if ( this.#direction >= 0 ) {
            this.topToPool(entry.target);
          } else {
            this.poolToTop(entry);
          }
        }), 
        {root: this.viewport}
      );
      this.#bottom = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if ( entry.boundingClientRect.height == entry.intersectionRect.height ) return;
          console.log('bottom', this.#direction);
          if ( this.#direction >= 0 ) {
            this.poolToBottom(entry);
          } else {
            this.bottomToPool(entry.target);
          }
        }), 
        {root: this.viewport}
      );

      // so when the first row crosses threshold, put new one on bottom
      // when last row crosses threashold, put one on top
      const first = this.viewport.querySelector('tr.sc-item');
      const last = Array.from(this.viewport.querySelectorAll('tbody tr.sc-item')).pop();
      //console.log(first, last);
      this.#top.observe(first);
      this.#bottom.observe(last);

      let start = 0;
      Array.from(this.viewport.querySelectorAll('tr.sc-item')).forEach(row => {
        row.style.top = `${start}px`;
        start += row.scrollHeight;
      });
    });
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
    el.style.top = `-${el.scrollHeight+10}px`;
    el.classList.add('sc-pool');
    el.classList.remove('sc-item');
    this.#top.unobserve(el);
    let first, firstTop = Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top);
        if ( thisTop < firstTop ) {
          firstTop = thisTop;
          first = el;
        }
      });
    console.log('first', first);
    this.#top.observe(first);
  }

  bottomToPool(el) {
    console.log("Bottom to pool", el);
    el.style.top = `-${el.scrollHeight+10}px`;
    el.classList.add('sc-pool');
    el.classList.remove('sc-item');
    this.#bottom.unobserve(el);
    let last, lastTop = -Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top);
        if ( thisTop > lastTop ) {
          lastTop = thisTop;
          last = el;
        }
      });
    console.log('last', last);
    this.#bottom.observe(last);
  }

  poolToTop(entry) {
    console.log("Pool to top", entry);
    const {top} = entry.boundingClientRect;
    const pool = this.viewport.querySelector('.sc-pool');
    let first, firstTop = Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top);
        if ( thisTop < firstTop ) {
          firstTop = thisTop;
          first = el;
        }
      });
    console.log('first', first);

    if ( pool ) {
      pool.classList.remove('sc-pool');
      pool.classList.add('sc-item');
      pool.style.top = `${firstTop-pool.scrollHeight}px`;
      this.#top.observe(pool);
    }
    //this.#top.observe(first);
  }

  poolToBottom(entry) {
    console.log("Pool to bottom", entry);
    const {bottom} = entry.boundingClientRect;
    const pool = this.viewport.querySelector('.sc-pool');
    let last, lastTop = -Infinity;
    Array.from(this.viewport.querySelectorAll('tbody tr.sc-item'))
      .find(el => {
        const thisTop = parseFloat(el.style.top);
        if ( thisTop > lastTop ) {
          lastTop = thisTop;
          last = el;
        }
      });
    if ( pool ) {
      pool.classList.remove('sc-pool');
      pool.classList.add('sc-item');
      pool.style.top = `${lastTop+last.scrollHeight}px`;
      this.#bottom.observe(pool);
    }
    //this.#bottom.observe(last);
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
      console.log(this.#direction, this.#lastScrollTop, thisScrollTop);
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
