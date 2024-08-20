
let input;

let beadBorderColor = '#808080';
const setBorderColor = color => 
{
  beadBorderColor = color; // need this for setBorderWidth below
  document .querySelectorAll( "svg" ) .forEach( el => el .setAttribute( 'stroke', color ) );
}
input = document .getElementById( 'border-color' );
input .setAttribute( 'value', beadBorderColor );
input .addEventListener( "input", event => setBorderColor( event.target.value ) );
setBorderColor( beadBorderColor );

const beadBackground = '#cccccc';
const setBackgroundColor = color =>
{
  document .querySelectorAll( ".beads-bkgd" ) .forEach( el => el .style[ "background-color" ] = color );
  document .getElementById( 'tile-bkgd' ) .setAttribute( 'fill', color );
}
input = document .getElementById( 'background-color' );
input .setAttribute( 'value', beadBackground );
input .addEventListener( "input", event => setBackgroundColor( event.target.value ) );
setBackgroundColor( beadBackground );

const beadBorderWidth = '0.06';
const setBorderWidth = width => document .querySelectorAll( "svg" ) .forEach( el => {
  if ( width === 'none' )
    el .setAttribute( 'stroke', 'none' );
  else {
    el .setAttribute( 'stroke', beadBorderColor );
    el .setAttribute( 'stroke-width', width );
  }
} );
input = document .getElementById( 'border-width' );
input .setAttribute( 'value', beadBorderWidth );
input .addEventListener( "input", event => setBorderWidth( event.target.value ) );
setBorderWidth( beadBorderWidth );
