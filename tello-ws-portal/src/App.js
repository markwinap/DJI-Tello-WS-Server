import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { commands_buttons, axes_commands } from './drone_commands';

//Material UI
import {
  Slider,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  Typography,
  ListItemIcon,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  DialogContentText,
  Snackbar,
  Fab,
} from '@material-ui/core';
import {
  PriorityHigh,
  SportsEsports,
  BarChart,
  PowerSettingsNew,
  Info,
  BatteryUnknown,
  BatteryFull,
  Battery90,
  Battery80,
  Battery60,
  Battery50,
  Battery30,
  Battery20,
  BatteryAlert,
} from '@material-ui/icons';
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from '@material-ui/lab';

import { makeStyles } from '@material-ui/core/styles';
import Dexie from 'dexie';
import JMuxer from 'jmuxer';
const db = new Dexie('tello');
let public_axes = [];
let public_axes_actions = [];
let public_buttons = [];
let public_buttons_prev = [];
let public_cmd_prev = '';
let public_buttons_actions = [];
const min_axe = 0.1;
const max_axe = 0.9;
const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
  },
  slider: {
    marginTop: 40,
    marginBottom: 40,
  },
  paper: {
    padding: theme.spacing(2),
    //textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  formControl2: {
    //margin: theme.spacing(1),
    minWidth: 100,
  },
  formControl: {
    //margin: theme.spacing(1),
    minWidth: 180,
  },
  selectEmpty: {
    //marginTop: theme.spacing(2),
  },
  fab: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
  },
  speedDial: {
    position: 'absolute',
    '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
      top: theme.spacing(2),
      left: theme.spacing(2),
    },
  },
  statsItem: {
    backgroundColor: '#00000024',
    textAlign: 'center',
  },
}));
function App() {
  const classes = useStyles();
  //State
  const [wsAddress, setWsAddress] = useState('ws://localhost:8080');
  const [buttonPoling, setButtonPoling] = useState(false);
  const [statsPoling, setStatsPoling] = useState(false);
  const [connectionDialog, setConnectionDialog] = useState(false);
  const [aboutDialog, setAboutDialog] = useState(false);
  const [snackbar, setSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState(false);
  const [battery, setBattery] = useState('-1');
  const [batteryNumber, setBatteryNumber] = useState(false);
  const [speedDial, setSpeedDial] = useState(false);
  const [gamepad, setGamepad] = useState({});
  const [stats, setStats] = useState({});
  const [gamepadPressed, setGamepadPressed] = useState([]);
  const [buttonsAction, setButtonsAction] = useState([]);
  const [gamepadAxes, setGamepadAxes] = useState([]);
  const [axesAction, setAxesAction] = useState([]);
  //Ref
  const refGamepadInterval = useRef(null);
  const refDataInterval = useRef(null);
  const refWS = useRef(null);
  const refJmuxer = useRef(null);
  const refVideo = useRef(null);
  //Memo
  const memGamepadPressed = useMemo(() => gamepadPressed, [gamepadPressed]);
  const memGamepadAxes = useMemo(() => gamepadAxes, [gamepadAxes]);
  const membuttonsAction = useMemo(() => buttonsAction, [buttonsAction]);
  const memAxesAction = useMemo(() => axesAction, [axesAction]);
  const memStats = useMemo(() => stats, [stats]);
  const memBattery = useMemo(() => battery, [battery]);

  function sendData() {
    if (refWS.current) {
      const _rcCMD = getRCCommand(public_axes, public_axes_actions);
      if (
        JSON.stringify(public_buttons_prev) === JSON.stringify(public_buttons)
      ) {
        if (_rcCMD !== public_cmd_prev) {
          refWS.current.send(
            JSON.stringify({ action: 'command', data: _rcCMD })
          );
          public_cmd_prev = _rcCMD;
        }
      } else {
        public_buttons_prev = public_buttons;
        if (public_buttons.find((e) => e === true)) {
          //get button based on priority
          let _t_button = public_buttons
            .map((e, i) => ({
              ...commands_buttons.find(
                (e) => e.value === public_buttons_actions[i]
              ),
              ...{ pressed: e },
            }))
            .filter((e) => e.pressed)
            .sort((a, b) => a.priority - b.priority)[0];
          if (!_t_button.value) {
            _t_button = commands_buttons[0];
          }
          if (_t_button.priority < 3) {
            refWS.current.send(
              JSON.stringify({ action: 'command', data: _t_button.value })
            );
          } else {
            if (_rcCMD !== public_cmd_prev) {
              refWS.current.send(
                JSON.stringify({ action: 'command', data: _rcCMD })
              );
              public_cmd_prev = _rcCMD;
            } else {
              refWS.current.send(
                JSON.stringify({ action: 'command', data: _t_button.value })
              );
            }
          }
        } else {
          if (_rcCMD !== public_cmd_prev) {
            refWS.current.send(
              JSON.stringify({ action: 'command', data: _rcCMD })
            );
            public_cmd_prev = _rcCMD;
          }
        }
      }
    }
  }

  useEffect(() => {
    db.version(1).stores({ gamepad: 'key' });
    refJmuxer.current = new JMuxer({
      node: 'player',
      mode: 'video',
      flushingTime: 10,
      fps: 30,
      debug: false,
    });
  }, []);
  useEffect(() => {
    window.addEventListener('gamepadconnected', async (e) => {
      setSnackbar(true);
      setSnackbarMsg('Gamepad Connected');
      let _buttons = await storage({ action: 'db-get', key: 'buttons' })
        .then((res) => res.value)
        .catch((err) => [null]);
      let _t_buttons = Array(e.gamepad.buttons.length);
      if (_buttons) {
        if (_buttons.length === e.gamepad.buttons.length) {
          setButtonsAction(_buttons);
          public_buttons_actions = _buttons;
        } else {
          setButtonsAction(_t_buttons);
          public_buttons_actions = _buttons;
        }
      } else {
        setButtonsAction(_t_buttons);
        public_buttons_actions = _buttons;
      }
      let _axes = await storage({ action: 'db-get', key: 'axes' })
        .then((res) => res.value)
        .catch((err) => [null]);
      let _t_axes = [];
      for (let a of Array(e.gamepad.axes.length)) {
        _t_axes.push([null, null]);
      }
      if (_axes) {
        if (_axes.length === e.gamepad.axes.length) {
          setAxesAction(_axes);
          public_axes_actions = _axes;
        } else {
          setAxesAction(_t_axes);
          public_axes_actions = _axes;
        }
      } else {
        setAxesAction(_t_axes);
        public_axes_actions = _axes;
      }
      console.log(e);
      setGamepad(e.gamepad);
      refGamepadInterval.current = setInterval(() => {
        pollGamepads();
      }, 80);
      refDataInterval.current = setInterval(() => {
        sendData();
      }, 100);
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      setSnackbar(true);
      setSnackbarMsg('Gamepad Connected');
      clearInterval(refGamepadInterval.current);
      clearInterval(refDataInterval.current);
      setGamepad({});
    });
    return () => {
      clearInterval(refGamepadInterval.current);
      clearInterval(refDataInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    async function setup() {
      let _buttons = await storage({ action: 'db-get', key: 'buttons' })
        .then((res) => res.value)
        .catch((err) => null);
      if (_buttons) {
        setButtonsAction(_buttons);
      }
      let _axes = await storage({ action: 'db-get', key: 'axes' })
        .then((res) => res.value)
        .catch((err) => null);
      if (_axes) {
        setAxesAction(_axes);
      }
      let _wsAddress = await storage({ action: 'db-get', key: 'wsAddress' })
        .then((res) => res.value)
        .catch((err) => null);
      if (_wsAddress) {
        setWsAddress(_wsAddress);
      }
    }
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function pollGamepads() {
    let _pressed = [];
    let _touched = [];
    let _value = [];
    let _axes = [];
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
      //_touched.push(i.touched);
      //_value.push(i.value);
    }
    for (let i of gp.axes) {
      _axes.push(i.toFixed(2));
    }
    setGamepadPressed(_pressed);
    setGamepadAxes(_axes);
    public_axes = _axes;
    public_buttons = _pressed;
  }
  return (
    <div className={classes.root}>
      <video
        className={classes.root}
        controls
        autoPlay
        id="player"
        ref={refVideo}
      ></video>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(false)}
        message={snackbarMsg}
      />
      <Dialog
        open={aboutDialog}
        onClose={() => setAboutDialog(false)}
        aria-labelledby="stats-about"
      >
        <DialogTitle id="stats-about-title">About</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Marco Martinez - markwinap@gmail.com
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Twiiter -{' '}
            <a href="https://twitter.com/markwinap" title="Twitter">
              https://twitter.com/markwinap
            </a>
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Youtube -{' '}
            <a href="https://www.youtube.com/user/markwinap/" title="Youtube">
              https://www.youtube.com/user/markwinap/
            </a>
          </Typography>
          <div>
            Favicon made by{' '}
            <a href="https://www.flaticon.com/authors/freepik" title="Freepik">
              Freepik
            </a>{' '}
            from{' '}
            <a href="https://www.flaticon.com/" title="Flaticon">
              www.flaticon.com
            </a>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        fullWidth={true}
        maxWidth="xs"
        open={connectionDialog}
        onClose={() => setConnectionDialog(false)}
        aria-labelledby="stats-connection"
      >
        <DialogTitle id="stats-connection-title">Connection</DialogTitle>
        <DialogContent>
          <DialogContentText>Your local or remote server</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="ws_address"
            label="WS Address"
            type="url"
            fullWidth
            value={wsAddress}
            onChange={(e) => {
              setWsAddress(e.target.value);
              storage({
                action: 'db-set',
                key: {
                  key: 'wsAddress',
                  value: e.target.value,
                },
              });
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              console.log('Disconnect');
              if (refWS.current) {
                refWS.current.close();
              }
              setConnectionDialog(false);
            }}
            color="secondary"
          >
            Disconnect
          </Button>
          <Button
            onClick={() => {
              console.log('Connect');
              refWS.current = new WebSocket(wsAddress);
              refWS.current.addEventListener('open', (e) => {
                refVideo.current.play();
                refWS.current.send(
                  JSON.stringify({ action: 'command', data: 'command' })
                );
                setSnackbar(true);
                setSnackbarMsg('Socket Connected');
              });
              refWS.current.addEventListener('message', (e) => {
                const _data = JSON.parse(e.data);
                if (_data.hasOwnProperty('status')) {
                  setStats(_data.status);
                  setBattery(_data.status.bat);
                } else if (_data.hasOwnProperty('video')) {
                  refJmuxer.current.feed({
                    video: new Uint8Array(_data.video.data),
                    duration: 100,
                  });
                }
              });
              refWS.current.addEventListener('error', (e) => {
                console.log('Socket Error');
                setSnackbar(true);
                setSnackbarMsg('Socket Error');
              });
              refWS.current.addEventListener('close', (e) => {
                console.log('Socket Closed');
                setSnackbar(true);
                setSnackbarMsg('Socket Closed');
              });
              console.log(refWS.current);
              setConnectionDialog(false);
            }}
            color="primary"
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        fullWidth={true}
        maxWidth="md"
        open={statsPoling}
        onClose={() => {
          setStatsPoling(false);
          if (refWS.current) {
            refWS.current.send(
              JSON.stringify({
                action: 'service',
                data: 'stats',
                value: false,
              })
            );
          }
        }}
        aria-labelledby="stats-dialog"
      >
        <DialogTitle id="stats-dialog-title">Stats</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.keys(memStats).map((e, i) => {
              return (
                <Grid item lg={1} xs={2} sm={2} key={`stats_item_${i}`}>
                  <TextField label={e} value={memStats[e]} size="small" />
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
      </Dialog>
      <Dialog
        fullWidth={true}
        maxWidth="lg"
        open={buttonPoling}
        onClose={() => setButtonPoling(false)}
        aria-labelledby="max-width-dialog-title"
      >
        <DialogTitle id="max-width-dialog-title">Gamepad</DialogTitle>
        <DialogContent>
          <Box component="span" m={1}>
            <Grid container spacing={2}>
              <Grid item lg={6} xs={12} sm={12}>
                <Typography variant="h6" gutterBottom>
                  Axes
                </Typography>
                {memGamepadAxes.map((e, i) => {
                  return (
                    <div className={classes.slider} key={`slider_${i}`}>
                      <Grid container spacing={1}>
                        <Grid item xs={2}>
                          <FormControl className={classes.formControl2}>
                            <Select
                              value={
                                memAxesAction[i][0] ? memAxesAction[i][0] : ''
                              }
                              name={i}
                              onChange={(e) => {
                                console.log(e.target);
                                axesAction[e.target.name][0] = e.target.value;
                                setAxesAction(axesAction);
                                storage({
                                  action: 'db-set',
                                  key: {
                                    key: 'axes',
                                    value: axesAction,
                                  },
                                });
                              }}
                              displayEmpty
                              //variant={e ? 'outlined' : 'standard'}
                              className={classes.selectEmpty}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {axes_commands.map((el, il) => {
                                return (
                                  <MenuItem
                                    value={el.value}
                                    key={`menu_item_${il}`}
                                    variant
                                  >
                                    <Tooltip
                                      title={el.description}
                                      placement="top"
                                    >
                                      <Typography>{el.value}</Typography>
                                    </Tooltip>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item lg={6} xs={12} sm={12}>
                          <Slider
                            key={`slider_b_${i}`}
                            min={-1}
                            max={1}
                            color={e >= 0 ? 'secondary' : 'primary'}
                            value={e}
                            valueLabelDisplay="on"
                            //onChange={handleChange}
                            aria-labelledby={`slider_b_${i}`}
                          />
                        </Grid>
                        <Grid item lg={2} xs={12} sm={12}>
                          <FormControl className={classes.formControl2}>
                            <Select
                              value={
                                memAxesAction[i][1] ? memAxesAction[i][1] : ''
                              }
                              name={i}
                              onChange={(e) => {
                                console.log(e.target);
                                axesAction[e.target.name][1] = e.target.value;
                                setAxesAction(axesAction);
                                storage({
                                  action: 'db-set',
                                  key: {
                                    key: 'axes',
                                    value: axesAction,
                                  },
                                });
                              }}
                              displayEmpty
                              //variant={e ? 'outlined' : 'standard'}
                              className={classes.selectEmpty}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {axes_commands.map((el, il) => {
                                return (
                                  <MenuItem
                                    value={el.value}
                                    key={`menu_item_${il}`}
                                    variant
                                  >
                                    <Tooltip
                                      title={el.description}
                                      placement="top"
                                    >
                                      <Typography>{el.value}</Typography>
                                    </Tooltip>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </div>
                  );
                })}
              </Grid>
              <Grid item lg={6} xs={12} sm={12}>
                <Typography variant="h6" gutterBottom>
                  Buttons
                </Typography>
                <Grid container spacing={2}>
                  {memGamepadPressed.map((e, i) => {
                    return (
                      <Grid item key={`select_${i}`}>
                        <FormControl className={classes.formControl} error={e}>
                          <Select
                            value={
                              membuttonsAction[i] ? membuttonsAction[i] : ''
                            }
                            name={i}
                            onChange={(e) => {
                              buttonsAction[e.target.name] = e.target.value;
                              setButtonsAction(buttonsAction);
                              storage({
                                action: 'db-set',
                                key: {
                                  key: 'buttons',
                                  value: buttonsAction,
                                },
                              });
                            }}
                            displayEmpty
                            //variant={e ? 'outlined' : 'standard'}
                            className={classes.selectEmpty}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {commands_buttons.map((el, il) => {
                              return (
                                <MenuItem
                                  value={el.value}
                                  key={`menu_item_${il}`}
                                  variant
                                >
                                  {el.required ? (
                                    <ListItemIcon>
                                      <PriorityHigh fontSize="small" />
                                    </ListItemIcon>
                                  ) : null}
                                  <Tooltip
                                    title={el.description}
                                    placement="top"
                                  >
                                    <Typography variant="inherit" noWrap>
                                      {el.value}
                                    </Typography>
                                  </Tooltip>
                                </MenuItem>
                              );
                            })}
                          </Select>
                          <FormHelperText>
                            {e ? 'Pressed' : `Button ${i}`}
                          </FormHelperText>
                        </FormControl>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
      <SpeedDial
        ariaLabel="SpeedDial Menu"
        className={classes.speedDial}
        //hidden={hidden}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDial(false)}
        onOpen={() => setSpeedDial(true)}
        open={speedDial}
        direction="down"
      >
        <SpeedDialAction
          key="About"
          icon={<Info />}
          tooltipTitle="About"
          onClick={() => setAboutDialog(true)}
        />
        <SpeedDialAction
          key="Gamepad"
          icon={<SportsEsports />}
          tooltipTitle="Gamepad"
          onClick={() => setButtonPoling(true)}
        />
        <SpeedDialAction
          key="Stats"
          icon={<BarChart />}
          tooltipTitle="Stats"
          onClick={() => {
            setStatsPoling(true);
            if (refWS.current) {
              refWS.current.send(
                JSON.stringify({
                  action: 'service',
                  data: 'stats',
                  value: true,
                })
              );
            }
          }}
        />
        <SpeedDialAction
          key="Connect"
          icon={<PowerSettingsNew color="secondary" />}
          tooltipTitle="Connect"
          onClick={() => setConnectionDialog(true)}
        />
      </SpeedDial>
      <Fab
        aria-label="battery"
        className={classes.fab}
        color="default"
        onClick={() => setBatteryNumber(!batteryNumber)}
      >
        {batteryNumber ? memBattery : batteryIcon(memBattery)}
      </Fab>
    </div>
  );
}
function batteryIcon(e) {
  let _bat = parseInt(e, 0);
  if (_bat > 95) {
    return <BatteryFull />;
  } else if (_bat > 85) {
    return <Battery90 />;
  } else if (_bat > 75) {
    return <Battery80 />;
  } else if (_bat > 55) {
    return <Battery60 />;
  } else if (_bat > 45) {
    return <Battery50 />;
  } else if (_bat > 25) {
    return <Battery30 />;
  } else if (_bat > 15) {
    return <Battery20 />;
  } else if (_bat > 0) {
    return <BatteryAlert />;
  } else {
    return <BatteryUnknown />;
  }
}
function storage(e) {
  switch (e.action) {
    case 'db-clear':
      return db
        .table('gamepad')
        .clear()
        .catch((err) => console.log(err));
    case 'db-set':
      return db
        .table('gamepad')
        .put(e?.key)
        .catch((err) => console.log(err));
    case 'db-get':
      return db
        .table('gamepad')
        .get(e?.key)
        .catch((err) => console.log(err));
    case 'db-delete':
      return db
        .table('gamepad')
        .delete(e?.key)
        .catch((err) => console.log(err));
    case 'local-clear':
      localStorage.clear();
      return true;
    case 'local-set':
      localStorage.setItem(e?.key, e?.value);
      return true;
    case 'local-get':
      return localStorage.getItem(e?.key);
    case 'local-delete':
      localStorage.removeItem(e?.key);
      return true;
    case 'session-clear':
      sessionStorage.clear();
      return true;
    case 'session-set':
      sessionStorage.setItem(e?.key, e?.value);
      return true;
    case 'session-get':
      return sessionStorage.getItem(e?.key);
    case 'session-delete':
      sessionStorage.removeItem(e?.key);
      return true;
    default:
      return false;
  }
}
function getRCCommand(axes, actions) {
  const _a = getRange(
    getValue('left', axes, actions),
    getValue('right', axes, actions)
  );
  const _b = getRange(
    getValue('backward', axes, actions),
    getValue('forward', axes, actions)
  );
  const _c = getRange(
    getValue('down', axes, actions),
    getValue('up', axes, actions)
  );
  const _d = getRange(
    getValue('ccw', axes, actions),
    getValue('cw', axes, actions)
  );
  return `rc ${_a} ${_b} ${_c} ${_d}`;
}
function getRange(a, b) {
  if (a > b) {
    return (
      Math.round(map(a > max_axe ? max_axe : a, min_axe, max_axe, 10, 100)) * -1
    );
  } else if (b > a) {
    return Math.round(
      map(b > max_axe ? max_axe : b, min_axe, max_axe, 10, 100)
    );
  } else {
    return 0;
  }
}
function getValue(value, axes, actions) {
  for (let i in actions) {
    for (let b in actions[i]) {
      if (value === actions[i][b]) {
        if (b === '0') {
          if (axes[i] < 0 && Math.abs(axes[i]) > min_axe) {
            return Math.abs(axes[i]);
          } else {
            return 0;
          }
        } else if (b === '1') {
          if (axes[i] > 0 && Math.abs(axes[i]) > min_axe) {
            return Math.abs(axes[i]);
          } else {
            return 0;
          }
        }
      }
    }
  }
}
function value_limit(val, min, max) {
  return val < min ? min : val > max ? max : val;
}
function map(x, in_min, in_max, out_min, out_max) {
  return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}
export default App;
