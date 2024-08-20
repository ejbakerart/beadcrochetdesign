
const minCircum = 3; //the minimum circumference choice allowed
const maxCircum = 20; //the maximum circumference choice allowed
let currentCircum = 7;

const minRepeat = 2; //the minimum length of the repeat allowed
const maxRepeat = 500; //the maximum length of the repeat allowed.
let currentRepeat = 57;

// This is the source of truth, the core state for the app!
let repeatColors = [];

let spin_offset = 0;

let repeatLocked = false; //true if the user locks the repeat length with the lock button

const setState = ( colors, circum ) =>
{
  repeatColors = [ ...colors ]; // copy for safety
  spin_offset = 0; //reset the spin offset
  currentCircum = circum;
  currentRepeat = colors.length;
}

const advanceSpin = () => {
  spin_offset = (spin_offset + 1) % currentRepeat; //advance the offset in the repeat by one to simulate spinning
}


// This is called when the repeat value is changed by the user.
function updateRepeat()
{
  const repeat = document.getElementById('fREPEAT');
  if ((repeat.value > maxRepeat) || (repeat.value < minRepeat)) {
    alert('Repeat length must be between ' + minRepeat + ' and ' + maxRepeat);
    repeat.value = currentRepeat;
    return 0;
  }
  let lastRepeat = currentRepeat;
  currentRepeat = Number(repeat.value);
  if (currentRepeat > lastRepeat) {
    // got bigger
    const length = currentRepeat - lastRepeat;
    const insert = Array.from( { length }, (_, i) => 'white' ) ;
    setState( [ ...repeatColors, ...insert ], currentCircum );
  }
  else if (currentRepeat < lastRepeat) {
    // got smaller
    setState( [ ...repeatColors.slice( 0, currentRepeat ) ], currentCircum );
  }
}

// This function captures the shape of the repeat, and makes callbacks for each bead
//  and at the end of each row, so we don't have to duplicate this logic, or worse,
//  implement it differently to find row ends.
function traverseRepeat( visitBead, endRow )
{
  let indented_row = false;
  let beads_remaining_in_row = currentCircum + 1;
  // NOTE! Indices here are zero-based!
  for (let index = 0; index < currentRepeat; index++) {
    visitBead( index );
    --beads_remaining_in_row;
    if ( beads_remaining_in_row === 0 ) {
      // counting beads from the bottom up
      indented_row = ! indented_row;
      endRow( index, indented_row ); // index is last bead of the row being completed
      if ( indented_row ) {
        beads_remaining_in_row = currentCircum;
      } else {
        beads_remaining_in_row = currentCircum + 1;
      }
    }
  }
}

function getRepeatRowEnds()
{
  const rowEnds = [];
  traverseRepeat( 
    () => {}, // no-op per bead
    ( lastIndex ) => { // finishing a row
      rowEnds .push( lastIndex );
    }
  )
  return rowEnds;
}

function updateCircumference()
{
  console.log( 'updateCircumference %%%%%%%%%%%%%%%%%%%%%%%%%%%%%' );

  const circum = document.getElementById('fCircumference');

  if ((circum.value > maxCircum) || (circum.value < minCircum)) {
    alert('Circumference must be between ' + minCircum + ' and ' + maxCircum);
    circum.value = currentCircum;
    return 0;
  }
  let lastCircum = currentCircum;
  const nextCircum = Number(circum.value);
  if ( lastCircum == nextCircum )
    return;

  //Note that we essentially allow only one change at a time -- you can't change both repeat
  //circumference at the same time, and circumference changes take precedence over repeat changes,
  //since changes the circumference also changes the repeat, but not vice versa.
  if (repeatLocked) {
    setState( repeatColors, nextCircum );
  }
  else {
    const delta = nextCircum - lastCircum;
    const tempRepeat = [ ...repeatColors ];

    if ( delta > 0 ) {
      // If the circumference changes, I've made a design choice to also change the length of the repeat,
      // so as not to change the height just because we are changing width.
      let rowEnds = getRepeatRowEnds();
      const insert = Array.from( { length: delta }, (_, i) => 'white' ) ;
      // go backwards so we don't need to keep recomputing indices
      for ( const rowEnd of rowEnds .toReversed() ) {
        tempRepeat .splice( rowEnd+1, 0, ...insert ); // insert some white beads at each row end
      }
    } else if ( delta < 0 ) {
      // Remove one column at a time, and recompute rowEnds, so that we handle
      //   the top short row correctly... it becomes a row end appropriately.
      // This is a bit inefficient, but MUCH easier to reason about.
      for ( let index = 0; index < -delta; index++ ) {
        let rowEnds = getRepeatRowEnds();
        // go backwards so we don't need to keep recomputing indices
        for ( const rowEnd of rowEnds .toReversed() ) {
          tempRepeat .splice( rowEnd, 1 ); // remove the bead at the row end
        }
        // maintain these so that getRepeatRowEnds works; they'll be overwritten after this loop equivalently
        currentRepeat = tempRepeat.length;
        --currentCircum;
      }
    }
    setState( tempRepeat, nextCircum );
  }
}

function toggleRepeatLock() {
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

export {
  currentCircum, currentRepeat, repeatColors, spin_offset,
  setState, updateRepeat, updateCircumference, traverseRepeat, advanceSpin, toggleRepeatLock,
}
