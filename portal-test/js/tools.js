function updateElement(id, data) {
  return (document.getElementById(id).innerHTML = data);
}
function addClick(id, func) {
  return document.getElementById(id).addEventListener('click', func);
}
function pushConsole(e) {
  if (console_buff.length == console_len) {
    console_buff.unshift(e);
    console_buff.pop();
  } else {
    console_buff.unshift(e);
  }
  renderConsole();
}
function clearConsole() {
  console_buff = [];
  renderConsole();
}
function renderConsole() {
  let _list = '';
  for (let i of console_buff) {
    _list += `<p>${i}</p>`;
  }
  updateElement('console_container', _list);
}
function requestInput() {
  //Show button
  temp_commands;
  let _commands = arr;
  let _cmd = _commands.pop();
}
function inputReponse(resp, arr) {
  console.log(resp);
  if (arr.length == 1) {
    pushConsole('Done');
  } else {
    requestInput(arr);
  }
}
