class Component extends Base {
  capture(value) { return () => globalThis.renderContract.calls.push(value); }
  note(value) { return () => globalThis.renderContract.calls.push(`after:${value}`); }
  row(id, index) { return () => globalThis.renderContract.calls.push({id, index}); }
  deferred(label) {
    const owner = globalThis.renderContract;
    owner.started.push(label);
    return owner.gates.get(label)?.promise || label;
  }
}
