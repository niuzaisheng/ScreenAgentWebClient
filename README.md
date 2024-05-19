<p align="center">
    <h1 align="center"> <img src="assets/ScreenAgent.png" alt="ScreenAgent Logo" width="30">  ScreenAgent Web Client </h1>
    <h2 align="center"> Let Large Models Control Your Desktop </h2>
</p>


![ScreenAgent Web Client](assets/screenshot.png)

## Introduction

ScreenAgent is a web-based remote desktop client that allows Large Models to directly control computer desktops via remote desktop protocols. It is built on top of [noVNC](https://github.com/novnc/noVNC). It is suitable for applications where a large model needs to interact with a desktop environment, such as reinforcement learning, robotics, and human-computer interaction.

You can learn about the design concept of this pipeline in our paper: [arxiv:2402.07945](https://arxiv.org/abs/2402.07945) and Github repository: [ScreenAgent](https://github.com/niuzaisheng/ScreenAgent).

## Features
- Use cloud API or self-server API to drive the pipeline.
- Mouse and keyboard actions are converted into json or function call form, with uniform action type definitions to train large models to control the desktop.
- Can construct (choosen, rejected) form data for RLHF training.

## Quick start

Step 1, Prepare the desktop to be controlled
First, you need to prepare the desktop operating system to be controlled, where the VNC Server is installed, such as [TightVNC](https://www.tightvnc.com/download.php).

Step 2, Build and run the ScreenAgent web client
```sh
npm install
npm run build

git clone https://github.com/novnc/websockify.git
./novnc_proxy --web dist --listen localhost:6080 --vnc localhost:5900
```
where:
` --listen ` is the address and port of ScreenAgent web page.
` --vnc ` is the address and port of the VNC server you want to connect to.

Then open your browser and visit `http://localhost:6080` to see the ScreenAgent web page. You will be asked for your Remote Desktop connection password when the page loads.

## For Development

```sh
npm install
npx patch-package @novnc/novnc
npm run dev
```
