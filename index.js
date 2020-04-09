//Env variables
require('dotenv').config();
//FILE SYSTEM READ WRITE FILES
const fs = require('fs');
//CONSOLE COLORS
const colors = require('colors');
//UPP
const dgram = require('dgram');
const server = dgram.createSocket('udp4'); // UDP SERVER IPv4 FOR SENDING COMMANDS AND RECEIVING COMMAND CONFIRMATION
const status = dgram.createSocket('udp4'); // UDP SERVER IPv4 FOR RECEIVING STATUS
const video = dgram.createSocket('udp4'); // UDP SERVER IPv4 FOR RECEIVING VIDEO RAW H264 ENCODED YUV420p
//WS
const WebSocket = require('ws'); //WEBSOCKET
//VARIABLES
let videoBuff = []; //VIDEO BUFFER
let counter = 0; //COUNTER FOR VIDEO BUFFER FRAMES
let temp_input = '';
let stats = false;
let bat_prev = '';

//CONSOLE WELCOME
fs.readFile('banner/_2', 'utf8', function (err, banner) {
  console.log(banner.cyan);
  console.log('1 - RUN THIS SCRIPT'.white);
  console.log('2 - USE WEB APP TO CONTROL DRONE'.white);
  console.log('TO STOP THE SERVER USE'.white);
  console.log(`CTR+C`.inverse);
  console.log('HAVE FUN (╯°□°）╯︵ ┻━┻'.cyan);
  console.log('Author: Marco Martinez markwinap@gmail.com'.inverse);
});
//###WEBSOCKET### SERVER GAMEPAD & VIDEO
//const websocket = new WebSocket.Server({ port: process.env.WS_PORT });
const websocket = new WebSocket.Server({
  port: process.env.WS_PORT,
  backlog: 1,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024, // Size (in bytes) below which messages
    // should not be compressed.
  },
});

websocket.on('connection', function connection(websocket) {
  console.log('Socket connected. sending data...');
  bat_prev = '';
  websocket.on('error', function error(error) {
    console.log('WebSocket error');
  });
  websocket.on('message', function incoming(msg) {
    let obj = JSON.parse(msg);
    //console.log(obj); //Debug
    switch (obj.action) {
      case 'command':
        sendCMD(obj.data);
        break;
      case 'service':
        switch (obj.data) {
          case 'stats':
            stats = obj.value; //Enable Disable Stats
            break;
          default:
            break;
        }
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
server.on('error', (err) => {
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
server.bind(process.env.TELLO_PORT);
//UDP STATUS SERVER
status.on('listening', function () {
  let address = status.address();
  //UNCOMNET FOR DEBUG
  console.log(`UDP STATUS SERVER - ${address.address}:${address.port}`);
});
status.on('message', function (message, remote) {
  //UNCOMNET FOR DEBUG
  //console.log(`${remote.address}:${remote.port} - ${message}`);
  const _msg_obj = dataSplit(message.toString());
  if (stats) {
    sendWS(JSON.stringify({ status: _msg_obj }));
  } else {
    if (bat_prev !== _msg_obj.bat) {
      sendWS(JSON.stringify({ status: { bat: _msg_obj.bat } }));
      bat_prev = _msg_obj.bat;
    }
  }
});
status.bind(process.env.TELLO_PORT_STATUS);
//###UDP### VIDEO
//INPUT
//RAW RAW H264 DIVIDED IN MULTIPLE MESSAGES PER FRAME
video.on('error', (err) => {
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
video.bind(process.env.TELLO_PORT_VIDEO);

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
    server.send(
      msg,
      0,
      msg.length,
      process.env.TELLO_PORT,
      process.env.TELLO_IP,
      function (err) {
        // tello - 192.168.10.1
        if (err) {
          console.error(err);
          reject(`ERROR : ${command}`);
        } else resolve('OK');
      }
    );
  });
}
function sendWS(data) {
  websocket.clients.forEach(function each(client) {
    if (client.readyState === 1 && client.bufferedAmount === 0) {
      try {
        client.send(data); //SEND OVER WEBSOCKET
      } catch (e) {
        console.log(`Sending failed:`, e);
      }
    }
  });
}
