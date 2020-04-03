const socketURL = 'ws://localhost:8080';
const ws = new WebSocket(socketURL);
ws.binaryType = 'arraybuffer';
function sendCommand(cmd) {
  ws.send(JSON.stringify({ action: 'command', data: cmd }));
}
function updateElement(id, data) {
  return (document.getElementById(id).innerHTML = data);
}
window.onload = e => {
  const jmuxer = new JMuxer({
    node: 'player',
    mode: 'video',
    flushingTime: 10,
    fps: 30,
    debug: false
  });

  ws.addEventListener('message', e => {
    const _data = JSON.parse(event.data);
    if (_data.hasOwnProperty('status')) {
      let temp = null;
      for (const property in _data.status) {
        temp += `${property}: ${_data.status[property]} `;
      }
      updateElement('status', temp);
    } else if (_data.hasOwnProperty('video')) {
      jmuxer.feed({
        video: new Uint8Array(_data.video.data),
        duration: 100
      });
    }
  });
  ws.addEventListener('error', e => {
    console.log('Socket Error');
  });
  ws.addEventListener('open', e => {
    console.log(`WS Open ${socketURL}`);
  });
};
