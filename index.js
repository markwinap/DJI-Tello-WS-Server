//CONSOLE COLORS
const colors = require('colors');

//UPP
const dgram = require('dgram');
const server = dgram.createSocket('udp4'); // UDP SERVER IPv4 FOR SENDING COMMANDS AND RECEIVING COMMAND CONFIRMATION
const status = dgram.createSocket('udp4'); // UDP SERVER IPv4 FOR RECEIVING STATUS
const video = dgram.createSocket('udp4'); // UDP SERVER IPv4 FOR RECEIVING VIDEO RAW H264 ENCODED YUV420p
const port = 8889; //TELLO PORT
const port_status = 8890; //TELLO STATUS PORT
const port_video = 11111; //TELLO VIDEO PORT
//WS
const WebSocket = require('ws'); //WEBSOCKET
const port_websocket = 8080; //WEBSOCKET PORT
//VARIABLES
const tello_default = '192.168.10.1';
let videoBuff = []; //VIDEO BUFFER
let counter = 0; //COUNTER FOR VIDEO BUFFER FRAMES
let temp_input = '';

//###WEBSOCKET### SERVER GAMEPAD
let websocket = new WebSocket.Server({ port: port_websocket });
websocket.on('connection', function connection(websocket) {
  console.log('Socket connected. sending data...');
  websocket.on('error', function error(error) {
    console.log('WebSocket error');
  });
  websocket.on('message', function incoming(msg) {
    let obj = JSON.parse(msg);
    console.log(obj);
    switch (obj.action) {
      case 'command':
        sendCMD(obj.data);
        break;

      default:
        break;
    }
  });
  websocket.on('close', function close(msg) {
    console.log('WebSocket close');
  });
});

//UDP CLIENT SERVER
server.on('error', err => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});
server.on('message', (msg, rinfo) => {
  //UNCOMNET FOR DEBUG
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  //nextCMD(rinfo.address); //Check if commands available
});
server.on('listening', () => {
  let address = server.address();
  //UNCOMNET FOR DEBUG
  console.log(`UDP CMD RESPONSE SERVER - ${address.address}:${address.port}`);
});
server.bind(port);
//UDP STATUS SERVER
status.on('listening', function() {
  let address = status.address();
  //UNCOMNET FOR DEBUG
  console.log(`UDP STATUS SERVER - ${address.address}:${address.port}`);
});
status.on('message', function(message, remote) {
  //UNCOMNET FOR DEBUG
  //console.log(`${remote.address}:${remote.port} - ${message}`);
  const _msg_obj = dataSplit(message.toString());
  sendWS(JSON.stringify({ status: _msg_obj }));
});
status.bind(port_status);
//###UDP### VIDEO
//INPUT
//RAW RAW H264 DIVIDED IN MULTIPLE MESSAGES PER FRAME
video.on('error', err => {
  console.log(`server error:\n${err.stack}`);
  video.close();
});
video.on('message', (msg, rinfo) => {
  let buf = Buffer.from(msg);
  if (buf.indexOf(Buffer.from([0, 0, 0, 1])) != -1) {
    //FIND IF FIRST PART OF FRAME
    counter++;
    if (counter == 3) {
      //COLLECT 3 FRAMES AND SEND TO WEBSOCKET
      sendWS(JSON.stringify({ video: Buffer.concat(videoBuff) }));
      counter = 0;
      videoBuff.length = 0;
      videoBuff = [];
    }
    videoBuff.push(buf);
  } else {
    videoBuff.push(buf);
  }
});
video.on('listening', () => {
  let address = video.address();
  //UNCOMNET FOR DEBUG
  console.log(`UDP VIDEO SERVER - ${address.address}:${address.port}`);
});
video.bind(port_video);

function dataSplit(str) {
  //Create JSON OBJ from String  "key:value;"
  let data = {};
  let arrCMD = str.split(';');
  for (let i in arrCMD) {
    let tmp = arrCMD[i].split(':');
    if (tmp.length > 1) {
      data[tmp[0]] = tmp[1];
    }
  }
  return data;
}
//###OTHER FUNCTIONS
function sendCMD(command) {
  //SEND BYTE ARRAY TO TELLO OVER UDP
  return new Promise((resolve, reject) => {
    let msg = Buffer.from(command);
    server.send(msg, 0, msg.length, port, tello_default, function(err) {
      // tello - 192.168.10.1
      if (err) {
        console.error(err);
        reject(`ERROR : ${command}`);
      } else resolve('OK');
    });
  });
}
function sendWS(data) {
  websocket.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data); //SEND OVER WEBSOCKET
      } catch (e) {
        console.log(`Sending failed:`, e);
      }
    }
  });
}
