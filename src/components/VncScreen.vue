<template>
    <div id="screen" ref="screen">
        <!-- This is where the remote screen will appear -->
    </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import RFB from '@novnc/novnc/core/rfb.js';
import bus from '../eventBus';
import { layer } from '@layui/layui-vue';

let rfb;

// This function extracts the value of one variable from the
// query string. If the variable isn't defined in the URL
// it returns the default value instead.
function readQueryVariable(name, defaultValue) {
    // A URL with a query parameter can look like this:
    // https://www.example.com?myqueryparam=myvalue
    //
    // Note that we use location.href instead of location.search
    // because Firefox < 53 has a bug w.r.t location.search
    const re = new RegExp('.*[?&]' + name + '=([^&#]*)');
    let match = document.location.href.match(re);

    if (match) {
        // We have to decode the URL since want the cleartext value
        return decodeURIComponent(match[1]);
    }

    return defaultValue;
}

// Build the websocket URL used to connect
let url; 
const path = readQueryVariable('path', 'websockify');
const host = 'localhost';
const port = '6080';

// if (window.location.protocol === "https:") {
//     url = 'wss';
// } else {
//     url = 'ws';
// }
// url += '://' + host;
// if (port) {
//     url += ':' + port;
// }
// url += '/' + path;

url = `ws://${host}:${port}/${path}`; // TODO change to wss

// Read parameters specified in the URL query string
// By default, use the host and port of server that served this file
let localStorage = window.localStorage;

let screen = ref(null);
// Since most operating systems will catch Ctrl+Alt+Del
// before they get a chance to be intercepted by the browser,
// we provide a way to emulate this key sequence.
function sendCtrlAltDel() {
    rfb.sendCtrlAltDel();
    return false;
}

function connectedToServer(e) {
    layer.notify({ title: 'Connection Message', content: 'Connected to desktop!', icon: 1 })
}

function disconnectedFromServer(e) {
    if (e.detail.clean) {
        layer.notify({ title: 'Connection Message', content: 'Disconnected', icon: 3 })
    } else {
        layer.notify({ title: 'Connection Message', content: 'Something went wrong, connection is closed!', icon: 2 })
    }
    bus.emit('rfbDisconnected', rfb);
}


function askPassword() {
    let inputPassword = prompt("VNC Password Required, this password will not upload to the cloud, will be stored in your browser locally.");
    localStorage.setItem('password', inputPassword);
    return inputPassword;
}

function credentialsAreRequired(e) {
    let password = askPassword();
    rfb.sendCredentials({ password: password });
}

function updateDesktopName(e) {
    let desktopName = e.detail.name;
    layer.notify({ title: 'Connection Message', content: `Connected to desktop ${desktopName}!`, icon: 1 })
}

function newConnection(password) {
    // Creating a new RFB object will start a new connection
    rfb = new RFB(screen.value, url, { credentials: { password: password } });
    rfb.scaleViewport = true;
    bus.emit('rfbCreated', rfb);
    // Add listeners to important events from the RFB module
    rfb.addEventListener("connect", connectedToServer);
    rfb.addEventListener("disconnect", disconnectedFromServer);
    rfb.addEventListener("credentialsrequired", credentialsAreRequired);
    rfb.addEventListener("desktopname", updateDesktopName);
}

bus.on('GetScreenSize', () => {
    var videoWidth = rfb._display._fbWidth
    var videoHeight = rfb._display._fbHeight
    bus.emit('ScreenSize', { videoWidth: videoWidth, videoHeight: videoHeight });
});

bus.on('SendCtrlAltDel', () => {
    sendCtrlAltDel();
});

bus.on('newConnection', () => {
    let password = localStorage.getItem('password');
    newConnection(password);
});


onMounted(() => {
    let password = localStorage.getItem('password');
    if (!password) {
        password = askPassword();
    }
    newConnection(password);
});


</script>

<style scoped>
#screen {
    height: 95vh;
    box-sizing: border-box;
}
</style>