class Component extends Base {
  Undo() {
    undoLastState();
  }

  Redo() {
    redoLastState();
  }

  OpenSizer() {
    prompt('New size');
  }
}

