export async function run({cell}) {
  console.log('running');
  for( const [coord, {formula,value}] of Object.entries(cell) ) {
    console.log({coord, formula, value});
  }
}
