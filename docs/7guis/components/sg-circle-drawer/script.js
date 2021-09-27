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

    const state = cloneState('circleDrawer');
    state.circles.push({
      key: `${x},${y}`,
      x, y, 
      radius: r
    });
    setState('circleDrawer', state, {save:true});
  }

  OpenSizer(event) {
    //console.log('OpenSizer');
    if ( event.type === 'contextmenu' ) {
      //event.preventDefault();
    }
    const selected = event.target.dataset.key;
    const state = cloneState('circleDrawer');
    state.selected = selected;
    setState('circleDrawer', state);
  }

  SizeSelected(inputEvent) {
    //console.log('SizeSelected');
    const state = cloneState('circleDrawer');
    const circle = state.circles.find(({key}) => key === state.selected);
    // explanation for reference
      // we use composedPath()[0] rather than target because we 
      // attach to sg-sizer-modal not input[type="range"]
      // just so we can keep all methods in circle drawer
    circle.radius = inputEvent.composedPath()[0].valueAsNumber;
    setState('circleDrawer', state);
  }

  CloseSizer(event) {
    // Conditionals Explained:
      // even tho this check looks messy it means we don't close the sizer
      // if we get a click on the circle, or 
      // if the click was on the dialog tag, only on its background, which is
      // the host sg-sizer-modal overlay
    if ( event.target.matches('sg-circle.selected') || event.composedPath()[0].closest('dialog,button') ) return;

    const state = cloneState('circleDrawer');

    if ( ! state.selected ) return;

    //console.log('CloseSizer');

    if ( event.type === 'contextmenu' ) {
      //event.preventDefault();
    }
    event.stopPropagation();

    state.selected = '';
    setState('circleDrawer', state);
  }

  SaveCircleSize(changeEvent) {
    //console.log('Size Change: Saving...');

    // modify the state we are saving to history so we remove the modal / selected node
    // this might be a single call if we had a 'saveState' method

    const state = cloneState('circleDrawer'); 
    const {selected} = state;
    state.selected = '';
    setState('circleDrawer', state, {save:true, rerender: false});
    state.selected = selected;
    setState('circleDrawer', state, {rerender: false});
  }

  Undo() {
    //console.log('Undo');
    undoState('circleDrawer');
  }

  Redo() {
    //console.log('Redo');
    redoState('circleDrawer');
  }
}
