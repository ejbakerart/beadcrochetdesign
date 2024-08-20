//See beadCrochetAppNotes for an important note regarding parameters controlling the bead size on the screen.

// utilities
import { openFile, saveFileAs } from './files.js';
import { generateImageBlobFromSVG } from './images.js';
import { paintRepeatColors, paintBeads, lcm, computeBookIndex, calculateNumRows, recomputeBookIndices } from './utilities.js';

// state management
import { currentCircum, currentRepeat, repeatColors, spin_offset,
  setState, updateCircumference, updateRepeat, traverseRepeat, advanceSpin, toggleRepeatLock } from './repeat.js';
import { currentColor } from './colors.js';
import { redo, undo, saveToHistory } from './undoredo.js';

// import just to trigger side-effects (register the listeners)
import './twist.js';
import './beadstyles.js';

const bpWidth = 38;
const bpHeight = 56; // NOTE: THIS MUST BE AN EVEN NUMBER OR POSSIBLY BUGS???

const beadDiameter = 1; // approx 2.8px/mm, so a 2mm bead in SVG
const tileBeadDiameter = 10;
const lineHeight = Math.sqrt( 3 ) / 2;

// remember to put in the circumference at the beginning of patterns
const builtInDesigns = {
  mobius6             : [ 6, "black", "white", "white","white", "white", "white","white", "white", "white", "white"],
  hexagonalgrid7      : [ 7, "blue","blue","blue","blue","blue","red","red","red","blue","blue","blue","blue","red","red","red","red","blue","blue","blue","red","red","red","red","red","white","white","white","red","red","red","red","white","white","white","white","red","red","red","white","white","white","white","white","blue","blue","blue","white","white","white","white","blue","blue","blue","blue","white","white","white"],
  harlequin6          : [ 6, "black","black","black","black","black","black","black","black","black","black","black","black","green","black","black","black","black","black","green","green","black","black","black","black","green","green","green","black","black","black","green","green","green","green","black","black","green","green","green","green","green","black","green","green","green","green","green","green","green","green","green","green","green","green","black","green","green","green","green","green","black","black","green","green","green","green","black","black","black","green","green","green","black","black","black","black","green","green","black","black","black","black","black","green"],
  honeycomb9          : [ 9, "black","black","black","black","white","white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white","white","black","white","white"],
  equilateraltriangle7: [ 7, "lightgreen", "lightgreen", "black","white", "white", "lightblue","lightblue", "black", "lightgreen", "lightgreen","white","white","black","lightblue","lightblue"],
  hexagonalgrid10     : [10, 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green', 'green', 'white', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green', 'green', 'green', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green','green', 'green', 'green','white', 'white', 'white', 'white','green','green','green', 'green','green'],
}

// const ThanksMessage = "Written by Ellie Baker. Designed by Ellie Baker and Susan Goldstine. Many people helped and/or consulted on the development of this code. Ellie takes full responsibility for all atrocities and errors, but owes thanks to Michael Klugerman for extensive consulting on coding in Javascript and HTML, and Craig Kaplan who helped with an earlier version written in Processing. Thanks are also due to Sophie Sommer, Lila Masand, Mike Komosinski, and Christine Langston for coding help and other consulting."

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

function refreshEverything( saveHistory )
{
  document .getElementById( 'fCircumference' ) .value = currentCircum;
  document .getElementById( 'fREPEAT' ) .value = currentRepeat;

  if ( saveHistory ) { // not undoing or redoing
    saveToHistory();
  }

  createRepeat();

  rebuildColoredNumbers();

  recomputeBookIndices( document .getElementById( "BPsvg" ), 0 );
  recomputeBookIndices( document .getElementById( "ROPEsvg" ), 0 );

  reshapeRope();

  // paint all beads with the new repeatColors
  paintRepeatColors();
}

function reshapeRope()
{
  const width = currentCircum/2;
  const viewbox = [ 19-width/2, 4, width, 42 ] .join( ' ' );
  const svgElem = document .getElementById( 'rope-svg' );
  svgElem .setAttribute( 'viewBox', viewbox );
  // svgElem .style .width = currentCircum * beadDiameter * SOMETHING; // let's try it fixed-width first
}

function beadColored( bookIndex )
{
  repeatColors[ bookIndex-1 ] = currentColor;
  saveToHistory();

  paintBeads( bookIndex, currentColor );
  rebuildColoredNumbers();
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
        newCircle.onclick = () => beadColored( computeBookIndex( i, j, 0 ) );
      }
      parent .appendChild( newCircle );
    }
  }
}

function createTile()
{
  const L = lcm( 2*currentCircum+1, currentRepeat );
  const tileHeight = 2 * ( L / ( 2*currentCircum+1 ) );

  const svg = document .getElementById( 'tile-svg' );
  svg .style .width = `${(currentRepeat+1) * tileBeadDiameter}px`;
  const x = 1.5;
  const y = 1.0;
  const width = currentRepeat*beadDiameter;
  const height = (tileHeight*lineHeight)*beadDiameter;
  const viewboxArray = [ x, y, width, height ];
  svg .setAttribute( 'viewBox', viewboxArray .join( ' ' ) );
  const rect = document .getElementById( 'clip-rect' );
  rect .setAttribute( 'x', x );
  rect .setAttribute( 'y', y );
  rect .setAttribute( 'width', width );
  rect .setAttribute( 'height', height );
  const bkgdRect = document .getElementById( 'tile-bkgd' );
  bkgdRect .setAttribute( 'x', x );
  bkgdRect .setAttribute( 'y', y );
  bkgdRect .setAttribute( 'width', width );
  bkgdRect .setAttribute( 'height', height );

  const group = document .getElementById( "tile-group" );
  group .replaceChildren(); // remove the old circles
  createBeadPlane( group, false, tileHeight+1, currentRepeat+1 );
  recomputeBookIndices( group, 0 );
}

function createRepeat()
{
  const vrpBeadDiameter = 20; // pixels
  // beads are drawn with diameter 1.0 in SVG coordinates
  const height = lineHeight * calculateNumRows( currentCircum, currentRepeat );
  const viewboxArray = [ -0.2, -0.4, currentCircum + 1.4, height + 0.6 ];

  const svgElem = document .getElementById( 'VRPsvg' );
  svgElem .replaceChildren(); // remove the old circles
  svgElem .setAttribute( 'viewBox', viewboxArray .join( ' ' ) );
  svgElem .style .width = `${(currentCircum+1) * vrpBeadDiameter}px`; // this determines the actual pixel scale of the repeat

  let x = 0.5;
  let y = height - 0.5;  // drawing beads from the bottom up; SVG coords are zero at the top

  traverseRepeat( 
    index => { // for each bead
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
  
      x += 1.0;  
    },
    ( lastIndex, nextIndented ) => { // start a new row
      y -= lineHeight; // drawing beads from the bottom up; SVG coords are zero at the top
      x = nextIndented? 1.0 : 0.5;
    }
  );
}

function loadDesign( design )
{
  setState( design .slice( 1 ), Number(design[0]) );
  refreshEverything( true );
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

function handleRopeSpin()
{
  advanceSpin();
  recomputeBookIndices( document .getElementById( "ROPEsvg" ), spin_offset );
  paintRepeatColors();
}

//This function gets called when the `Color All` button is pushed.  It clears the colors from the beadplane and repeat.
//It takes the repeat length as an input parameter.
function handleColorAll()
{
  repeatColors .map( (v,i,a) => a[i] = currentColor );
  saveToHistory();

  for (let index = 1; index <= currentRepeat; index++) {
    paintBeads( index, currentColor );
  }
  rebuildColoredNumbers();
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

const showTileDialog = () =>
{
  createTile();
  paintRepeatColors();
  tileDialog .classList .remove( 'hidden' );
}
  

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//     Here is the main state initialization
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

createBeadPlane( document .getElementById( "BPsvg" ),   true,  bpHeight, bpWidth );
createBeadPlane( document .getElementById( "ROPEsvg" ), false, bpHeight, bpWidth );

const temp_array = [];
for (let index = 0; index < currentRepeat; index++) {
  temp_array .push( "white" );
}
setState( temp_array, currentCircum );
refreshEverything( true );


// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//   The rest is all side-effects, largely registering event listeners
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

const aboutDialog = document.getElementById('about');
aboutDialog .addEventListener( 'click', () => aboutDialog .classList .add( 'hidden' ) );

const helpDialog = document.getElementById('help');
helpDialog .addEventListener( 'click', () => helpDialog .classList .add( 'hidden' ) );

const tileDialog = document.getElementById( 'tile-backdrop' );
tileDialog .addEventListener( 'click', () => tileDialog .classList .add( 'hidden' ) );

// document.addEventListener("keyup", function(event) {
//   if (event.keyCode === 13) { //Enter key is pressed
//     update();
//   }
// });

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
  const pixelsPerBead = 26;
  const svgText = document .getElementById( 'tile-svg' ) .outerHTML;
  generateImageBlobFromSVG( svgText, currentRepeat*beadDiameter*pixelsPerBead, 'image/png' )
    .then( blob => saveFileAs( 'svg2png.png', blob ) )
    .catch( error => console.log( error ) );
  ;
} );

document .getElementById( 'tile-button' ) .addEventListener( 'click', showTileDialog );

document .getElementById( 'about-button' ) .addEventListener( 'click', () => aboutDialog .classList .remove( 'hidden' ) );
document .getElementById( 'help-button'  ) .addEventListener( 'click', () => helpDialog  .classList .remove( 'hidden' ) );

document .getElementById( 'open-button' ) .addEventListener( 'click', loadSelectedSource );
document .getElementById( 'save-button' ) .addEventListener( 'click', handleSave );

document .getElementById( 'spin-button' ) .addEventListener( 'click', handleRopeSpin );

document .getElementById( 'color-all' ) .addEventListener( 'click', handleColorAll );

document .getElementById( 'lockButton' ) .addEventListener( 'click', toggleRepeatLock );

// change listeners for number fields, not clicks
document .getElementById( 'fREPEAT' )        .addEventListener( 'change', () => { updateRepeat(),        refreshEverything( true ) } );
document .getElementById( 'fCircumference' ) .addEventListener( 'change', () => { updateCircumference(), refreshEverything( true ) } );

document .getElementById( 'undo' ) .addEventListener( 'click', () => { undo(), refreshEverything( false ) } );
document .getElementById( 'redo' ) .addEventListener( 'click', () => { redo(), refreshEverything( false ) } );
