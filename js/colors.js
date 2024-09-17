
const colorpicker = ["white","white","white","white","white","white","white","white"];
let nextColor = -1; //the index into colorpicker arrays -- gets initialized to 0 first time it is used
const maxColors = colorpicker.length;

let colorElement = document .querySelector( '.select-color' ); // returns the first of many, as an initial default
let currentColor = colorElement.style[ 'background-color' ]; // the color used to color beads, individually or with "color all"
colorElement.classList .add( 'selected-color' ); // style the outline

let colorPickerColor = "#257b98"; //gets set by the interactive color picker.

/* if one of the color choices is clicked on, change currentColor to its color */
const useColor = ( el ) =>
{
  currentColor = el.style[ 'background-color' ];
  colorElement.classList .remove( 'selected-color' );
  el.classList .add( 'selected-color' ); // style the outline
  colorElement = el;
}

// called when the user pushes the ADD button (which means add the color picker color to the palette)
function addToPalette(color) {
  if (nextColor == maxColors-1) {
      nextColor = 0;
    }
    else {
      nextColor++;
    }
    //alert ("add to palette " + color + " in slot " + nextColor);
    var elem = document.getElementById('color-' + nextColor);
    elem.style["background-color"]=color;
    colorpicker[nextColor] = color;
    useColor( elem );
}

// set up listeners when this script is first loaded

document .getElementById( 'add-color' ) .addEventListener( 'click', () => addToPalette(colorPickerColor) );

document .querySelectorAll( ".select-color") .forEach( el => el .addEventListener( "click", () => useColor( el ) ) );

document .getElementById( "color-picker" ) .addEventListener( "change", event => { colorPickerColor = event.target.value; } );

export { currentColor };