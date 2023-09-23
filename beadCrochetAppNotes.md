# Notes on the Code

At startup,

1.  createRepeat : We create the Repeat object of beads.  Each bead is created dynamically and has its backgroundcolor
set initially to white and its ID set to the string beadi, where i is the numeric order in which it is created. We refer
to this as the "creation" index. Unfortunately the creation index is top-to-bottom and left-to-right.
It's unfortunate because the ordering we want to use is bottom-to-top and left-to-right, which is how we think about
the stringing order of the repeat in the Crafting Conundrums book. The next function we call will address this problem
by setting up an attribute in each bead that gives its correct order, which we call the book_index.

Within createRepeat, for each bead created, we set it up with a function to be called when it gets clicked.
This click function simply changes the clicked bead's color to whatever is the currently selected color, then it pulls
from the bead object it's corresponding book_index, and calls functions to paint all this bead's associated (or corresponding)
beads in the Beadplane object and in the simulated Rope object.

2. mappingFunction: Set each bead in the repeat to have an attribute that maps its creation order index
to it's book_index in the Repeat.

3. createBeadPlane: Create the Bead Plane object and set each bead in it to have attributes that include an ID,
(which is beadplanei, where i is the order in which the bead elements in the beadplane were created, top-to-bottom
and left-to-right), and a row and column (which specify the row and column using the desired bottomup-lefttoright
ordering).  (It also gets a value attribute that is the i in the its ID, but it's not clear this is actually useful).

Within createBeadplane, for each bead created, it sets up the function to be called when beadplane beads are clicked.
The click function simply changes the clicked bead's color to whatever is the currently selected color, then also
determines (from the global array bpValues) what index in the repeat is associated with this particular bead.  It
then calls functions to paint all the associated beads (in the repeat, the beadplane, and the rope) the same color.
It also makes sure the mapping arrays are appropriately updated to reflect the change by calling
updateRepeatMappingArrays. Note that some of the arrays updated in updateRepeatMappingArrays need updating anytime
there is a single change in a repeat color, which is why we have to do it here. This is different from the bpValues
array (see updateBeadPlane below) which only needs updating if the Repeat size is changed.

4. updateBeadPlane: Set up the correspondance between every bead in the bead plane and its associated bead in the Repeat.
This is based only on the length of the Repeat, so it needs to be called any time the Repeat length is changed.
This correspondance is tracked in the bpValues array, which is indexed by the row and column of the beadplane and
holds the number of the corresponding Repeat bead. Both indices are assumed to be the "book" indices, namely
bottom-to-top and left-to-right.  bpValues[1][1] is the 1st bead of the repeat and the numbers in that row of the
beadplane increase sequentially from there, restarting at 1 when the repeat length is reached.

5. updateRepeatMappingArrays: Set up 4 arrays that will enable us to map quickly between either the "book" index or
the "creation" index to the bead colors, or from the book index to the creation index and vice versa in the Repeat.
It seems the only one of these arrays that I am actually using is the one that maps the Repeat's book index to color,
which I use when the rope needs painting.  However, I went ahead and created the other arrays, too, in case
they turn out to be useful.  I may remove those later. The particular situation in which the bookIndexToColor array is
useful is when I am painting the rope beads in book index order, so I have only the book index in which to retrieve
the color from the associated bead in the Repeat.  But the Repeat beads are only easily retreivable by the ID beadi
Associated with their creation order.

6. createRope: Finally, we create the simulated rope object and initialize all its beads to white and set them up
with an ID roperowkcolj where k and j are the creation order row and column numbers of the rope beads.
In this function, we also call paintRope, which paints all the beads in the rope, although in the initial case, the
rope doesn't actually need painting.

7. paintRope: Called from create rope and also when the spin button is pushed.  It paints all the beads in the rope
in the repeat colors, which it gets from the previously set up bookIndexToColor array.

OKAY, so that's the setup sequence.  Important parts of the setup were to create the click functions that are
called when various things get clicked.  The clickable things are all the buttons, the input parameter buttons
(repeat and circumference and twist) and the beads in the Repeat and the Beadplane.

If we click a bead in the Repeat: the click function paints the bead with whatever is the currently selected
color, and gets the book_index from the bead.  It then updates the arrays by calling updateRepeatMappingArrays.
It then calls paintCorrespondingBeads, which paints the beadplane beads that correspond to the repeat.  It goes
through the entire bpValues array and if a beadplane entry in the array matches the book index of the bead just clicked,
we paint it with the new color. Finally, it calls paintRope to repaint the simulated Rope according to the new
coloring, too.

If we click a bead in the Beadplane: We need to paint its corresponding bead in the Repeat
(by calling paintCorrespondingBeads), and also all the corresponding beads in the Beadplane itself (by calling
paintCorrespondingBeadplaneBeadToRepeat). We need to update the arrays associated with the beadplane
(by calling updateRepeatMappingArrays). And we also need to repaint the Rope with the updated Repeat colors (by calling
paintRope).

Update: The final big engine is the "update" function, which gets called whenever the Repeat or Circumference parameters
are changed by the user, or if the Twist parameter is changed.  There are some choices to be made about how to
handle any existing designs in the Repeat if the Repeat or Circumference lengths are changed. I have decided that
the code should try to keep everything in the current design if it can.  The user can always clear it with a push
of the Clear button if desired, but they may instead want to see how their current design would look with changed R and C.
If the Repeat gets longer, we simply add white beads to the top.  If it gets shorter, we lop off beads from the top.
If the circumference increases, we widen the repeat by adding beads to the right of the Repeat layout.  If cirumference
gets smaller, we lop beads off from the right of the Repeat layout. If lopped off beads were painted, the user
loses those painted beads.  Note that this approach means that if the circumference changes, this also changes the
Repeat length.  If the user changes both at the same time, we respect both changes???


## Important Note Regarding the Size of the Bean on the Screen
Currently the code has been optimized for a bead size of 14px in diameter.  This must be an even number, so that half a
bead is a whole number.  Otherwise we get weird spacing artifacts on the screen due to (I assume) rounding issues.
If someone zooms the window, everything gets screwed up -- the code relies on integral numbers for the pixel measurements.
Bead size is the bead_width global variable.  If you want to try changing this, there are a number of places that currently
also need to change.

In the CSS file, the definition for the spacer element needs adjustment of its height and width.
Currently these are set to 8 and 7 and I don't entirely understand why the width needs to be 1px wider than half the bead width.
I would have expected it to need to be exactly half, since it is used to create the half bead offset in the bead grid.
In the HTML file, the ropeIllustration, OuterROPEWRAPPER, and ROPEWRAPPER all need their width parameters adjusted if
the bead_width is changed.  Currently theses are 6px, 59px, and 121px respectively.  Again, I don't entirely understand
why these numbers work best with the bead size of 14px. One would have to tinker to find the correct values for a
different bead size.

In the JS file, beadstyles needs to have width and height set to be the same as bead_width.
Also, bpwidth and bpheight, the size in beads of the bead plane, may need to change to fill the space differently.
Most importantly, beadwidth is currently 14px and half_bead_width is 7px.
Also outerbaseline and innerbaseline are set to 32 and 61 respectively. These help control size of the masking
windows for the simulated rope as the circumference changes. If one were to change the beadsize to 12 instead of 14,
values of 26 and 52 respectively seem to work kind of okay.

I hope to figure out a better and more flexible approach at some point.  Ideally, one should be able to have
a single bead width parameter (and maybe height if oval rather than circular) and then changing those would just work
without changing other things.  Part of this mess is because I don't yet understand how to define a constant that I
can use across all of the css, html, and js code.
