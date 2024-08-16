## Step 1, Prepare the desktop to be controlled.
First, you need to prepare the desktop operating system to be controlled, where the VNC Server is installed, such as [TightVNC](https://www.tightvnc.com/download.php).

## Step 2, Start a websockify to connect to the VNC server.
The [websockify](https://github.com/novnc/websockify) translates WebSockets traffic to normal socket traffic, so you can connect to a VNC server from a web browser.

```sh
git clone https://github.com/niuzaisheng/ScreenAgentWebClient.git
cd ScreenAgentWebClient
./novnc_proxy --vnc localhost:5900
```

where:
` --vnc ` is the address and port of the VNC server you want to connect to, you maybe need to change the port number according to your VNC server configuration.
` ./novnc_proxy ` will clone the websockify repository and start the websockify server.

You will be asked for your Remote Desktop connection password when the page loads, the password will send to your own websockify listen by `novnc_proxy`, and will not upload to the cloud. You can set a password at the bottom of this page. Then refresh this page. 

Simple as that.