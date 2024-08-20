import { currentCircum, currentRepeat, repeatColors } from "./repeat.js";

const lcm = ( num1, num2 ) =>
  {
    let min = (num1 > num2) ? num1 : num2;
  
    // while loop
    while (true) {
        if (min % num1 == 0 && min % num2 == 0) {
            return min;
        }
        min++;
    }
  }
  
//calculate and return the number of rows in a Repeat
function calculateNumRows( c, r )
{
  var double_row_length = (c*2)+1;
  var num_double_rows = (Math.floor(r/double_row_length));
  var excess = (r%((2*c)+1));
  //alert("excess: " + excess + " num_double_rows: " + num_double_rows + " double_row_length: " + double_row_length);
  if (excess > 0) {
    if (excess > (c+1))  {
        return (num_double_rows*2) + 2;
    }
    else return (num_double_rows*2) + 1;
    }
  else return num_double_rows*2;
}

function computeBookIndex( row, col, offset )
{
  let x = currentCircum*(row-1) + Math.floor( ((row)/2+1) ) + offset; //compute the offset in the repeat for the first bead in the row
  let bead = 0;
  for( let j=1; j<=col; j++ ) {
    if ((x%currentRepeat) == 0) { //if finished repeat, set the repeat offset to r and reset r back to 1 for next iteration
      bead = currentRepeat;
      x=1;
    }
    else {//otherwise not finished with repeat, so set repeat offset to (x mod r) and just increment x for next iteration
      bead = x % currentRepeat; // setrepeat offset for this bead
      x++;
    }
  }
  return bead;
}

function recomputeBookIndices( parent, offset )
{
  for ( const circle of parent .children ) {
    const row = Number( circle .getAttribute( "row" ) );
    const col = Number( circle .getAttribute( "col" ) );
    const index = computeBookIndex( row, col, offset );
    circle .removeAttribute( 'class' );
    circle .classList .add( 'bookindex-' + index );
  }
}

const paintBeads = ( bead, color ) =>
{
  for ( const circle of document .querySelectorAll( '.bookindex-'+bead ) ) {
    circle .setAttribute( 'fill', color );
  }
}

const paintRepeatColors = () => repeatColors .forEach( ( color, i ) => paintBeads( i+1, color ) );

export { lcm, calculateNumRows, computeBookIndex, recomputeBookIndices, paintBeads, paintRepeatColors }
