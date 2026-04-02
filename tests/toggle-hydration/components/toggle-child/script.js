class Component extends Base {
  ChildAction(clickEvent) {
    const newState = cloneState('TestState');
    newState.childClicks = (newState.childClicks || 0) + 1;
    console.log(`[TEST] ChildAction clicked! count=${newState.childClicks}`);
    document.getElementById('test-log').textContent += 
      `ChildAction click #${newState.childClicks}\n`;
    setState('TestState', newState);
  }

  AnotherAction(clickEvent) {
    console.log('[TEST] AnotherAction clicked!');
    document.getElementById('test-log').textContent += 
      `AnotherAction clicked\n`;
  }
}
