window.onload = e => {
  addClick('button_map', () => {
    temp_commands = commands;
    requestInput();
  });
  window.addEventListener('gamepadconnected', function(e) {
    console.log(e);
    console.log(
      'Gamepad connected at index %d: %s. %d buttons, %d axes.',
      e.gamepad.index,
      e.gamepad.id,
      e.gamepad.buttons.length,
      e.gamepad.axes.length
    );
    interval = setInterval(pollGamepads, gamepadPooling);
  });
  window.addEventListener('gamepaddisconnected', function(e) {
    console.log(
      'Gamepad disconnected from index %d: %s',
      e.gamepad.index,
      e.gamepad.id
    );
  });
};
function pollGamepads() {
  let _pressed = [];
  let _touched = [];
  let _value = [];
  var gamepads = navigator.getGamepads
    ? navigator.getGamepads()
    : navigator.webkitGetGamepads
    ? navigator.webkitGetGamepads
    : [];
  if (!gamepads) {
    return;
  }
  const gp = gamepads[0];
  for (let i of gp.buttons) {
    _pressed.push(i.pressed);
    _touched.push(i.touched);
    _value.push(i.value);
  }
  //console.log(_pressed);
  //console.log(_touched);
  //console.log(_value);
  let temp = '';
  for (let i in _value) {
    if (_value[i] === 1) {
      temp = `${i} ${_value[i]}`;
    }
  }
  //updateElement('status', gp.axes);
  updateElement('status', temp);
}
