class Infin extends Base {
  constructor() {
    super();
    this.untilVisible().then(() => {
      this.#top = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if ( entry.boundingClientRect.y == entry.intersectionRect.y ) return;
          if ( entry.isIntersecting ) this.poolToTop(entry);
          else this.topToPool(entry.target);
        }), 
        {root: this.viewport}
      );
      this.#bottom = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if ( entry.boundingClientRect.height == entry.intersectionRect.height ) return;
          //if ( entry.isIntersecting ) this.poolToBottom(entry);
          //else this.bottomToPool(entry.target);
          this.poolToBottom(entry);
        }), 
        {root: this.viewport}
      );

      console.log(this.viewport);

      // so when the first row crosses threshold, put new one on bottom
      // when last row crosses threashold, put one on top
      const first = this.viewport.querySelector('tr.sc-item');
      const last = Array.from(this.viewport.querySelectorAll('tbody tr.sc-item')).pop();
      console.log(first, last);
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

    #top;
    #bottom;
    #viewport;

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
    if ( pool ) {
      pool.classList.remove('sc-pool');
      pool.classList.add('sc-item');
      pool.style.top = `${top-pool.scrollHeight}px`;
      this.#top.observe(pool);
    }
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
    console.log('last', last);
    if ( pool ) {
      pool.classList.remove('sc-pool');
      pool.classList.add('sc-item');
      pool.style.top = `${lastTop+last.scrollHeight}px`;
      this.#bottom.observe(pool);
    }
    //this.#bottom.observe(last);
  }

  UpdatePosition(scrollEvent) {
    const {target} = scrollEvent; 
    //console.log('scrolling');
    if ( this.nextPop ) clearTimeout(this.nextPop);
    this.nextPop = setTimeout(() => {
      //console.info('setting');
      const rows = target.querySelectorAll('tbody');
      rows.forEach(el => el.style.left = target.scrollLeft+'px');
      //rows.forEach(el => el.style.top = target.scrollTop+'px');
    }, 50);
  }
}
