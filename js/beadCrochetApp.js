//See beadCrochetAppNotes for an important note regarding parameters controlling the bead size on the screen.

$(document).ready(function() {
	var colorClass = 'white'; //this is the currently selected palette color, initialized to white
	var colorPickerColor = "#257b98"; //gets set by the interactive color picker.
	var startcircum = 7; //the initially set parameters for the circumference and repeat, the
	var startrepeat = 57; //hard wiring has to be changed in the html file too if they are changed
	var currentRepeat = startrepeat;
	var currentCircum = startcircum;
	var lastRepeat = 0;
	var lastCircum = 0;
	var lastTwist = 0;
	var currentTwist = 0;
	var colorpicker = ["#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff"];
	var nextColor = -1; //the index into colorpicker arrays -- gets initialized to 0 first time it is used
	var maxColors = colorpicker.length;
	//UNDO/REDO variables
	var remaining_undos = -1; //keeps track of how many times we can undo -- will be incremented to 0 when start state is saved
	var remaining_redos = 0; //keeps track of how many times we can redo -- will be incremented to 1 when first undo occurs
	var history_limit = 26;  //note: we can save up to history_limit-1 new states because the original state is the first push
	var repeatHistory = []; //will hold the repeat arrays for prior states for undo/redo. Implented as a circular array
	var historyIndex = history_limit - 1; //will hold the current index into the repeatHistory array, used for undo/redo
																		//Because circular array, in first call to saveToHistory, this will be advanced to position 0
	//The number of UNDO or REDO actions the user can take is limited by the history_limit variable (it is one less than it)
	var bpWidth = 38;//38
	var bpHeight = 56;//62  NOTE: THIS MUST BE AN EVEN NUMBER OR POSSIBLY BUGS???
	var minCircum = 3; //the minimum circumference choice allowed
	var maxCircum = 20; //the maximum circumference choice allowed
	var minRepeat = 2; //the minimum length of the repeat allowed
	var maxRepeat = 500; //the maximum length of the repeat allowed.
	var repeatCreated = false; //we haven't yet created the Repeat
	var numSpacers = 0; //keep track of the new spacers we create in the repeat so they can be removed later
	var numLinebreaks = 0; //keep track of the new line breaks we create in the repeat so they can be removed later
	var arrayheight = bpHeight + 1; //The 2D array for the beadplane info
	var arraywidth = bpWidth + 1;
	var emptystring = "";
	var bpValues = Array.from(Array(arrayheight), () => new Array(arraywidth)); //a 2D array that maps beads in the beadplane
	//to their associated beads in the repeat. It is indexed by the creation row and col of the beadplane and gives the
	//repeat bead number (as the book_index or stringing position in the repeat)
	let creationIndexToBookIndex = new Array(maxRepeat); // these arrays are for easier conversion from the html top-to-bottom-left-to-right ordering
	let bookIndexToCreationIndex = new Array(maxRepeat); // of beads to the Repeat's index ordering in our book, which is bottom-to-top.
	let creationIndexToColor = new Array(maxRepeat);
	let bookIndexToColor = new Array(maxRepeat); //this is the most important array for representing the state of the repeat.
	let oldBookIndexToColor = new Array(maxRepeat);
	var num_rope_double_rows = 31;
	var spin_offset = 0;
	var bead_width = 14; //###14 in pixels, changing these numbers may have repercussions...be careful (see beadstyles below)
	var half_bead_width = 7;//###7
	var outerbaseline = 32; //###32these baselines are for the masking of the simulated rope. these are start values...
	var innerbaseline = 61; //###61...that get adjusted as the circumference changes...
	var repeatLocked = false; //true if the user locks the repeat length with the lock button
	var globalString = "initialstring";
	var beadstyles = {
		"margin-top": "-3px", //this negative margin helps create the tight circle packing in the hexagonal grid of beads
		"margin-bottom": "0px",
		"width": "14px",  //###14Bead width-- critical magic number!!! it's important for width and height to be even, so the spacers can be exactly half a bead wide
    "height": "14px", //###14and it's also important to use pixels not vx measures to avoid rounding artifacts in the display
    "background": "white",
    "border-radius": "100%",
		"border-width":"1px",
		"border-style": "solid",
		"border-color": "grey",
		"display": "inline-block",
		"margin-right": "-1px",
		"margin-left": "0px",
		"background-color": "white"
	};
  // remember to put in an extra blank bead at the beginning of patterns, since we don't use the 0th element
	const mobius6_colours = [6, "black", "white", "white","white", "white", "white","white", "white", "white", "white"];
	const hexagonalgrid7_colours = [7,"blue","blue","blue","blue","blue","red","red","red","blue","blue","blue","blue","red","red","red","red","blue","blue","blue","red","red","red","red","red","white","white","white","red","red","red","red","white","white","white","white","red","red","red","white","white","white","white","white","blue","blue","blue","white","white","white","white","blue","blue","blue","blue","white","white","white"];
	const harlequin6_colours = [6,"black","black","black","black","black","black","black","black","black","black","black","black","green","black","black","black","black","black","green","green","black","black","black","black","green","green","green","black","black","black","green","green","green","green","black","black","green","green","green","green","green","black","green","green","green","green","green","green","green","green","green","green","green","green","black","green","green","green","green","green","black","black","green","green","green","green","black","black","black","green","green","green","black","black","black","black","green","green","black","black","black","black","black","green"];
	const honeycomb9_colours = [9,"black","black","black","black","white","white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white", "white","black","white","white","black","black","black","black","white", "white","black","white","white","white","black","white","white"];
	const equilateraltriangle7_colours = [7, "lightgreen", "lightgreen", "black","white", "white", "lightblue","lightblue", "black", "lightgreen", "lightgreen","white","white","black","lightblue","lightblue"];
  const hexagonalgrid10_colours = [10, 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'white', 'blue', 'blue', 'blue', 'blue', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green', 'green', 'white', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green', 'green', 'green', 'white', 'white', 'white', 'white', 'white', 'green', 'green', 'green','green', 'green', 'green','white', 'white', 'white', 'white','green','green','green', 'green','green'];
	var userfile_colours = []; //gets filled in when the user loads a pattern file
	const HelpMessage = "This is a beta version of a Bead Crochet Design Tool. It applies ideas from the design framework described in the book Crafting Conundrums: Puzzles and Patterns for the Bead Crochet Artist by Ellie Baker and Susan Goldstine, and was created as a supplement to the book. Use at your own risk, since it is still in development, but stay tuned for more info and instructions soon!"
	const ThanksMessage = "Written by Ellie Baker. Designed by Ellie Baker and Susan Goldstine. Many people helped and/or consulted on the development of this code. Ellie takes full responsibility for all atrocities and errors, but owes thanks to Michael Klugerman for extensive consulting on coding in Javascript and HTML, and Craig Kaplan who helped with an earlier version written in Processing. Thanks are also due to Sophie Sommer, Lila Masand, Mike Komosinski, and Christine Langston for coding help and other consulting."
	/* if one of the color choices is clicked on, change colorClass to its color */
	$('.select-color').click(function(){
		var selectedColor = $(this).attr('class');
		/* change all the color choices to have a thin border */
		$('.select-color').css({"border-color":"black","border-width":"1px","margin":"3px"});
		/* then change this one to have a thick border, indicating it has been selected */
		/* and reduce the margin smaller to accommodate the larger border, so the div doesn't jump on the page when changed.*/
		$(this).css({"border-color":"black","border-width":"3px","margin":"1px"});
		switch (selectedColor) {
			case "select-color color-green not-selected":
				colorClass = 'green';
				break;
			case "select-color color-lightgreen not-selected":
					colorClass = '#00ff00';
					break;
			case "select-color color-red not-selected":
				colorClass = 'red';
				break;
			case "select-color color-blue not-selected":
				colorClass = 'blue';
				break;
			case "select-color color-white not-selected":
				colorClass = 'white';
				break;
			case "select-color color-black not-selected":
				colorClass = 'black';
				break;
			case "select-color color-yellow not-selected":
				colorClass = '#ffff00';
				break;
			case "select-color color-aqua not-selected":
				colorClass = '#02caca';
				break;
			case "select-color color-tan not-selected":
				colorClass = '#ffd700'; //'#eecf91';
				break;
			case "select-color color-brown not-selected":
				colorClass = '#804000';
				break;
			case "select-color color-orange not-selected":
				colorClass = '#ff9933';
				break;
			case "select-color color-cream not-selected":
				colorClass = '#fff9cc';
				break;
			case "select-color color-pink not-selected":
				colorClass = '#ff99cc';
				break;
			case "select-color color-purple not-selected":
				colorClass = '#751aff';
				break;
			case "select-color color-lightblue not-selected":
				colorClass = '#99ebff';
				break;
			case "select-color color-grey not-selected":
				colorClass = '#8a8f8f';
				break;
			case "select-color color-0 not-selected":
				colorClass = colorpicker[0];
				break;
			case "select-color color-1 not-selected":
				colorClass = colorpicker[1];
				break;
			case "select-color color-2 not-selected":
				colorClass = colorpicker[2];
				break;
			case "select-color color-3 not-selected":
				colorClass = colorpicker[3];
				break;
			case "select-color color-4 not-selected":
				colorClass = colorpicker[4];
				break;
			case "select-color color-5 not-selected":
				colorClass = colorpicker[5];
				break;
			case "select-color color-6 not-selected":
				colorClass = colorpicker[6];
					break;
			case "select-color color-7 not-selected":
					colorClass = colorpicker[7];
					break;
			}
			$(this).removeClass('not-selected');
			$(this).siblings().addClass('not-selected');
	})

//save the current state to the history array for use by undo/redo. The index to the new slot gets advanced
//or decremented (as needed) by a separate function called here  -- adjust_circular_buffer_index()
function saveToHistory(c,r, repeat_array){
	var i;
	var a = [];
	a[0]=c;//save the circumfernce in the 0th element of a new array, since we don't use that slot for the repeat data

	for (i=1; i<=r; i++){ //save the current repeat state to the new array starting at index 1
		a[i]=repeat_array[i];
	}
	historyIndex = adjust_circular_buffer_index(1, historyIndex, history_limit); //advance the historyIndex by 1 to a new slot
	repeatHistory[historyIndex] = a; //save this new array in this next spot in the repeatHistory array
	//alert("saving to history array at index " + historyIndex);
	remaining_undos++;
	if (remaining_undos >= history_limit) {//stop accruing potential undos when we reach the global limit
		remaining_undos = history_limit-1;
	}
	//console.log("in saveToHistory. After save, historyIndex is " + historyIndex + " remaining_undos is " + remaining_undos + " remaining_redos is " + remaining_redos); //for debugging
	//console.log("c and r  and repeat_array are " + c + " " + r);
	//console.log(repeat_array);
}

//Get rid of all the bead elements in the old repeat in preparation for creating a new one with new parameters.
//Since we also had to create a bunch of linebreaks and spacers in repeat, we have to remove those too.
function removeRepeat(r) {
	for (i=1; i<=r; i++) {
		var elem = document.getElementById("bead" + i);
		//alert("attribute id is " + elem.getAttribute("id"));
		//alert("attribute value is " + elem.getAttribute("value"));
		document.getElementById('VRP').removeChild(elem);
	}
	for (i=0; i<numSpacers; i++) {
		var elem = document.getElementById("spacer" + i);
		document.getElementById('VRP').removeChild(elem);
	}
	numSpacers = 0;
	for (i=0; i<numLinebreaks; i++) {
		var elem = document.getElementById("linebreak" + i);
		document.getElementById('VRP').removeChild(elem);
	}
	numLinebreaks = 0;
}

//The function that gets called when the user changes the repeat or circumference parameters, or the
//twist parameter is changed.
function update() {
	var circum = document.getElementById('fCircumference');
	var repeat = document.getElementById('fREPEAT');
	var twist = document.getElementById('fTwist');

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
		//alert("cleared beadplane");
		clearBeadplane("white", emptystring); // if there are changes, the beadplanes will have to be repainted, so clear first
		clearBeadplane("white", "rope"); //we need to clear both the main beadplane and the rope beadplane
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
		lastTwist = currentTwist;
		//console.log("twist is " + twist.value);
		currentTwist = twist.value;
		doTwist(currentTwist);
	}
}

function repeatGotBigger() {
	var i = 0;
	let new_colours = new Array(currentRepeat+1); //need extra slot because we store circum in slot 0 and use 1-n for repeat

	for (i=1; i<=lastRepeat; i++) {
		new_colours[i] = bookIndexToColor[i]; //save off the old painting of the Repeat
	}
	for (i=lastRepeat+1; i<=currentRepeat; i++){ //add new white beads at the end of the saved array
		new_colours[i] = "white";
	}
	refreshEverything(currentCircum, currentRepeat, new_colours, true);
	saveToHistory(currentCircum, currentRepeat, new_colours);
}

function repeatGotSmaller() {
	var i = 0;
	let new_colours = new Array(currentRepeat+1);//need extra slot because we store circum in slot 0 and use 1-n for repeat

	for (i=1; i<=lastRepeat; i++) {
		new_colours[i] = bookIndexToColor[i]; //save off the old painting of the Repeat
	}
	refreshEverything(currentCircum, currentRepeat, new_colours, true);
	saveToHistory(currentCircum, currentRepeat, new_colours);
}

//Change the circumference when the repeat length has been locked (much easier than when the repeat is not locked)
function circumferenceChangedRepeatLocked() {
	var i = 0;
	lastRepeat = currentRepeat;
	let new_colours = new Array(currentRepeat+1);//need extra slot because we store circum in slot 0 and use 1-n for repeat
	//copy the bead colors, lopping off the ones on the right of the Repeat to reduce the circumference
	for (i=1; i<=currentRepeat; i++) {
			new_colours[i] = bookIndexToColor[i];
		}
	refreshEverything(currentCircum, currentRepeat, new_colours, true);
	saveToHistory(currentCircum, currentRepeat, new_colours);
}

//If the circumference increases, I've made a design choice to also increase the length of the repeat,
// so as not to reduce height just because we are increasing width.  This decision made this a particularly
//nasty function since we are effectively changing two things at once...
function circumferenceGotBigger() {
	var delta = currentCircum - lastCircum;
	var revised_r = 0;
	var olddouble_row_length = (lastCircum*2)+1;
 	var i = 0;
	var j = 0;
	var old_i = 0;
	var indented_row = false;
	var b_index = 0;
	var color = "white";
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
	var elem = document.getElementById("fREPEAT");
	elem.value = revised_r;

	let new_colours = new Array(revised_r+1);//we need an extra space because we store the circum at 0 and the rest at 1 to n

	for ( i = 1, old_i=1; (i <= (revised_r)) && (old_i <= lastRepeat+1); i++, old_i++ ) {
		//console.log("i, old_i : " + i + " " + old_i);
		//if we're at the end of a double row or a single row, paint in the extra white beads
		if ( (((old_i % olddouble_row_length) == 1) && indented_row) || //if start of a
					( ((old_i % olddouble_row_length) == (lastCircum+2)) && !indented_row) ) {
		  old_i--;
			//console.log("made it through first conditional")
			for (j = 0; ((j < delta) && ((i+j) <= (revised_r))); j++) {
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
			new_colours[i] = bookIndexToColor[old_i];
		}
	}

	refreshEverything(currentCircum, currentRepeat, new_colours, true);
	saveToHistory(currentCircum, currentRepeat, new_colours);
}

function circumferenceGotSmaller() {
	var delta = lastCircum - currentCircum;
	var revised_r = 0;
	var num_rows = 0; //will update this later
	var i = 0;
	var j = 0;
	var old_i = 0;
	var indented_row = false;
	var b_index = 0;
	var color = "white";
	var index;
	// since circumference has decreased, we're going to need to reduce the repeat length to
	//account for the smaller circumference, so calculate a new revised repeat length as well.
	//To the current repeat, we remove two extra beads for every double row
	revised_r = currentRepeat - (  Math.floor((currentRepeat/((2*lastCircum)+1))) * (2 * delta));
	if ((currentRepeat % ((2*lastCircum)+1)) >= (lastCircum+1)) {//if there's an additional full single row at the top
		revised_r-=delta;//then remove delta more beads, so that every full row gets delta fewer beads.
	}
	//alert("new repeat length is " + revised_r + " delta is " + delta);
	lastRepeat = currentRepeat;
	currentRepeat = revised_r;
	var elem = document.getElementById("fREPEAT");
	elem.value = revised_r;//set the repeat on screen to its new value
	num_rows = calculateNumRows(lastCircum, lastRepeat);
  //alert("num_rows is " + num_rows);
	let new_colours = new Array(revised_r+1);//need extra slot because we store circum in slot 0 and use 1-n for repeat
	//copy the bead colors, lopping off the ones on the right of the old Repeat to reduce the circumference
	//I really hate this code.  There's gotta be a better way to do this!
	index = 1;
	for (i=0; i<num_rows; i++) {
		for (j=1; j<=(lastCircum-delta); j++)  {
			if(index > (revised_r+1)) {break;}
			new_colours[index] = bookIndexToColor[index+(delta*i)];
			//console.log(index + " coming from " + (index+(delta*i)));
			index++
		}
		if (!indented_row && (index<=revised_r+1)) {
			new_colours[index] = bookIndexToColor[index+(delta*i)];
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
	refreshEverything(currentCircum, currentRepeat, new_colours, true);
	saveToHistory(currentCircum, currentRepeat, new_colours);
}

//This code refreshes the painted colors of the beadplane, the repeat, and the simulated rope.
//It got duplicated at the end of each of the functions for dealing with changes in the
//repeat and circumference, so it seemed cleaner to turn it into a separate function.
//It repaints everything on the screen based solely on the input values of c and r and
//the repeat colors assigned in the the input array.  Thus that array
//must be filled in correctly before calling this function.  This function updates all the
//other global arrays, with a call to updateRepeatMappingArrays.
function refreshEverything(c, r, colorArray, resetRedo) {
var i;
var index;
var row;
var col;
var b_index;
var color;
	drawRepeat(c, r);
	//REPLACE THIS FOR LOOP WITH A LOOP THAT GOES THROUGH EVERY BEAD IN THE BEADPLANE, DETERMINES ITS
	//CORRESPONDING BEAD IN THE REPEAT, GETS THE COLOR OF THAT BEAD FROM THE REPEAT, AND THEN PAINTS IT THAT COLOR -
	//console.log("In refresh everything, c, r, and colorArray are " + c + " " + r);
	//console.log(colorArray);
	//paint the beadplane with the new array
	for (i=1; i<=((bpWidth) * (bpHeight)); i++) {
		var elem = document.getElementById("beadPlane" + i);
		row = Number( elem.getAttribute("row") );
		col = Number( elem.getAttribute("col") );
		var index = bpValues[row][col];
		//console.log("index in refresh: ", index);
		elem.style["background-color"] = colorArray[index];
	}
	//and paint the repeat with the new array
	for (i=1; i<=r; i++) {
		var beadelem = document.getElementById("bead" + i); //get the bead element
		b_index = Number(beadelem.getAttribute("book_index")); //determine its book index
		color = colorArray[b_index];
		beadelem.style["background-color"] = color;  //set its color to the saved value
		//paintCorrespondingBeads(b_index, color);
	}
	updateRepeatMappingArrays();
	paintRopeBeadplane(r);
	//Change the rope's masking divs to new width settings appropriately sized for any new size rope
	var innerElem = document.getElementById("ROPEWRAPPER");
	var outerElem = document.getElementById("OuterROPEWRAPPER");
	innerElem.style["width"] = innerbaseline + ((bead_width+1) * (c-minCircum));
	outerElem.style["width"] = outerbaseline + (half_bead_width * (c-minCircum));
	var loadelem = document.getElementById('load-choices');//reset the load drop-down menu
	loadelem.value = "load";
	if (resetRedo)  //reset the REDO counter if the caller says to do so
		remaining_redos = 0;

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
function doTwist(angleInDegrees)  {
if (angleInDegrees > 30) {
	angleInDegrees = 30;

}
var element = document.getElementById('ROPE');
element.style.transform = 'rotate(' + angleInDegrees + 'deg)';
// or do this: element.style.transform = 'rotate(10deg)';
}

//There might be an issue in drawRepeat at the limit of a big repeat -- if the user changes the circumference such that
//the repeat grows beyond the maximum.  There was an issue, I think I fixed it.
function drawRepeat(c,r) {
	if ((c > maxCircum) || (c < minCircum)) { //probably don't need these checks here -- we do it earlier in function update
		alert('Circumference must be between ' + minCircum + ' and ' + maxCircum);
	}
	else if ((r > maxRepeat) || (r < minRepeat)) {
		alert('Repeat length must be between ' + minRepeat + ' and ' + maxRepeat);
	}
	else {
		removeRepeat(lastRepeat); //get rid of the old repeat
		createRepeat(c,r); //create a new one
		mappingFunction(c,r); //for each bead in the repeat, fix it to store the "book index" of it's position
		updateBeadPlane(c,r); //for each bead in the bead plane, set up the global array that indicates which bead it maps to in the repeat
		updateRepeatMappingArrays(); //set up some other arrays that make it easier to go between repeat and beadplane
		spin_offset = 0; //reset the spin offset
		//removeRope(lastCircum,lastRepeat); //get rid of the old rope
		//createRope(c,r); //and create a new one
	}
}
//This function gets called when the Clear button is pushed.  It clears the colors from the beadplane and repeat.
//It takes the repeat length as an input parameter.
function Clear(r) {
	for (i=1; i<=r; i++) { //first clear all the beads in the repeat
		var elem = document.getElementById("bead" + i);
		//elem.setAttribute('style', 'background-color:white ');//this truncates the other styles so doesn't work
		Object.assign(elem.style, beadstyles);
		elem.style["background-color"] = colorClass;
	}
	clearBeadplane(colorClass, emptystring); //then clear the beads in the main beadplane
	clearBeadplane(colorClass, "rope");//and clear the simulated rope beadplane too
	updateRepeatMappingArrays();
	saveToHistory(currentCircum, r, bookIndexToColor);
	remaining_redos = 0;
}

//use this function for creating the large bead plane set of beads.  The "where" input parameter specifies
//the ID of the div within which this bead plane should be placed. The "tag" parameter specifies an
//additional ID for the beadplane, since we are creating multiple beadplanes, a main one and one for the rope.
//THe main beadplane has an empty tag, and the rope beadplane tag is "rope".
function createBeadPlane(where, tag) {
	var beadnum = bpHeight * bpWidth; //the total number of beads
	var beadorder = 1; //each bead in the plane gets a unique id of beadPlane[i] -- I need to figure this out...
	//alert('In function drawBeadPlane');
	for (i=bpHeight; i>0; i--){
		if (i%2 == 0) { //even row, so put in a spacer offset
			const spacerElement = document.createElement('div');
			spacerElement.setAttribute("class", "spacer");
			document.getElementById(where).appendChild(spacerElement);
			//document.getElementById('BP').appendChild(spacerElement);
		}
		for(j=1; j<=bpWidth; j++){
			const newElement = document.createElement('div');
			//newElement.setAttribute("class", "exampleCircle color-white");
			Object.assign(newElement.style, beadstyles);
			newElement.setAttribute("id", "beadPlane" + tag + beadorder);
			beadorder++;
			newElement.setAttribute("value", beadnum);
			beadnum--;
			newElement.setAttribute("row", i);
			newElement.setAttribute("col", j);
			if (tag != "rope") { //don't want to make the rope clickable -- only the beadplane is clickable
				newElement.onclick = function() {
						$(this).css({"background-color":colorClass});
						//$(this).css({"style":beadstyles}); I don't think I need this since we set it up correctly already when beadplane is created
						var x = bpValues[$(this).attr('row')][$(this).attr('col')];
						//var styles = $(this).attr('style'); //i can get the styles this way, but I just want the color...
						paintCorrespondingBeads(x, colorClass);
						paintCorrespondingBeadplaneBeadToRepeat(x, colorClass);
						updateRepeatMappingArrays();
						paintRopeBeadplane(currentRepeat);
						saveToHistory(currentCircum, currentRepeat, bookIndexToColor);
						remaining_redos = 0;
	    	};
			}
			//document.getElementById('BP').appendChild(newElement);
			document.getElementById(where).appendChild(newElement);
		} //end inner for loop
		const lineBreak = document.createElement('br');
		//document.getElementById('BP').appendChild(lineBreak);
		document.getElementById(where).appendChild(lineBreak);
	} //end outer for loop
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
function updateBeadPlane(c, r) {
	var x = 0;
	for (row=1; row<=bpHeight; row++){
		x = ( ( (c*(row-1)) + (Math.floor(((row)/2+1) ) ) ) ) ; //compute the offset in the repeat for the first bead in the row
		for(bead=1; bead<=bpWidth; bead++){
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
		} //end inner for loop
	} //end outer for loop
	//console.log(bpValues);
} //  end function updateBeadPlane

//Update the painting on the beads in the beadplane that represents the simulated rope.
function paintRopeBeadplane(r) {
	var color = 'purple'; //throw in a random color for debugging purposes
	var row;
	var col;
	for (i=1; i<=((bpWidth) * (bpHeight)); i++) {
		var rope_elem = document.getElementById("beadPlane" + "rope" + i);
		row = Number( rope_elem.getAttribute("row") );
		col = Number( rope_elem.getAttribute("col") );
		var repeat_index = bpValues[row][col]; //find out what repeat bead this beadplane bead is associated with
		repeat_index = repeat_index + spin_offset; //add the spin offset to it
		if (repeat_index > r) {
			repeat_index = repeat_index % r;
		}
		color = bookIndexToColor[repeat_index];
		rope_elem.style["background-color"] = color;
	}
}
//When bead number x in the repeat is painted, paint all its corresponding beads
//in the bead plane and its bead in the repeat.  This function takes x and the bead color as input params
function paintCorrespondingBeads(x, color){
 	for (i=1; i<=((bpWidth) * (bpHeight)); i++) {
		var elem = document.getElementById("beadPlane" + i);
		row = Number( elem.getAttribute("row") );
		col = Number( elem.getAttribute("col") );
		id = elem.getAttribute("id"); //I don't think I actually need this for anything here
		oldcolor = elem.getAttribute('style', 'background-color');//I don't think I actually need this for anything here
		//console.log("oldcolor is " + oldcolor + " i " + i + " row " + row + " column " + col + " ID " + id);
		var temp = bpValues[row][col];
		if (x == temp) { //if this bead in the beadplane corresponds to bead number x in the repeat, paint it
			elem.style["background-color"] = color;
		}
	}
}
//When bead element in the beadplane is painted, paint the corresponding bead in the repeat
function paintCorrespondingBeadplaneBeadToRepeat(x, color) {
//It might make more sense to change this so that we set up a mapping array in advance for the repeat, too,
//which gives the mappings from bead number to the book_index.  Then we could just look up the book_index instead of
//having to loop through the entire repeat looking the bead with the correct index.
	for(i=1; i<=currentRepeat; i++) {
		var elem = document.getElementById("bead" + i);
		index = Number( elem.getAttribute("book_index") );
		//console.log("checking bead" + i + " with book index " + index);
		//console.log("Is it bead " + x + "?");
	  if (x == index) {
			elem.style["background-color"] = color;
			//alert("painting bead " + x);
		}
	}
}

//Update the arrays that make it easier to find, given a bead element, it's book index number in the REPEAT
//and its color. We need this since the dynically created beads in the repeat are not naturally indexed by the REPEAT number
//since we had to create them in the HTML top-to-bottom-left-to-right-order, which is different is
//the "book" index of bottom-to-top-left-to-right.  Maybe change this to allow just fixing one specific beads index instead
//of all of them all the time...?  Not sure it will work, but still needs thought...could try using a range
//from start to end indices as input parameters?
function updateRepeatMappingArrays(){
	for(i=1; i<=currentRepeat; i++) {
		var elem = document.getElementById("bead" + i);
		creationIndexToColor[i] = elem.style["background-color"];
		bookIndexToColor[Number(elem.getAttribute("book_index"))] = elem.style["background-color"];
		bookIndexToCreationIndex[Number(elem.getAttribute("book_index"))] = i;
		creationIndexToBookIndex[i] = Number(elem.getAttribute("book_index"));
		//console.log(i + " " + creationIndexToBookIndex[i] + " " + creationIndexToColor[i] + " " + bookIndexToColor[creationIndexToBookIndex[i]]);
		//console.log("bead" + i + " is book_index/color " + Number(elem.getAttribute("book_index")) + "/" + elem.style["background-color"]);
	}
}
//for debugging use
function printRepeatInfoToConsole(){
	for(i=1; i<=currentRepeat; i++) {
		var elem = document.getElementById("bead" + i);
		console.log("bead" + i + " is book_index " + Number(elem.getAttribute("book_index")));
	}
}

//Paint all the colors in the beadplane.  The "tag" parameter specifies and additional tag to identify which
//beadplane were are working on.  If it is any empty string, it is the main beadplane.  If it is "rope", it's
//the rope bead plane.
function clearBeadplane(incolor, tag) {
	for (i=1; i<=((bpWidth) * (bpHeight)); i++) {
		var elem = document.getElementById("beadPlane" + tag + i);
		Object.assign(elem.style, beadstyles); //reset the bead style to the starting clear state
		elem.style["background-color"] = incolor;
		//elem.setAttribute('style', 'background-color:white '); this overwrites, so not good to use. lost other stuff
	}
}

// For each bead in the repeat, dynamically create a bead element for it, make it colorable by clicking, and
// then draw them all in a vertical repeat form.  This code can be a bit confusing because I think about creating the
//repeat from the bottom up, but then this order has to be reversed in order to append things to the page top down in html.
function createRepeat(c,r) {
	var indented_row = true;
	var double_row_length = (2*c)+1;
	var excess = r % double_row_length;
	//alert("Excess is " + excess);
	//figure out the length of the top row and whether it is indented
	if (excess > (c+1)) {
		top_row_length	= excess - (c+1);
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
	top_row = true;
	tempcount = 1;
	while (j<r) {
		//console.log("j " + j + "r " + r);
		if (indented_row) { //if an indented row, put in the indent spacer
			const spacerElement = document.createElement('div');
			spacerElement.setAttribute("class", "spacer");
			spacerElement.setAttribute("id", "spacer" + numSpacers);
			document.getElementById('VRP').append(spacerElement);
			numSpacers++;
		}
		for (i=1; i<=(c + 1); i++){ //now put in the beads of the row
			const newElement = document.createElement('div');
			//newElement.setAttribute("class", "exampleCircle color-white");
			Object.assign(newElement.style, beadstyles);
			newElement.setAttribute("id", "bead" + j);
			newElement.setAttribute("value", j); //DO I NEED THIS?  I DON'T THINK IT EVER GETS USED?
			newElement.onclick = function() {
						$(this).css({"background-color":colorClass}); //set its color to the currently selected palette color
						//$(this).css({"style":beadstyles}); //DO I NEED THIS? BEAD STYLES IS SET UP WHEN CREATED, DO ANYTHING CHANGE WITH THIS?
						//$(this).setAttribute("background-color", colorClass);
						beadnumber = $(this).attr('book_index');
						//alert("painting " + beadnumber +" color " + colorClass);
						updateRepeatMappingArrays();
						paintCorrespondingBeads(beadnumber, colorClass);
						paintRopeBeadplane(r);
						//paintRope(currentCircum, currentRepeat,num_rope_double_rows*2);
						saveToHistory(c, r, bookIndexToColor);
						remaining_redos = 0;
						//console.log("setting remaining_redos to zero now");
	    };
			document.getElementById('VRP').append(newElement);
			j++;
			tempcount++;
			if (top_row && (tempcount > top_row_length)) { //at the end of the top row
				top_row = false;
				break; //jump out of for loop since we are at end of row
			}
			else if (indented_row && (tempcount == (c+1))) { //at the end of a short row
				break;//jump out of for loop since we are at the end of a short row
			}
		} //end for loop means we finished a row, so put in a line break, reset tempcount, and toggle indented_row
		const lineBreak = document.createElement('br');
		lineBreak.setAttribute("id", "linebreak" + numLinebreaks);
		numLinebreaks++;
		document.getElementById('VRP').append(lineBreak);
		tempcount = 1;
		if (indented_row) { //if we just finished an indented row, the next row is not indented
			indented_row = false;
		}
		else {
			indented_row = true;
		}
	} //end while
}

// A function to map the repeat indices originally produced top-to-bottom-and-left-to-right to an ordering that is
// bottom-to-top-and-left-to-right, i.e., into the standard order used for repeat patterns in the Crafting Conundrums book.
//For each bead in the repeat, we give it an attribute called "book_index" that gives its standard order.
function mappingFunction(c,r) {
	var indented_row = true;
	var double_row_length = (2*c)+1;
	var excess = r % double_row_length;
	var newIndex = 0;
	//var oldIndex = 0;

	//figure out the length of the top row and whether it is indented
	if (excess > (c+1)) {
		top_row_length	= excess - (c+1);
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
	for (i=0; i<top_row_length; i++) {
		var elem = document.getElementById("bead" + (i+1));
		//oldIndex = Number( elem.getAttribute("value") );
		elem.setAttribute("book_index", Number(top_row_start_index + i));
		//console.log("new index for " + oldIndex + " is " + Number(top_row_start_index + i));
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
	i = top_row_length + 1;
	while (i<=r) {
		for (j=1; j<=c+1; j++) {
			var elem = document.getElementById("bead" + i);
			//oldIndex = Number( elem.getAttribute("value") );
			newIndex = next_row_start_index + (j-1);
			elem.setAttribute("book_index", newIndex);
			//console.log("new index for " + oldIndex + " is " + newIndex);
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
//called when the user picks a new color from the color picker.  Just sets the global varial colorPickerColor
function newColor(){
	colorPickerColor = document.getElementById('colorpicker').value;
	//alert ("newColor called with color " + color);
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
}
//THIS IS THE FUNCTION I AM USING TO READ AND LOAD FILES from THE USERS LOCAL DISK.
//Because it attempts to open and read the file runs asynchronously, it creates an event handler
//that waits for the load to complete and runs only then.  Thus calls to this function cannot
//assume that it has completed its work, and any attempt right after a call to PREVIEWFILE
//to read the globalString it sets up may fail if it has not yet finished the file load.
function previewFile() {
  const [file] = document.querySelector('input[type=file]').files;
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    globalString = reader.result;
		if(globalString) {
    try {
        a = JSON.parse(globalString);
    } catch(e) {
        alert("Input file not in correct format. "); // error in the above string
				console.log("Error reading file: " + e);
				globalString = "error";
    	}
		}
    //console.log(JSON.parse(globalString));
  }, false);

  if (file) {
    reader.readAsText(file);
  }
}

//NOT USING THIS ANYMORE EITHER
function getStringFromFile(file) {
	const reader = new FileReader();
	reader.readAsText(file);
}

//NOT USING THIS NOW.  Gets the pattern specified in the loadable user file.  Opens the file
function getUserFileColours(selectedFile) {
	var i;
  console.log(selectedFile);
	alert("File chosen is " + selectedFile);
	contents = getStringFromFile(selectedFile); //NEED TO WRITE THIS!!
	userfile_colours = restoreArrayFromString(contents);
	var r_elem = document.getElementById("fREPEAT");
	var c_elem = document.getElementById("fCircumference");
	lastRepeat = currentRepeat;
	lastCircum = currentCircum;
	for (i=0; i<= mobius6_colours.length - 1; i++) {
		userfile_colours[i] = mobius6_colours[i]; //for now until I figure out how to load the real file
	}
	console.log(userfile_colours);
	currentRepeat = userfile_colours.length - 1;
	currentCircum = userfile_colours[0];
	r_elem.value = currentRepeat;
	c_elem.value = currentCircum;
	refreshEverything(currentCircum, currentRepeat, userfile_colours, true);
	saveToHistory(currentCircum, currentRepeat, userfile_colours);
	//var dirhandle = getDir();  //don't need this now -- getting load file directly from click on choose file
	//alert("Got directory handle in getUserFileColours " + dirhandle);
}

//called when the load drop down menu is used.  determines which option was chosen and loads the selected pattern.
function getOption() {
	//alert("in get option");
	var val = document.getElementById('load-choices').value;
	var r_elem = document.getElementById("fREPEAT");
	var c_elem = document.getElementById("fCircumference");
	switch (val) {
		case 'LOAD':
			break;
		case 'harlequin6':
			lastRepeat = currentRepeat;
			lastCircum = currentCircum;
			currentRepeat = 84;
			currentCircum = 6;
			r_elem.value = 84;
			c_elem.value = 6;
			refreshEverything(6, 84, harlequin6_colours, true);
			saveToHistory(currentCircum, currentRepeat, harlequin6_colours);
			break;
		case 'hexagonalgrid7':
			lastRepeat = currentRepeat;
			lastCircum = currentCircum;
			currentRepeat = 57;
			currentCircum = 7;
			r_elem.value = 57;
			c_elem.value = 7;
			refreshEverything(7, 57, hexagonalgrid7_colours, true);
			saveToHistory(currentCircum, currentRepeat, hexagonalgrid7_colours);
			break;
		case 'hexagonalgrid10':
			lastRepeat = currentRepeat;
			lastCircum = currentCircum;
			currentRepeat = 111;
			currentCircum = 10;
			r_elem.value = 111;
			c_elem.value = 10;
			refreshEverything(10, 111, hexagonalgrid10_colours, true);
			saveToHistory(currentCircum, currentRepeat, hexagonalgrid10_colours);
			break;
		case 'mobius6':
			lastRepeat = currentRepeat;
			lastCircum = currentCircum;
			currentRepeat = 10;
			currentCircum = 6;
			r_elem.value = 10;
			c_elem.value = 6;
			refreshEverything(6, 10, mobius6_colours, true);
			saveToHistory(currentCircum, currentRepeat, mobius6_colours);
			break;
		case 'equilateraltriangle7':
			lastRepeat = currentRepeat;
			lastCircum = currentCircum;
			currentRepeat = 15;
			currentCircum = 7;
			r_elem.value = 15;
			c_elem.value = 7;
			refreshEverything(7, 15, equilateraltriangle7_colours, true);
			saveToHistory(currentCircum, currentRepeat,equilateraltriangle7_colours);
			break;
		case 'honeycomb9':
			lastRepeat = currentRepeat;
			lastCircum = currentCircum;
			currentRepeat = 52;
			currentCircum = 9;
			r_elem.value = 52;
			c_elem.value = 9;
			refreshEverything(9, 52, honeycomb9_colours, true);
			saveToHistory(currentCircum, currentRepeat, honeycomb9_colours);
			break;
		case 'userfile':
			if ((globalString == "error") || (globalString == "")) {
				removeFileFromLoadList();
				alert("You can only load from pattern files that are in the correct format, such as those previously saved by this application. The file must be a text file with a .txt ending.");
				break;
			}
			lastRepeat = currentRepeat;
			lastCircum = currentCircum;
			var userfile_colours = JSON.parse(globalString);
			//console.log(userfile_colours);
			currentRepeat = userfile_colours.length - 1;
			currentCircum = Number(userfile_colours[0]);
			r_elem.value = currentRepeat;
			c_elem.value = currentCircum;
			//console.log(currentCircum + " " + currentRepeat + " " + userfile_colours);
			refreshEverything(currentCircum, currentRepeat, userfile_colours, true);
			saveToHistory(currentCircum, currentRepeat, userfile_colours);
			break;
		case 'userfileplaceholder':
			alert("Please first choose a file using the Choose File button. It must be a file in the correct format, such as one previously saved by this application, with a file name ending in .txt. After you choose it, it will appear in the LOAD file option list and you can then select and load it.");
			var loadelem = document.getElementById('load-choices');//reset the load drop-down menu
			loadelem.value = "load";
			break;
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
	var temp_array = repeatHistory[historyIndex];
 	var c = temp_array[0];
 	var r = temp_array.length - 1;
	lastRepeat = currentRepeat; //Not sure what to be doing with these globals...???
	lastCircum = currentCircum;
	currentRepeat = r;
	currentCircum = c;
	var r_elem = document.getElementById("fREPEAT");
	var c_elem = document.getElementById("fCircumference");
	r_elem.value = r;
	c_elem.value = c;
 	refreshEverything(c, r, temp_array, false);
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
	var temp_array = repeatHistory[historyIndex];
 	var c = temp_array[0];
 	var r = temp_array.length - 1;
	lastRepeat = currentRepeat; //Not sure what to be doing with these globals...???
	lastCircum = currentCircum;
	currentRepeat = r;
	currentCircum = c;
	var r_elem = document.getElementById("fREPEAT");
	var c_elem = document.getElementById("fCircumference");
	r_elem.value = r;
	c_elem.value = c;
 	refreshEverything(c, r, temp_array, false);
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
	if (elem.value == "LOCK") {
		elem.value = "UNLOCK"; //toggle the button label to unlock, since we are locking
		repeatLocked = true;
	}
	else if (elem.value == "UNLOCK") {
		elem.value = "LOCK"; //toggle the button lable to lock, since we are unlocking
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
//NOT USING...THIS ONE DOWNLOADED A FILE, BUT I DON'T WANT THAT AND THE URL
//THAT I CALLED IT WITH WAS ALSO UNDEFINED...BUT I DON'T WANT TO DOWNLOAD THE FILE...
//HERE'S THE CALL CODE
//let textData = `El contenido del archivo
//que sera descargado`;
//let blobData = new Blob([textData], {type: "text/plain"});
//let url = window.URL.createObjectURL(blobData);
//let url = "/users/ellenbaker/junk/localFile.txt"; // LocalFileDownload
//saveFile('archivo.txt',url);
function saveFile(fileName,urlFile){
    let a = document.createElement("a");
    a.style = "display: none";
    document.body.appendChild(a);
    a.href = urlFile;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}
//I HAD TO USE THIS ONE TO GET SAVING TO WORK ON FIREFOX AND OTHER NON-CHROME BROWSERS - the saved file goes to the downloads folder
// call it with FileSave(contents, "ChangeThisFilenameAndSave.txt"); where contents is the JSON stringified version of the contents array
function FileSave(sourceText, fileIdentity) {
    var workElement = document.createElement("a");
    if ('download' in workElement) {
        workElement.href = "data:" + 'text/plain' + "charset=utf-8," + escape(sourceText);
        workElement.setAttribute("download", fileIdentity);
        document.body.appendChild(workElement);
        var eventMouse = document.createEvent("MouseEvents");
        eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        workElement.dispatchEvent(eventMouse);
        document.body.removeChild(workElement);
    } else throw 'File saving not supported for this browser';
}

async function getDir() {
  const dirHandle = await window.showDirectoryPicker();
	return(dirhandle);
	//alert("directory handle is " + dirHandle);
}
//take an array saved to a text file using JSON and restore it to a javascript array
function restoreArrayFromString(contents) {
	var my_array = JSON.parse(contents);
	return(my_array);
}
//take the file that was just selected and add it's name to the end of the list of loadable patterns
function addFileToLoadList(filename) {
	var x = document.getElementById("load-choices");
	var index = x.length-1;
	var option = document.createElement("option");
	option.text = filename;
	option.value = "userfile";
	x.remove(index); //remove the prior user file option
	x.add(option, x[index]); //and replace it with the new one
}

//This gets called when there is an error in the user loaded file because we then need to remove it from the
//end of list of loadable design options, and put the place holder option back.
function removeFileFromLoadList() {
	var x = document.getElementById("load-choices");
	var option = document.createElement("option");
	option.text = "Or Choose Load File Above";
	option.value = "userfileplaceholder";
	var index = x.length - 1;
	x.remove(index); //remove the last item in the list of loadable options
	x.add(option, x[index]); //and replace it with the place holder selection
}

function setup() {
	//alert("in set up");
	createRepeat(startcircum, startrepeat);
	mappingFunction(startcircum, startrepeat);
	repeatCreated = true;
	createBeadPlane('BP', emptystring);
	updateBeadPlane(startcircum, startrepeat);
	updateRepeatMappingArrays();
	createBeadPlane("ROPE", "rope");
	saveToHistory(startcircum, startrepeat, bookIndexToColor);

	const fileSelector = document.getElementById('file-selector');
	fileSelector.addEventListener('change', (event) => {
		const fileList = event.target.files;
		const selectedFile = fileSelector.files[0];
		previewFile();//this tries to read the file asynchronously
		addFileToLoadList(selectedFile.name);
		//THESE NEXT TWO LINES WORK INSIDE PREVIEWFILE, BUT NOT HERE -- synchronicity problem if still waiting for file to load
		//console.log(globalString);
    //console.log(JSON.parse(globalString));
	});

	document.getElementById("load-choices").addEventListener("change", function() {
  	getOption();
	});
	document.getElementById("ColorPicker").addEventListener("change", function() {
  	newColor();
	});
	document.addEventListener("keyup", function(event) {
		   if (event.keyCode === 13) { //Enter key is pressed
					update();
		   }
	});
	// watch out for the async in here that Mike made me put in to get the getNewFileHandle code to work
  $("input").on("click", async function(){
		// something was mouse clicked
		var clickType = ($(this).attr('value'));
		//var clickID = ($(this).attr('id'));
		switch (clickType) {
			case 'CLEAR':
				Clear(currentRepeat);
				break;
			case 'HELP':
				alert(HelpMessage);
				break;
			case 'outfile':
				alert('outputting files not yet implemented');
				break;
			case 'UNDO':
				undo();
				break;
			case 'REDO':
				redo();
				break;
			case 'ADD':
				addToPalette(colorPickerColor);
				break;
			case 'SAVE':
				//alert('SAVE currently downloads the pattern file to your download directory. We are working on an a better system. In the meantime, you might want to rename the downloaded file and save it elsewhere.  It can be reloaded later with the File Load button. You can also try taking a screen shot, but that is not a reloadable file!');
				var contents = JSON.stringify(repeatHistory[historyIndex]);
				var filehandle = await getNewFileHandle(); //THESE NEXT TWO LINES WORK GREAT BUT NEED HTTPS SECURITY and ONLY on Chrome and a few other browsers
				writeFile(filehandle, contents);
				//FileSave(contents, "ChangeThisFilenameAndSave.txt");//THIS ALTERNATIVE WORKS WITHOUT HTTPS or CHROME BUT USES THE DOWNLOAD APPROACH AND USER HAS TO MOVE THE FILE AND CHANGE THE NAME
				//writeRepeatToFile(repeatHistory[historyIndex], "/users/ellenbaker/junk/", "test.txt"); //DOESN"T WORK BECAUSE OF REQUIRE
				break;
			case 'LOCK': //lock unlock toggle for locking the repeat number when circumference is changed
				lockbuttonToggle();
				break;
			case 'UNLOCK': //lock unlock toggle for locking the repeat number when circumference is changed
				lockbuttonToggle();
				break;
			case 'SPIN':
				spin_offset++; //advance the offset in the repeat by one to simulate spinning
				if (spin_offset == (currentRepeat)) {
					spin_offset = 0;
				}
				paintRopeBeadplane(currentRepeat);
				break;
		}
    //if it wasn't any of above buttons, must have been a change to repeat or circum,
		//or a painted bead, so call the update function
		update();
	})
}


$(document).on("ready", setup())

})
