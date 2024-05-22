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

const colorpicker = ["#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff"];
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
const maxRepeat = 500; //the maximum length of the repeat allowed.
const arrayheight = bpHeight + 1; //The 2D array for the beadplane info
const arraywidth = bpWidth + 1;
const emptystring = "";
const bpValues = Array.from(Array(arrayheight), () => new Array(arraywidth)); //a 2D array that maps beads in the beadplane
//to their associated beads in the repeat. It is indexed by the creation row and col of the beadplane and gives the
//repeat bead number (as the book_index or stringing position in the repeat)

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

//The function that gets called when the user changes the repeat or circumference parameters, or the
//twist parameter is changed.
function update()
{
  const circum = document.getElementById('fCircumference');
  const repeat = document.getElementById('fREPEAT');
  const twist = document.getElementById('fTwist');

  if ((circum.value > maxCircum) || (circum.value < minCircum)) {
    alert('Circumference must be between ' + minCircum + ' and ' + maxCircum);
    circum.value = currentCircum;
    return 0;
  }
  else if ((repeat.value > maxRepeat) || (repeat.value < minRepeat)) {
      alert('Repeat length must be between ' + minRepeat + ' and ' + maxRepeat);
      repeat.value = currentRepeat;
      return 0;
  }
  lastRepeat = currentRepeat;
  lastCircum = currentCircum;
  currentCircum = Number(circum.value);
  currentRepeat = Number(repeat.value);
  //alert(lastRepeat + " " + lastCircum + " " + currentRepeat + " " + currentCircum);
  // if something changed redraw the repeat and make any other needed changes to the display
  //Note that we essentially allow only one change at a time -- you can't change both repeat
  //circumference at the same time, and circumference changes take precedence over repeat changes,
  //since changes the circumference also changes the repeat, but not vice versa.
  if ((currentCircum != lastCircum) || (currentRepeat != lastRepeat)) {
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
    else if (currentRepeat > lastRepeat) {
      repeatGotBigger();
    }
    else if (currentRepeat < lastRepeat) {
      repeatGotSmaller();
    }

  }
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

function repeatGotBigger()
{
  refreshEverything( [ currentRepeat, ...repeatColors, "white" ], true );
}

function repeatGotSmaller()
{
  refreshEverything( [ currentRepeat, ...repeatColors.slice( 0, currentRepeat ) ], true );
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
  // TODO: combine and simplify these two, just loop over the repeat in normal order,
  //  attach the bookIndex data, and compute positions in the VRP from that.
  createRepeat();
  indexRepeatBeads();

  rebuildColoredNumbers();

  createTile();
  updateBeadPlane();
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

  //paint the beadplane with the new array
  for ( let i=1; i<=((bpWidth) * (bpHeight)); i++) {
    const circle = document .getElementById( "svg_beadPlane" + i );
    const row = Number( circle.getAttribute("row") );
    const col = Number( circle.getAttribute("col") );
    const index = bpValues[row][col];
    circle .setAttribute( 'fill', colorArray[index] );
  }

  //and paint all beads with the new array
  repeatColors .forEach( ( color, i ) => paintBeads( i+1, color ) );

  paintRopeBeadplane();
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
  for (let i = 1; i <= ((bpWidth) * (bpHeight)); i++) {
    const circle = document.getElementById("svg_beadPlane" + i);
    let row = Number(circle.getAttribute("row"));
    let col = Number(circle.getAttribute("col"));
    if (bookIndex == bpValues[row][col]) { //if this bead in the beadplane corresponds to bead number x in the repeat, paint it
      circle.setAttribute('fill', colorClass);
    }
  }
  paintRopeBeadplane();
  rebuildColoredNumbers();
  remaining_redos = 0;
}

//use this function for creating the large bead plane set of beads.  The "where" input parameter specifies
//the ID of the div within which this bead plane should be placed. The "tag" parameter specifies an
//additional ID for the beadplane, since we are creating multiple beadplanes, a main one and one for the rope.
//THe main beadplane has an empty tag, and the rope beadplane tag is "rope".
function createBeadPlane(where, tag)
{
  var beadorder = 1; //each bead in the plane gets a unique id of beadPlane[i] -- I need to figure this out...
  for ( let i=bpHeight; i>0; i--){
    for( let j=1; j<=bpWidth; j++){
      const newCircle = document.createElementNS( "http://www.w3.org/2000/svg", "circle" );
      newCircle.setAttribute( "id", "svg_beadPlane" + tag + beadorder);
      newCircle.setAttribute("row", i);
      newCircle.setAttribute("col", j);
      beadorder++;
      newCircle.setAttribute( "r", 0.5 );
      newCircle.setAttribute( "fill", 'white' );
      newCircle.setAttribute( "cx", j + (i%2 ? 0.5 : 1 ) );
      newCircle.setAttribute( "cy", 1 + lineHeight * ( bpHeight - i ) );

      // TODO: get rid of bpValues, and create all bead displays the same way
      if ( !tag ) { // only the beadplane is clickable
        //  bpValues is not available during create, but is initialized in updateBeadplane
        newCircle.onclick = () => beadColored( bpValues[i][j] );
      }
      document .getElementById( where+"svg" ) .appendChild(newCircle);
    } //end inner for loop
  } //end outer for loop
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

  for ( let i=tileHeight+1; i>0; i-- ) {
    // TODO: replace computation of x and bead (copied from updateBeadPlane) with a simple function
    let x = ( ( (currentCircum*(i-1)) + (Math.floor(((i)/2+1) ) ) ) ) ; //compute the offset in the repeat for the first bead in the row
    for( let j=1; j<=currentRepeat+1; j++ ) {
      const newCircle = document.createElementNS( "http://www.w3.org/2000/svg", "circle" );
      let bead = 0;
      if ((x%currentRepeat) == 0) { //if finished repeat, set the repeat offset to r and reset r back to 1 for next iteration
        bead = currentRepeat;
        x=1;
      }
      else {//otherwise not finished with repeat, so set repeat offset to (x mod r) and just increment x for next iteration
        bead = x % currentRepeat; // setrepeat offset for this bead
        x++;
      }

      // This is the magic that lets paintBeads() work
      newCircle .classList .add( 'bookindex-'+bead );

      newCircle.setAttribute( "r", beadDiameter/2 );
      newCircle.setAttribute( "fill", 'white' );
      newCircle.setAttribute( "cx", beadDiameter * (j - 1 + (i%2 ? 0 : 0.5 ) ) );
      newCircle.setAttribute( "cy", lineHeight * beadDiameter * ( tileHeight - i + 1 ) );
      group .appendChild( newCircle );
    }
  }
}

//Update the bead plane info in response to user's change in the repeat length or circumference c.  We need to update
//a global 2D array representing each bead in each row of the bead plane to state the bead number of the repeat
//to which it corresponds.  The bead numbers of the repeat are assumed to be ordered as the book specifies,
//namely bottom-to-top-left-to-right.
//Go through the bead plane beads row by row, using row numbers starting at the bottom as row 1.
//Once you find the value for the first bead in the row, just increase by one for the rest of the beads in the row
//until you get to the repeat length, then start at one again, cycling until you get to the end of the row.
//The first bead's corresponding number in the repeat is given by the following formula:
// ( ( (c*(row)) + ((row+1)/2+1) ) % repeatlength).
//THis effectively places the repeat in the lower left of the beadplane and then tiles the repeats from there.
//had to be a little careful because array indices started at 0 not 1, which impacted my formula above
function updateBeadPlane()
{
  const c = currentCircum;
  const r = currentRepeat;

  var x = 0;
  for ( let row=1; row<=bpHeight; row++){
    x = ( ( (c*(row-1)) + (Math.floor(((row)/2+1) ) ) ) ) ; //compute the offset in the repeat for the first bead in the row
    for( let bead=1; bead<=bpWidth; bead++){
      if ((x%r) == 0) { //if finished repeat, set the repeat offset to r and reset r back to 1 for next iteration
        bpValues[row][bead] = r;
        //console.log(row, bead, r);
        x=1;
      }
      else {//otherwise not finished with repeat, so set repeat offset to (x mod r) and just increment x for next iteration
        bpValues[row][bead] = x % r; // setrepeat offset for this bead
        //console.log(row, bead, x%r);
        x++;
      }
    }
  }
}

//Update the painting on the beads in the beadplane that represents the simulated rope.
function paintRopeBeadplane()
{
  for ( let i=1; i<=((bpWidth) * (bpHeight)); i++) {
    var rope_elem = document.getElementById("svg_beadPlanerope" + i);
    let row = Number( rope_elem.getAttribute("row") );
    let col = Number( rope_elem.getAttribute("col") );
    var repeat_index = bpValues[row][col] - 1; //find out what repeat bead this beadplane bead is associated with
    repeat_index = repeat_index + spin_offset; //add the spin offset to it
    if (repeat_index > currentRepeat) {
      repeat_index = repeat_index % currentRepeat;
    }
    let color = repeatColors[repeat_index];
    rope_elem .setAttribute( 'fill', color );
  }
}

const paintBeads = ( bead, color ) =>
{
  for ( const circle of document .querySelectorAll( '.bookindex-'+bead ) ) {
    circle .setAttribute( 'fill', color );
  }
}

//for debugging use
function printRepeatInfoToConsole(){
  for ( let i=1; i<=currentRepeat; i++) {
    var elem = document.getElementById("bead" + i);
    console.log("bead" + i + " is book_index " + Number(elem.getAttribute("book_index")));
  }
}


const paintAllBeads = ( color ) =>
{
  for (let index = 1; index <= currentRepeat; index++) {
    paintBeads( index, color );
  }

  // TODO: GET RID OF CODE BELOW.  If all bead circles are properly class tagged, it will be covered in paintBeads()

  //Paint all the colors in the beadplane.  The "tag" parameter specifies and additional tag to identify which
  //beadplane were are working on.  If it is any empty string, it is the main beadplane.  If it is "rope", it's
  //the rope bead plane.
  function clearBeadplane(incolor, tag)
  {
    for ( let i=1; i<=((bpWidth) * (bpHeight)); i++) {
      const circle = document .getElementById( "svg_beadPlane" + tag + i );
      circle .setAttribute( 'fill', incolor );
    }
  }
  clearBeadplane( colorClass, emptystring ); //then clear the beads in the main beadplane
  clearBeadplane( colorClass, "rope" );//and clear the simulated rope beadplane too
  rebuildColoredNumbers();
}

// For each bead in the repeat, dynamically create a bead element for it, make it colorable by clicking, and
// then draw them all in a vertical repeat form.  This code can be a bit confusing because we want to create the
// repeat from the bottom up, and WE COULD DO THAT now that we are using SVG, but this loop still goes from the top row down,
// because that's how it was done using divs.
function createRepeat()
{
  const c = currentCircum;
  const r = currentRepeat;

  var indented_row = true;
  var double_row_length = (2*c)+1;
  var excess = r % double_row_length;

  //figure out the length of the top row and whether it is indented
  let top_row_length;
  if (excess > (c+1)) {
    top_row_length  = excess - (c+1);
    indented_row = true;
  }
  else if (excess == 0) {
    top_row_length = c;
    indented_row = true;
  }
  else if (excess < (c+1)) {
    top_row_length = excess;
    indented_row = false;
  }
  else if (excess == (c+1)){
    top_row_length = c+1;
    indented_row = false;
  }

  var j=1;
  let top_row = true;
  let tempcount = 1;
  let rows = 1;
  let x; // we want last values, to set the svg viewBox
  let y;
  while (j<r) {
    for ( let i=1; i<=(c + 1); i++ ){ //now put in the beads of the row
      const newElement = document.createElementNS( "http://www.w3.org/2000/svg", "circle" );
      newElement.setAttribute("id", "bead" + j);
      x = tempcount + (indented_row? 0.5 : 0 );
      newElement.setAttribute( "cx", x );
      y = rows * lineHeight;
      newElement.setAttribute( "cy", y );
      newElement.setAttribute( "r", 0.5 );
      newElement.setAttribute( "fill", 'white' );
      newElement.onclick = function() {
        newElement .setAttribute( 'fill', colorClass );
        // currently, we don't know book_index until after indexRepeatBeads(), but there's no reason we couldn't know it here!
        const beadnumber = newElement .getAttribute('book_index');
        beadColored( beadnumber );
      };
      document.getElementById('VRPsvg').append(newElement);
      j++;
      tempcount++;
      if (top_row && (tempcount > top_row_length)) { //at the end of the top row
        top_row = false;
        break; //jump out of for loop since we are at end of row
      }
      else if (indented_row && (tempcount == (c+1))) { //at the end of a short row
        break;//jump out of for loop since we are at the end of a short row
      }
    } //end for loop means we finished a row, so reset tempcount, and toggle indented_row
    tempcount = 1;
    rows++;
    if (indented_row) { //if we just finished an indented row, the next row is not indented
      indented_row = false;
    }
    else {
      indented_row = true;
    }
  } //end while
  const viewboxArray = [ 0, 0, x+1, y+1 ];
  const svgElem = document .getElementById( 'VRPsvg' );
  svgElem .setAttribute( 'viewBox', viewboxArray .join( ' ' ) );
  svgElem .style .width = `${(currentCircum+1) * vrpBeadDiameter}px`;
}

// A function to map the repeat indices originally produced top-to-bottom-and-left-to-right to an ordering that is
// bottom-to-top-and-left-to-right, i.e., into the standard order used for repeat patterns in the Crafting Conundrums book.
//For each bead in the repeat, we give it an attribute called "book_index" that gives its standard order.
function indexRepeatBeads()
{
  const c = currentCircum;
  const r = currentRepeat;
  var indented_row = true;
  var double_row_length = (2*c)+1;
  var excess = r % double_row_length;
  var newIndex = 0;
  let top_row_length;

  //figure out the length of the top row and whether it is indented
  if (excess > (c+1)) {
    top_row_length  = excess - (c+1);
    indented_row = true;
  }
  else if (excess == 0) {
    top_row_length = c;
    indented_row = true;
  }
  else if (excess < (c+1)) {
    top_row_length = excess;
    indented_row = false;
  }
  else if (excess == (c+1)){
    top_row_length = c+1;
    indented_row = false;
  }
  //console.log("In mappingFunction top row length is " + top_row_length);
  var top_row_start_index = r - top_row_length + 1;
  var next_row_start_index = top_row_start_index;
  for ( let i=0; i<top_row_length; i++) {
    const elem = document.getElementById("bead" + (i+1));
    const bookIndex = top_row_start_index + i;
    elem .setAttribute("book_index", Number( bookIndex ));

    // This is the magic that lets paintBeads() work
    elem .classList .add( 'bookindex-' + bookIndex );
  }
  if (top_row_length == r) { //if the top row is the only row, we're done
    return 0;
  }
  //Done with top row and more rows to go, so now proceeed row by row for the rest
  if (indented_row) { //toggle indented_row
    next_row_start_index-=(c+1);
    indented_row = false;
  }
  else {
    next_row_start_index-=c;
    indented_row = true;
  }
  let i = top_row_length + 1;
  while (i<=r) {
    for ( let j=1; j<=c+1; j++) {
      var elem = document.getElementById("bead" + i);
      newIndex = next_row_start_index + (j-1);
      elem.setAttribute("book_index", newIndex);

      // This is the magic that lets paintBeads() work
      elem .classList .add( 'bookindex-' + newIndex );

      i++;
      if (indented_row && (j+1 == c+1)) {
        break; //we were at the end of an indented row, so jump out of the for loop 1 early
      }
    }
    if (indented_row) {
      next_row_start_index-=(c+1);
      indented_row = false;
    }
    else { //not an indented row
      next_row_start_index-=c;
      indented_row = true;
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

//CURRENTLY USING THIS FUNCTION TO WRITE FILES!!!
// createWriteable was causing an error, but I fixed it by making it async and also the click funchtion for the save button async
async function writeFile(fileHandle, contents) {
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

//NOT USING. DOESN'T WORK BECAUSE REQUIRE NEEDS SOME KIND OF PACKAGE
function writeRepeatToFile(repeat_array, path, filename) {
  const fs = require('fs');
  const content = 'Some content!';

  fs.writeFile('/Users/ellenbaker/junk/test.txt', content, err => {
    if (err) {
      console.error(err);
      return;
    }
    else {
      console.log("file written");
    }
  })
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

  const tileDialog = document.getElementById( 'tile-backdrop' );
  tileDialog .addEventListener( 'click', () => tileDialog .classList .add( 'hidden' ) );

  document .querySelectorAll( "svg" ) .forEach( el => {
    el .setAttribute( 'stroke', beadBorderColor );
    el .setAttribute( 'stroke-width', beadBorderWidth );
    el .style[ "background-color" ] = beadBackground;
  } );

  createBeadPlane('BP', emptystring);
  createBeadPlane("ROPE", "rope");

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

  // watch out for the async in here that Mike made me put in to get the getNewFileHandle code to work
  document.querySelectorAll("input") .forEach( el => el .addEventListener( "click", async (e) => {
    // something was mouse clicked
    var clickType = el.getAttribute('value');
    switch (clickType) {
      case 'Color All':
        handleColorAll();
        break;
      case 'About':
        aboutDialog .classList .remove( 'hidden' );
        break;
      case 'outfile':
        alert('outputting files not yet implemented');
        break;
      case 'Undo':
        undo();
        break;
      case 'Redo':
        redo();
        break;
      case 'Add Color':
        addToPalette(colorPickerColor);
        break;
      case 'Open':
        loadSelectedSource();
        break;
      case 'Save':
        var contents = JSON.stringify(repeatHistory[historyIndex]);
        var filehandle = await getNewFileHandle(); //THESE NEXT TWO LINES WORK GREAT BUT NEED HTTPS SECURITY and ONLY on Chrome and a few other browsers
        writeFile(filehandle, contents);
        //FileSave(contents, "ChangeThisFilenameAndSave.txt");//THIS ALTERNATIVE WORKS WITHOUT HTTPS or CHROME BUT USES THE DOWNLOAD APPROACH AND USER HAS TO MOVE THE FILE AND CHANGE THE NAME
        //writeRepeatToFile(repeatHistory[historyIndex], "/users/ellenbaker/junk/", "test.txt"); //DOESN"T WORK BECAUSE OF REQUIRE
        break;
      case 'Lock': //lock unlock toggle for locking the repeat number when circumference is changed
        lockbuttonToggle();
        break;
      case 'Unlock': //lock unlock toggle for locking the repeat number when circumference is changed
        lockbuttonToggle();
        break;
      case 'Spin':
        spin_offset++; //advance the offset in the repeat by one to simulate spinning
        if (spin_offset == (currentRepeat)) {
          spin_offset = 0;
        }
        paintRopeBeadplane();
        break;
    }
    //if it wasn't any of above buttons, must have been a change to repeat or circum,
    //or a painted bead, so call the update function
    update();
  }) );
}

setup();
