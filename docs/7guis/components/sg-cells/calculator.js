export async function run({cell}) {
  console.log('running');
  const CellProxy = Proxy.revocable(cell, {
    get(target, prop, receiver) {
      if ( target[prop] ) {
        return target[prop].value;
      } else {
        throw new ReferenceError(`No such cell ${prop}`);
      }
    }
  });
  for( let [coord, {formula,value}] of Object.entries(cell) ) {
    if ( formula ) {
      with(CellProxy) {
        try {
          const cellValue = eval(`(() => { const result `${formula}`; return result; }())`);
        } catch(e) {
          console.info('cell error', coord, formula, e);
          value = 'error'; 
        }
      }
      cell[coord].value = value;
    }
  }
  CellProxy.revoke();
}
