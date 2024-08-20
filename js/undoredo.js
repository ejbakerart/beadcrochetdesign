
import { currentCircum, repeatColors, setState } from "./repeat.js";

let history = [];  // we are not worrying about how big this gets, because that gets very complicated, for little benefit
let historyIndex = 0;  // The next entry to add

// Invariant:
//  The current state corresponds to history[ historyIndex-1 ]

function saveToHistory()
{
  const entry = { currentCircum, repeatColors: [ ...repeatColors ] }; // must make a copy of repeatColors!

  // Trim off any redoable entries, and add the new one
  history .splice( historyIndex, Infinity, entry );
  ++ historyIndex;
}

function undo()
{
  if ( historyIndex === 1 )
    return;
  -- historyIndex;
  const entry = history[ historyIndex - 1 ]; // looks odd, but remember we have to maintain the invariant!
  setState( entry.repeatColors, entry.currentCircum );
}

function redo()
{
  if ( historyIndex === history.length )
    return;
  const entry = history[ historyIndex ];
  ++ historyIndex;
  setState( entry.repeatColors, entry.currentCircum );
}

export { saveToHistory, undo, redo }
