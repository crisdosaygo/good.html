class CircleDrawer extends Base {
  static Radius = 32;

  AddCircle(clickEvent) {
    if ( clickEvent.target.matches('sg-circle') ) return;
    //console.log('AddCircle');

    const {clientX,clientY} = clickEvent;
    const frame = clickEvent.target.closest('.canvas');
    const {left,top} = frame.getBoundingClientRect();
    const r = CircleDrawer.Radius;
    const x = clientX - left;
    const y = clientY - top;

    const state = cloneState('data');
    state.circleDrawer.circles.push({
      key: `${x},${y}`,
      x, y, 
      radius: r
    });
    setState('data', state, {save:true});
  }

  OpenSizer(event) {
    //console.log('OpenSizer');
    if ( event.type === 'contextmenu' ) {
      //event.preventDefault();
    }
    const selected = event.target.dataset.key;
    const state = cloneState('data');
    state.circleDrawer.selected = selected;
    setState('data', state);
  }

  SizeSelected(inputEvent) {
    //console.log('SizeSelected');
    const state = cloneState('data');
    const circle = state.circleDrawer.circles.find(({key}) => key === state.circleDrawer.selected);
    // explanation for reference
      // we use composedPath()[0] rather than target because we 
      // attach to sg-sizer-modal not input[type="range"]
      // just so we can keep all methods in circle drawer
    circle.radius = inputEvent.composedPath()[0].valueAsNumber;
    setState('data', state);
  }

  CloseSizer(event) {
    // Conditionals Explained:
      // even tho this check looks messy it means we don't close the sizer
      // if we get a click on the circle, or 
      // if the click was on the dialog tag, only on its background, which is
      // the host sg-sizer-modal overlay
    if ( event.target.matches('sg-circle.selected') || event.composedPath()[0].closest('dialog,button') ) return;

    const state = cloneState('data');

    if ( ! state.circleDrawer.selected ) return;

    //console.log('CloseSizer');

    if ( event.type === 'contextmenu' ) {
      //event.preventDefault();
    }
    event.stopPropagation();

    state.circleDrawer.selected = '';
    setState('data', state);
  }

  SaveCircleSize(changeEvent) {
    //console.log('Size Change: Saving...');

    // modify the state we are saving to history so we remove the modal / selected node
    // this might be a single call if we had a 'saveState' method

    const state = cloneState('data'); 
    const {selected} = state.circleDrawer;
    state.circleDrawer.selected = '';
    setState('data', state, {save:true, rerender: false});
    state.circleDrawer.selected = selected;
    setState('data', state, {rerender: false});
  }

  Undo() {
    //console.log('Undo');
    undoState('data');
  }

  Redo() {
    //console.log('Redo');
    redoState('data');
  }
}
