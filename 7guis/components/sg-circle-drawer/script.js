class CircleDrawer extends Base {
  static Radius = 32;

  AddCircle(clickEvent) {
    if ( clickEvent.target.matches('sg-circle') ) return;

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
    setState('data', state);
    console.log(History);
  }

  OpenSizer(event) {
    if ( event.type === 'contextmenu' ) {
      //event.preventDefault();
    }
    const selected = event.target.dataset.key;
    const state = cloneState('data');
    state.circleDrawer.selected = selected;
    setState('data', state);
  }

  SizeSelected(inputEvent) {
    const state = cloneState('data');
    const circle = state.circleDrawer.circles.find(({key}) => key === state.circleDrawer.selected);
    // we use path[0] rather than target because we attach to sg-sizer-modal not input[type="range"]
    // just so we can keep all methods in circle drawer
    circle.radius = inputEvent.path[0].valueAsNumber;
    setState('data', state);
    console.log(History);
  }

  CloseSizer(event) {
    // Conditionals Explained:
      // even tho this check looks messy it means we don't close the sizer
      // if we get a click on the circle, or 
      // if the click was on the dialog tag, only on its background, which is
      // the host sg-sizer-modal overlay
    if ( event.target.matches('sg-circle.selected') || event.path[0].closest('dialog') ) return;

    if ( event.type === 'contextmenu' ) {
      //event.preventDefault();
    }
    event.stopPropagation();

    const state = cloneState('data');
    state.circleDrawer.selected = ''
    setState('data', state);
  }

  Undo() {
    undoState('data');
  }

  Redo() {
    redoState('data');
  }
}
