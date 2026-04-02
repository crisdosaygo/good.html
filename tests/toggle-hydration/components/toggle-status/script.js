class Component extends Base {
  StatusAction(clickEvent) {
    console.log('[TEST] StatusAction clicked!');
    document.getElementById('test-log').textContent += 
      `StatusAction clicked\n`;
  }
}
