//See beadCrochetAppNotes for an important note regarding parameters controlling the bead size on the screen.

import { openFile, saveFileAs } from './files.js';
import { generateImageBlobFromSVG } from './images.js';

let colorElement = document .querySelector( '.select-color' ); // returns the first
let colorClass = colorElement.style[ 'background-color' ];
colorElement.classList .add( 'selected-color' );

let colorPickerColor = "#257b98"; //gets set by the interactive color picker.

let beadBackground = '#cccccc';
let beadBorderColor = 'grey';
let beadBorderWidth = '0.06';
let pixelsPerBead = 26; // for image output

let currentCircum = 7;
let currentRepeat = 57;
let lastRepeat = 0;
let lastCircum = 0;
let currentTwist = 0;

const colorpicker = ["white","white","white","white","white","white","white","white"];
let nextColor = -1; //the index into colorpicker arrays -- gets initialized to 0 first time it is used
const maxColors = colorpicker.length;

//UNDO/REDO variables
let remaining_undos = -1; //keeps track of how many times we can undo -- will be incremented to 0 when start state is saved
let remaining_redos = 0; //keeps track of how many times we can redo -- will be incremented to 1 when first undo occurs
const history_limit = 26;  //note: we can save up to history_limit-1 new states because the original state is the first push
let repeatHistory = []; //will hold the repeat arrays for prior states for undo/redo. Implented as a circular array
let historyIndex = history_limit - 1; //will hold the current index into the repeatHistory array, used for undo/redo
                                  //Because circular array, in first call to saveToHistory, this will be advanced to position 0
//The number of UNDO or REDO actions the user can take is limited by the history_limit variable (it is one less than it)
const bpWidth = 38;//38
const bpHeight = 56;//62  NOTE: THIS MUST BE AN EVEN NUMBER OR POSSIBLY BUGS???
const minCircum = 3; //the minimum circumference choice allowed
const maxCircum = 20; //the maximum circumference choice allowed
const minRepeat = 2; //the minimum length of the repeat allowed
const maxRepeat = 1000; //the maximum length of the repeat allowed.

const vrpBeadDiameter = 20;

// This should be the source of truth, not the circles in the VR!
let repeatColors = []; //this is the most important array for representing the state of the repeat.

let spin_offset = 0;

let repeatLocked = false; //true if the user locks the repeat length with the lock button

// remember to put in an extra blank bead at the beginning of patterns, since we don't use the 0th element
const builtInDesigns = {
  mobius6             : [ 6, "black", "white", "white","white", "white", "white","white", "white", "white", "white"],
  hexagonalgrid7      : [ 7, "blue","blue","blue","blue","blue","red","red","red","blue","blue","blue","blue","red","red","red","red","blue","blue","blue","red","red","red","red","red","white","white","white","red","red","red","red","white","white","white","white","red","red","red","white","white","white","white","white","blue","blue","blue","white","white","white","white","blue","blue","blue","blue","white","white","white"],
  harlequin6          : [ 6, "black","black","black","black","black","black","black","black","black","black","black","black","green","black","black","black","black","black","green","green","black","black","black","black","green","green","green","black","black","black","green","green","green","green","black","black","green","green","green","green","green","black","green","green","green","green","green","green","green","green","green","green","green","green","black","green","green","green","green","green","black","black","green","green","green","green","black","black","black","green","green","green","black","black","black","black","green","green","black","black","black","black","black","green"],
  honeycomb9          : [ 9, "black","black","black","black","white","white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white","white","black","white","white"],
  equilateraltriangle7: [ 7, "lightgreen", "lightgreen", "black","white", "white", "lightblue","lightblue", "black", "lightgreen", "lightgreen","white","white","black","lightblue","lightblue"],
  hexagonalgrid10     : [10, 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green', 'green', 'white', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green', 'green', 'green', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green','green', 'green', 'green','white', 'white', 'white', 'white','green','green','green', 'green','green'],
}

const ThanksMessage = "Written by Ellie Baker. Designed by Ellie Baker and Susan Goldstine. Many people helped and/or consulted on the development of this code. Ellie takes full responsibility for all atrocities and errors, but owes thanks to Michael Klugerman for extensive consulting on coding in Javascript and HTML, and Craig Kaplan who helped with an earlier version written in Processing. Thanks are also due to Sophie Sommer, Lila Masand, Mike Komosinski, and Christine Langston for coding help and other consulting."

/* if one of the color choices is clicked on, change colorClass to its color */
const useColor = ( el ) =>
{
  colorClass = el.style[ 'background-color' ];
  colorElement.classList .remove( 'selected-color' );
  el.classList .add( 'selected-color' );
  colorElement = el;
}
document.querySelectorAll( ".select-color") .forEach( el => el .addEventListener( "click", () => useColor( el ) ) );



//save the current state to the history array for use by undo/redo. The index to the new slot gets advanced
//or decremented (as needed) by a separate function called here  -- adjust_circular_buffer_index()
function saveToHistory()
{
  // TODO: make an object, not this array
  const a = [ currentCircum, ...repeatColors ]; //save the circumference in the 0th element of a new array, since we don't use that slot for the repeat data

  historyIndex = adjust_circular_buffer_index(1, historyIndex, history_limit); //advance the historyIndex by 1 to a new slot
  repeatHistory[historyIndex] = a; //save this new array in this next spot in the repeatHistory array
  remaining_undos++;
  if (remaining_undos >= history_limit) {//stop accruing potential undos when we reach the global limit
    remaining_undos = history_limit-1;
  }
}

function updateRepeat()
{
  const repeat = document.getElementById('fREPEAT');
  if ((repeat.value > maxRepeat) || (repeat.value < minRepeat)) {
    alert('Repeat length must be between ' + minRepeat + ' and ' + maxRepeat);
    repeat.value = currentRepeat;
    return 0;
  }
  lastRepeat = currentRepeat;
  currentRepeat = Number(repeat.value);
  if (currentRepeat > lastRepeat) {
    // got bigger
    refreshEverything( [ currentRepeat, ...repeatColors, "white" ], true );
  }
  else if (currentRepeat < lastRepeat) {
    // got smaller
    refreshEverything( [ currentRepeat, ...repeatColors.slice( 0, currentRepeat ) ], true );
  }
}

function updateCircumference()
{
  const circum = document.getElementById('fCircumference');

  if ((circum.value > maxCircum) || (circum.value < minCircum)) {
    alert('Circumference must be between ' + minCircum + ' and ' + maxCircum);
    circum.value = currentCircum;
    return 0;
  }
  lastCircum = currentCircum;
  currentCircum = Number(circum.value);
  //alert(lastRepeat + " " + lastCircum + " " + currentRepeat + " " + currentCircum);
  // if something changed redraw the repeat and make any other needed changes to the display
  //Note that we essentially allow only one change at a time -- you can't change both repeat
  //circumference at the same time, and circumference changes take precedence over repeat changes,
  //since changes the circumference also changes the repeat, but not vice versa.
  if (currentCircum > lastCircum) {
    if (repeatLocked)
      circumferenceChangedRepeatLocked();
    else
      circumferenceGotBigger();
  }
  else if (currentCircum < lastCircum) {
    if (repeatLocked)
      circumferenceChangedRepeatLocked();
    else
      circumferenceGotSmaller();
  }
}

function updateTwist()
{
  const twist = document.getElementById('fTwist');
  if (twist != currentTwist) {//twist value changed
    //if ((twist > 30) || (twist < -30)) {
    //alert('Twist must be between -30 and 30 degrees.');
      if (twist.value > 30) {
        twist.value = 30;
      }
      else if (twist.value < -30) {
        twist.value = -30;
      }
    //console.log("twist is " + twist.value);
    currentTwist = twist.value;
    doTwist(currentTwist);
  }
}

//Change the circumference when the repeat length has been locked (much easier than when the repeat is not locked)
function circumferenceChangedRepeatLocked()
{
  lastRepeat = currentRepeat;
  refreshEverything( [ currentRepeat, ...repeatColors.slice( 0, currentRepeat ) ], true );
}

//If the circumference increases, I've made a design choice to also increase the length of the repeat,
// so as not to reduce height just because we are increasing width.  This decision made this a particularly
//nasty function since we are effectively changing two things at once...
function circumferenceGotBigger()
{
  const delta = currentCircum - lastCircum;
  let revised_r = 0;
  const olddouble_row_length = (lastCircum*2)+1;
  // since circumference has increased, we're going to need to add add more to the repeat length to
  //account for the bigger circumference, so calculate a new revised repeat length as well.
  //To the current repeat, we add two extra beads for every double row
  revised_r = currentRepeat + (  Math.floor((currentRepeat/((2*lastCircum)+1))) * (2 * delta));
  if ((currentRepeat % ((2*lastCircum)+1)) >= (lastCircum+1)) {//if there's an additional full single row at the top
    revised_r+=delta;//then add delta more beads, so that every full row gets delta extra beads.
  }
  if (revised_r > maxRepeat) {
    revised_r = maxRepeat;  //limit the increase in the repeat to the maximum allowed.
  }
  //alert("new repeat length is " + revised_r + " delta is " + delta);
  lastRepeat = currentRepeat;
  currentRepeat = revised_r;
  document .getElementById("fREPEAT") .value = revised_r;

  let new_colours = new Array(revised_r+1);//we need an extra space because we store the circum at 0 and the rest at 1 to n

  var indented_row = false;
  for ( let i = 1, old_i=1; (i <= (revised_r)) && (old_i <= lastRepeat+1); i++, old_i++ ) {
    //console.log("i, old_i : " + i + " " + old_i);
    //if we're at the end of a double row or a single row, paint in the extra white beads
    if ( (((old_i % olddouble_row_length) == 1) && indented_row) || //if start of a
          ( ((old_i % olddouble_row_length) == (lastCircum+2)) && !indented_row) ) {
      old_i--;
      //console.log("made it through first conditional")
      for ( let j = 0; ((j < delta) && ((i+j) <= (revised_r))); j++) {
        //console.log("i, j, delta, revised_r, last repeat are: " + i + " " + j + " " + delta + " " + revised_r + " " + lastRepeat);
        new_colours[i+j] = "white";
        //console.log("A new bead is inserted at" + " index " + (i+j));
      }
      if (indented_row == true) {//toggle indented_row
        indented_row = false;
      } else {
        indented_row = true;
      }
      i+=(delta-1);
    }
    else {
      new_colours[i] = repeatColors[old_i-1];
    }
  }

  new_colours[ 0 ] = currentRepeat;
  refreshEverything( new_colours, true);
}

function circumferenceGotSmaller()
{
  const delta = lastCircum - currentCircum;
  // since circumference has decreased, we're going to need to reduce the repeat length to
  //account for the smaller circumference, so calculate a new revised repeat length as well.
  //To the current repeat, we remove two extra beads for every double row
  let revised_r = currentRepeat - (  Math.floor((currentRepeat/((2*lastCircum)+1))) * (2 * delta));
  if ((currentRepeat % ((2*lastCircum)+1)) >= (lastCircum+1)) {//if there's an additional full single row at the top
    revised_r-=delta;//then remove delta more beads, so that every full row gets delta fewer beads.
  }
  //alert("new repeat length is " + revised_r + " delta is " + delta);
  lastRepeat = currentRepeat;
  currentRepeat = revised_r;
  document .getElementById( "fREPEAT" ) .value = revised_r;//set the repeat on screen to its new value
  const num_rows = calculateNumRows(lastCircum, lastRepeat);
  //alert("num_rows is " + num_rows);
  let new_colours = new Array(revised_r+1);//need extra slot because we store circum in slot 0 and use 1-n for repeat
  //copy the bead colors, lopping off the ones on the right of the old Repeat to reduce the circumference
  //I really hate this code.  There's gotta be a better way to do this!
  let index = 1;
  let indented_row = false;
  for ( let i=0; i<num_rows; i++) {
    for ( let j=1; j<=(lastCircum-delta); j++)  {
      if(index > (revised_r+1)) {break;}
      new_colours[index] = repeatColors[index+(delta*i)-1];
      //console.log(index + " coming from " + (index+(delta*i)));
      index++
    }
    if (!indented_row && (index<=revised_r+1)) {
      new_colours[index] = repeatColors[index+(delta*i)-1];
      //console.log(index + " coming from " + (index+(delta*i)));
      index++
    }
    if (indented_row == true) { //toggle indented_row
      indented_row = false;
    }
    else {
      indented_row = true;
    }
  }
  new_colours[ 0 ] = currentRepeat;
  refreshEverything( new_colours, true);
}

function commonRefresh()
{
  createRepeat();

  rebuildColoredNumbers();

  createTile();

  recomputeBookIndices( document .getElementById( "BPsvg" ) );
  recomputeBookIndices( document .getElementById( "ROPEsvg" ) );

  reshapeRope();
}

function rebuildColoredNumbers()
{
  const group = document .getElementById( "colored-numbers" )
  group .replaceChildren(); // remove the old numbers

  let color;
  let count = 0;
  const emitSpan = () =>
  {
    const span = document .createElement( 'span' );
    span .style .color = color;
    span .textContent = count + ' ';
    group .appendChild( span );
  }
  for (const beadColor of repeatColors) {
    if ( beadColor === color ) {
      ++count;
    } else {
      // emit the span for the last color
      color && emitSpan();
      // start on a new one
      count = 1;
      color = beadColor;
    }
  }
  emitSpan();
}

function refreshEverything( colorArray, resetRedo )
{
  repeatColors = colorArray .slice( 1 );
  if (resetRedo) { // not undoing or redoing
    remaining_redos = 0;
    saveToHistory();
  }

  document .getElementById( "VRPsvg" )     .replaceChildren(); // remove the old circles
  document .getElementById( "tile-group" ) .replaceChildren(); // remove the old circles

  spin_offset = 0; //reset the spin offset

  commonRefresh();

  // paint all beads with the new repeatColors
  repeatColors .forEach( ( color, i ) => paintBeads( i+1, color ) );
}

//calculate and return the number of rows in a Repeat
function calculateNumRows(c,r) {
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


//Simulate twisting of the rope by rotating it according to the input angle
function doTwist( angleInDegrees )
{
  if (angleInDegrees > 30) {
    angleInDegrees = 30;
  }
  document .getElementById( 'ROPEsvg' ) .setAttribute( 'transform', `rotate(${angleInDegrees},19,24)` );
}

function reshapeRope()
{
  const width = currentCircum/2;
  const viewbox = [ 19-width/2, 4, width, 42 ] .join( ' ' );
  const svgElem = document .getElementById( 'rope-svg' );
  svgElem .setAttribute( 'viewBox', viewbox );
  // svgElem .style .width = currentCircum * beadDiameter * SOMETHING; // let's try it fixed-width first
}

//This function gets called when the `Color All` button is pushed.  It clears the colors from the beadplane and repeat.
//It takes the repeat length as an input parameter.
function handleColorAll()
{
  repeatColors .map( (v,i,a) => a[i] = colorClass );
  saveToHistory();

  paintAllBeads( colorClass );
  remaining_redos = 0;
}

const lineHeight = Math.sqrt( 3 ) / 2;


function beadColored( bookIndex )
{
  repeatColors[ bookIndex-1 ] = colorClass;
  saveToHistory();

  paintBeads( bookIndex, colorClass );
  rebuildColoredNumbers();
  remaining_redos = 0;
}

function createBeadPlane( parent, clickable, height, width )
{
  for ( let i = height; i > 0; i-- ) {
    for( let j = 1; j <= width; j++ ){
      const newCircle = document.createElementNS( "http://www.w3.org/2000/svg", "circle" );
      newCircle.setAttribute( "r", 0.5 );
      newCircle.setAttribute( "fill", 'white' );
      newCircle.setAttribute( "cx", j + (i%2 ? 0.5 : 1 ) );
      newCircle.setAttribute( "cy", 1 + lineHeight * ( height - i ) );

      // We need row and col later, when assigning the beadOrder class
      newCircle.setAttribute( "row", i );
      newCircle.setAttribute( "col", j );

      if ( clickable ) { // only the beadplane is clickable
        // row and column have no relevance here... just beadorder
        newCircle.onclick = () => beadColored( computeBookIndex( i, j ) );
      }
      parent .appendChild(newCircle);
    }
  }
}

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

const beadDiameter = 1; // approx 2.8px/mm, so a 2mm bead in SVG
const tileBeadDiameter = 10;

function createTile()
{
  const L = lcm( 2*currentCircum+1, currentRepeat );
  const tileHeight = 2 * ( L / ( 2*currentCircum+1 ) );

  const svg = document .getElementById( 'tile-svg' );
  svg .style .width = `${(currentRepeat+1) * tileBeadDiameter}px`;
  const viewboxArray = [ 0, 0, currentRepeat*beadDiameter, tileHeight*lineHeight*beadDiameter ];
  svg .setAttribute( 'viewBox', viewboxArray .join( ' ' ) );
  const rect = document .getElementById( 'clip-rect' );
  rect .setAttribute( 'width', currentRepeat*beadDiameter );
  rect .setAttribute( 'height', tileHeight*lineHeight*beadDiameter );
  const group = document .getElementById( "tile-group" );
  createBeadPlane( group, false, tileHeight+1, currentRepeat+1 );
  recomputeBookIndices( group );
}

function computeBookIndex( row, col )
{
  let x = currentCircum*(row-1) + Math.floor( ((row)/2+1) ) + spin_offset; //compute the offset in the repeat for the first bead in the row
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

function recomputeBookIndices( parent )
{
  for ( const circle of parent .children ) {
    const row = Number( circle .getAttribute( "row" ) );
    const col = Number( circle .getAttribute( "col" ) );
    const index = computeBookIndex( row, col );
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


const paintAllBeads = ( color ) =>
{
  for (let index = 1; index <= currentRepeat; index++) {
    paintBeads( index, color );
  }
  rebuildColoredNumbers();
}

function createRepeat()
{
  // beads are drawn with diameter 1.0 in SVG coordinates
  const height = lineHeight * calculateNumRows( currentCircum, currentRepeat );
  const viewboxArray = [ -0.2, -0.4, currentCircum + 1.4, height + 0.6 ];

  const svgElem = document .getElementById( 'VRPsvg' );
  svgElem .setAttribute( 'viewBox', viewboxArray .join( ' ' ) );
  svgElem .style .width = `${(currentCircum+1) * vrpBeadDiameter}px`; // this determines the actual pixel scale of the repeat

  let indented_row = false;
  let beads_remaining_in_row = currentCircum + 1;
  let x = 0.5;
  let y = height - 0.5;  // drawing beads from the bottom up; SVG coords are zero at the top
  for (let index = 0; index < currentRepeat; index++) {
    const bookIndex = index + 1;

    const newElement = document.createElementNS( "http://www.w3.org/2000/svg", "circle" );
    newElement.setAttribute( "cx", x );
    newElement.setAttribute( "cy", y );
    newElement.setAttribute( "r", 0.5 );
    newElement.setAttribute( "fill", 'white' );

    // This is the magic that lets paintBeads() work
    newElement .classList .add( 'bookindex-' + bookIndex );
    newElement.onclick = function() {
      beadColored( bookIndex );
    };
    svgElem .append(newElement);

    --beads_remaining_in_row;
    x += 1.0;
    if ( beads_remaining_in_row === 0 ) {
      y -= lineHeight; // drawing beads from the bottom up; SVG coords are zero at the top
      indented_row = ! indented_row;
      if ( indented_row ) {
        beads_remaining_in_row = currentCircum;
        x = 1.0;
      } else {
        beads_remaining_in_row = currentCircum + 1;
        x = 0.5;
      }
    }
  }
}

//called when the user pushes the ADD button (which means add the color picker color to the palette)
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

function loadDesign( design )
{
  lastRepeat = currentRepeat;
  lastCircum = currentCircum;
  currentRepeat = design.length - 1;
  currentCircum = Number(design[0]);
  document.getElementById("fREPEAT") .value = currentRepeat;
  document.getElementById("fCircumference") .value = currentCircum;
  refreshEverything( design, true);
}

function loadFile( file )
{
  if ( !file )
    return;
  const reader = new FileReader();
  reader .addEventListener( "load", () => {
    const fileText = reader.result;
    if ( fileText ) {
      try {
        loadDesign( JSON.parse(fileText) );
      } catch(e) {
        alert("Input file not in correct format. "); // error in the above string
        console.log("Error reading file: " + e);
      }
    }
  }, false );
  reader.readAsText( file );
}

function loadSelectedSource()
{
  const val = document.getElementById('load-choices').value;
  if ( val === 'userfileplaceholder' ) {
    const fileType = { description: 'bead crochet design file', accept: { '*/*' : [ '.txt' ] } }
    openFile( [ fileType ] )
      .then( file => loadFile( file ) );
  } else if ( !!val ) {
    loadDesign( builtInDesigns[ val ] );
  }
}

//called when the user presses the "UNDO" button.  Returns to the previous state of the repeat.
//There are history_limit minus 1 possible undos.
function undo() {
  //console.log("in undo. historyIndex is " + historyIndex + "remaining_undos is " + remaining_undos + " remaining_redos is " + remaining_redos);
  if (remaining_undos == 0) {
    //console.log("out of undos");
    return; //we're at the limit of possible undos, so nothing more to undo
  }
  historyIndex = adjust_circular_buffer_index(-1, historyIndex, history_limit);
  //console.log("in undo. historyIndex adjusted to " + historyIndex);
  const temp_array = repeatHistory[historyIndex];
  const c = temp_array[0];
  const r = temp_array.length - 1;
  lastRepeat = currentRepeat; //Not sure what to be doing with these globals...???
  lastCircum = currentCircum;
  currentRepeat = r;
  currentCircum = c;
  const r_elem = document.getElementById("fREPEAT");
  const c_elem = document.getElementById("fCircumference");
  r_elem.value = r;
  c_elem.value = c;
  refreshEverything( temp_array, false);
  remaining_undos--;
  remaining_redos++;
}

//called when the user presses the redo button.  Redoes and Undo. Limited to redoing (history_limit - 1) undos.
function redo() {
  //console.log("in redo. historyIndex is " + historyIndex + "remaining_redos is " + remaining_redos);
  if (remaining_redos <= 0) {
    //console.log("out of redos");
    return;
  }
  historyIndex = adjust_circular_buffer_index(1, historyIndex, history_limit);
  //console.log("in redo. historyIndex adjusted to " + historyIndex);
  const temp_array = repeatHistory[historyIndex];
  const c = temp_array[0];
  const r = temp_array.length - 1;
  lastRepeat = currentRepeat; //Not sure what to be doing with these globals...???
  lastCircum = currentCircum;
  currentRepeat = r;
  currentCircum = c;
  const r_elem = document.getElementById("fREPEAT");
  const c_elem = document.getElementById("fCircumference");
  r_elem.value = r;
  c_elem.value = c;
  refreshEverything( temp_array, false);
  remaining_undos++; //one more undo is now possible
  remaining_redos--;
}

//Move the circular buffer index. Advance or decrement it depending on whether input x is positive or negative.
//Assumes buffer is a one-D array with indices 0 to buffer_limit minus 1.
//If called with an increment or decrement > 1, it uses a recursive call, but in practice here I am
//not ever calling it with anything other than +1 or -1.  A useful routine for the toolbox.
function adjust_circular_buffer_index(x, current_index, buffer_limit) {
  var index;
  var i;
  //console.log("in call to adjust_circular_buffer_index with x " + x + " current_index " + current_index + " limit " + buffer_limit);
  if ((current_index < 0) || (current_index == buffer_limit)) {
    //console.log("called adjust_circular_buffer_index with invalid current index of " + current_index);
    return;
  }
  if (x == 0) {
    return(current_index);
  }
  if (x == 1) { //we are advancing the index by 1
    return((current_index + 1) % buffer_limit);
  }
  if (x == -1) { //we are decrementing the index by 1
    if (current_index == 0){
      return (buffer_limit-1);
    }
     else {
       return (current_index - 1);
     }
  }
  else if (x > 1) {
    return (adjust_circular_buffer_index(x-1, current_index+1, buffer_limit));
  }
  else if (x < 1) {
    return (adjust_circular_buffer_index(x+1, current_index-1, buffer_limit));
  }
}

function lockbuttonToggle() {
  //alert ("in lock toggle");
  var elem = document.getElementById("lockButton");
  if (elem.value == "Lock") {
    elem.value = "Unlock"; //toggle the button label to unlock, since we are locking
    repeatLocked = true;
  }
  else if (elem.value == "Unlock") {
    elem.value = "Lock"; //toggle the button lable to lock, since we are unlocking
    repeatLocked = false;
  }
}

function handleRopeSpin()
{
  spin_offset = (spin_offset + 1) % currentRepeat; //advance the offset in the repeat by one to simulate spinning
  // paintRopeBeadplane();
}

//CURRENTLY USING THIS FUNCTION TO GET THE SAVE FILE WINDOW TO COME UP, BUT IT ONLY WORKS ON CHROME AND A FEW OTHER BROWSERS
async function getNewFileHandle() {
  const options = {
    types: [
      {
        description: 'Text Files',
        accept: {
          'text/plain': ['.txt'],
        },
      },
    ],
  };
  const handle = await window.showSaveFilePicker(options);
  return handle;
}

async function handleSave()
{
  const contents = JSON.stringify(repeatHistory[historyIndex]);
  const fileHandle = await getNewFileHandle(); //THESE NEXT TWO LINES WORK GREAT BUT NEED HTTPS SECURITY and ONLY on Chrome and a few other browsers
  // Create a FileSystemWritableFileStream to write to.
  const writable = await fileHandle.createWritable();
  // Write the contents of the file to the stream.
  await writable.write(contents);
  // Close the file and write the contents to disk.
  await writable.close(); 
}


async function exportFile( contents )
{
  const options = {
    types: [
      {
        description: 'SVG file',
        accept: {
          'image/svg+xml': ['.svg'],
        },
      },
    ],
  };
  const handle = await window.showSaveFilePicker( options );
  const writable = await handle.createWritable();
  // Write the contents of the file to the stream.
  await writable.write(contents);
  // Close the file and write the contents to disk.
  await writable.close();
}

const setBorderColor = color =>
{
  document .getElementById( 'border-color' ) .style .backgroundColor = color;
  document .querySelectorAll( "svg" ) .forEach( el => el .setAttribute( 'stroke', color ) );
}

const setBackgroundColor = color =>
{
  document .getElementById( 'bkgd-color' ) .style .backgroundColor = color;
  document .querySelectorAll( "svg" ) .forEach( el => el .style[ "background-color" ] = color );
}
  
function setup()
{
  // No more hard-coding in the HTML
  document .getElementById( 'fREPEAT' )        .setAttribute( 'value', currentRepeat );
  document .getElementById( 'fCircumference' ) .setAttribute( 'value', currentCircum );

  for (let index = 0; index < currentRepeat; index++) {
    repeatColors .push( "white" );
  }

  const aboutDialog = document.getElementById('about');
  aboutDialog .addEventListener( 'click', () => aboutDialog .classList .add( 'hidden' ) );

  const helpDialog = document.getElementById('help');
  helpDialog .addEventListener( 'click', () => helpDialog .classList .add( 'hidden' ) );

  const tileDialog = document.getElementById( 'tile-backdrop' );
  tileDialog .addEventListener( 'click', () => tileDialog .classList .add( 'hidden' ) );

  setBorderColor( beadBorderColor );
  setBackgroundColor( beadBackground );
  document .querySelectorAll( "svg" ) .forEach( el => el .setAttribute( 'stroke-width', beadBorderWidth ) );

  document .getElementById( "set-border-color" ) .addEventListener( 'click', () => setBorderColor( colorClass ) );
  document .getElementById( "set-bkgd-color" ) .addEventListener( 'click', () => setBackgroundColor( colorClass ) );

  createBeadPlane( document .getElementById( "BPsvg" ),   true,  bpHeight, bpWidth );
  createBeadPlane( document .getElementById( "ROPEsvg" ), false, bpHeight, bpWidth );

  commonRefresh();

  saveToHistory();

  const colorPickerElem = document .getElementById("color-picker");
  colorPickerElem .addEventListener( "change", () => {
    colorPickerColor = colorPickerElem .value;
  } );

  document.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) { //Enter key is pressed
      update();
    }
  });

  document .getElementById( 'export-vrp' ) .addEventListener( 'click', () => {
    exportFile( document .getElementById( 'VRPsvg' ) .outerHTML );
  } );
  document .getElementById( 'export-svg' ) .addEventListener( 'click', () => {
    exportFile( document .getElementById( 'BPsvg' ) .outerHTML );
  } );
  document .getElementById( 'export-tile' ) .addEventListener( 'click', () => {
    exportFile( document .getElementById( 'tile-svg' ) .outerHTML );
  } );
  document .getElementById( 'export-tile-png' ) .addEventListener( 'click', () => {
    const svgText = document .getElementById( 'tile-svg' ) .outerHTML;
    generateImageBlobFromSVG( svgText, currentRepeat*beadDiameter*pixelsPerBead, 'image/png' )
      .then( blob => saveFileAs( 'svg2png.png', blob ) )
      .catch( error => console.log( error ) );
    ;
  } );

  document .getElementById( 'tile-button' ) .addEventListener( 'click', () => tileDialog .classList .remove( 'hidden' ) );

  document .getElementById( 'undo' ) .addEventListener( 'click', undo );
  document .getElementById( 'redo' ) .addEventListener( 'click', redo );

  document .getElementById( 'about-button' ) .addEventListener( 'click', () => aboutDialog .classList .remove( 'hidden' ) );
  document .getElementById( 'help-button'  ) .addEventListener( 'click', () => helpDialog  .classList .remove( 'hidden' ) );

  document .getElementById( 'add-color' ) .addEventListener( 'click', () => addToPalette(colorPickerColor) );
  document .getElementById( 'color-all' ) .addEventListener( 'click', handleColorAll );

  document .getElementById( 'open-button' ) .addEventListener( 'click', loadSelectedSource );
  document .getElementById( 'save-button' ) .addEventListener( 'click', handleSave );

  document .getElementById( 'lockButton' ) .addEventListener( 'click', lockbuttonToggle );

  document .getElementById( 'spin-button' ) .addEventListener( 'click', handleRopeSpin );

  // change listeners for number fields, not clicks
  document .getElementById( 'fTwist' )         .addEventListener( 'change', updateTwist );
  document .getElementById( 'fREPEAT' )        .addEventListener( 'change', updateRepeat );
  document .getElementById( 'fCircumference' ) .addEventListener( 'change', updateCircumference );
}

setup();
