let commands = [
  {
    description: 'Forward (Pitch)',
    notes: 'Joystick direction for moving forward',
    value: 'forward',
    type: 'axe',
    required: true
  },
  {
    description: 'Backward (Pitch)',
    notes: 'Joystick direction for moving backward',
    value: 'backward',
    type: 'axe',
    required: true
  },
  {
    description: 'Left (Roll)',
    notes: 'Joystick direction for moving to the left',
    value: 'left',
    type: 'axe',
    required: true
  },
  {
    description: 'Right (Roll)',
    notes: 'Joystick direction for moving to the right',
    value: 'right',
    type: 'axe',
    required: true
  },
  {
    description: 'Up',
    notes: 'Joystick direction for moving Up',
    value: 'up',
    type: 'axe',
    required: true
  },
  {
    description: 'Down',
    notes: 'Joystick direction for moving Down',
    value: 'down',
    type: 'axe',
    required: true
  },
  {
    description: 'CW (Yaw)',
    notes: 'Joystick direction to rotate clockwise',
    value: 'up',
    type: 'axe',
    required: true
  },
  {
    description: 'CCW (Yaw)',
    notes: 'Joystick direction to rotate counter clockwise',
    value: 'down',
    type: 'axe',
    required: true
  },
  {
    description: 'Right',
    notes: 'Joystick direction for moving to the right',
    value: 'right',
    type: 'axe',
    required: true
  },
  {
    description: 'Inintiate Command Mode',
    notes: 'Required before sending drone commands',
    value: 'command',
    type: 'button',
    required: true
  },
  {
    description: 'Inintiate Video Broadcast',
    notes: 'Required for video streaming',
    value: 'streamon',
    type: 'button',
    required: true
  },
  {
    description: 'Start Drone motors and takeoff',
    notes: 'Takeoff and go to ~60-90 cm height',
    value: 'takeoff',
    type: 'button',
    required: true
  },
  {
    description: 'Land the Drone and stop the motors',
    notes: '~50cm/s land speed',
    value: 'land',
    type: 'button',
    required: true
  },
  {
    description: 'Use for emergency stop',
    notes: 'Stop motors',
    value: 'emergency',
    type: 'button',
    required: true
  },
  {
    description: 'Go up 20 - 500',
    notes: 'Centimeters - Imput lower than 20 will get ignored',
    value: 'up x',
    type: 'range',
    min: 20,
    max: 500,
    required: false
  },
  {
    description: 'Go down 20 - 500',
    notes: 'Centimeters - Imput lower than 20 will get ignored',
    value: 'down x',
    type: 'range',
    min: 20,
    max: 500,
    required: false
  },
  {
    description: 'Go left 20 - 500',
    notes: 'Centimeters - Imput lower than 20 will get ignored',
    value: 'left x',
    type: 'range',
    min: 20,
    max: 500,
    required: false
  },
  {
    description: 'Go right 20 - 500',
    notes: 'Centimeters - Imput lower than 20 will get ignored',
    value: 'right x',
    type: 'range',
    min: 20,
    max: 500,
    required: false
  },
  {
    description: 'Go forward 20 - 500',
    notes: 'Centimeters - Imput lower than 20 will get ignored',
    value: 'forward x',
    type: 'range',
    min: 20,
    max: 500,
    required: false
  },
  {
    description: 'Go backward 20 - 500',
    notes: 'Centimeters - Imput lower than 20 will get ignored',
    value: 'back x',
    type: 'range',
    min: 20,
    max: 500,
    required: false
  },
  {
    description: 'Go backward 20 - 500',
    notes: 'Centimeters - Imput lower than 20 will get ignored',
    value: 'back x',
    type: 'range',
    min: 20,
    max: 500,
    required: false
  },
  {
    description: 'Flip drone to the left',
    notes: 'Battery and height restrictions',
    value: 'flip l',
    type: 'range',
    min: 20,
    max: 500,
    required: false
  },
  {
    description: 'Flip drone to the right',
    notes: 'Battery and height restrictions',
    value: 'flip r',
    type: 'button',
    required: false
  },
  {
    description: 'Flip drone forward',
    notes: 'Battery and height restrictions',
    value: 'flip f',
    type: 'button',
    required: false
  },
  {
    description: 'Flip drone backwards',
    notes: 'Battery and height restrictions',
    value: 'flip b',
    type: 'button',
    required: false
  },
  {
    description: 'Rotate drone clockwise 1-360',
    notes: 'Degrees',
    value: 'cw x',
    type: 'range',
    min: 1,
    max: 360,
    required: false
  },
  {
    description: 'Rotate drone clockwise 1-360',
    notes: 'Degrees',
    value: 'ccw x',
    type: 'range',
    min: 1,
    max: 360,
    required: false
  }
];
