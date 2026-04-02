class Component extends Base {
  ToggleChild(clickEvent) {
    const newState = cloneState('TestState');
    newState.showChild = !newState.showChild;
    newState.toggleCount = (newState.toggleCount || 0) + 1;
    console.log(`[TEST] ToggleChild: showChild=${newState.showChild}, cycle=${newState.toggleCount}`);
    setState('TestState', newState);
  }
}
