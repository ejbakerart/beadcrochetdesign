
let currentTwist = 0;

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
    
    let angleInDegrees = currentTwist;
    if (angleInDegrees > 30) {
      angleInDegrees = 30;
    }
    document .getElementById( 'ROPEsvg' ) .setAttribute( 'transform', `rotate(${angleInDegrees},19,24)` );
    }
}

// side-effect on first load

document .getElementById( 'fTwist' ) .addEventListener( 'change', updateTwist );
