# DJI-Tello-WS-Server

DJI Tello Drone Web Socket Server

## Clone repo and install dependencies

git clone https://github.com/markwinap/DJI-Tello-WS-Server.git
cd DJI-Tello-WS-Server
npm install
npm start

## Run portal locally

cd tello-ws-portal
npm install
npm start

## ONLY for accessing drone over internet (tunnel)

### Intall ngrok

https://ngrok.com/

### Download ngrok (raspberry)

https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-arm.zip

### Unzip

unzip ngrok.zip

### Setup your account

./ngrok authtoken 6X8R

### Open tunnel

./ngrok http 8080

## Raspberry Aditional Requirements

### Install NodeJs

curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
sudo apt install nodejs
node --version
