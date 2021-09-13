class Component extends Base {
  Confirm(event) {
    console.info('confirming event', event);
    confirm(event);
  }
  Alert(event) {
    console.info('alerting event', event);
    alert(event);
  }
}
