class Infin extends Base {
  UpdatePosition(scrollEvent) {
    const {target} = scrollEvent; 
    console.log('scrolling');
    if ( this.nextPop ) clearTimeout(this.nextPop);
    this.nextPop = setTimeout(() => {
      console.info('setting');
      const rows = target.querySelectorAll('tbody');
      rows.forEach(el => el.style.left = target.scrollLeft+'px');
      rows.forEach(el => el.style.top = target.scrollTop+'px');
    }, 50);
  }
}
