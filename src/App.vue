<script setup>
import VncScreen from './components/VncScreen.vue'
import ScreenAgentPanel from './components/ScreenAgentPanel.vue'
</script>


<template>
  <lay-layout>
    <lay-header>
      <lay-space>
        <div id="header-bar">
          <img src="./assets/logo.png" alt="ScreenAgent Logo" width="60" height="60">
          <h2>ScreenAgent Web Client</h2>
          <lay-menu>
            <lay-menu-item @click="goHref('https://github.com/niuzaisheng/ScreenAgent')">GitHub Repo</lay-menu-item>
            <lay-menu-item @click="goHref('https://arxiv.org/abs/2402.07945')">Paper</lay-menu-item>
            <lay-menu-item @click="sendCtrlAltDel">Send Ctrl+Alt+Del</lay-menu-item>
          </lay-menu>
        </div>
      </lay-space>
    </lay-header>
    <lay-body>
      <lay-row space="10">
        <lay-col md="18">
          <VncScreen />
        </lay-col>
        <lay-col md="6">
          <lay-scroll style="height:100vh; margin: 20px">
            <ScreenAgentPanel />
          </lay-scroll>
        </lay-col>
      </lay-row>
    </lay-body>
  </lay-layout>

</template>

<script>
import { ref, provide } from 'vue';
import bus from './eventBus';

function sendCtrlAltDel() {
  bus.emit('sendCtrlAltDel');
}

function goHref(url) {
  window.open(url);
}

export default {
  setup() {
    return {
      sendCtrlAltDel,
      goHref,
    }
  },
}
</script>

<style>

.layui-header {
  align-items: center;
  height: 5vh;
  text-align: left;
  background-color: #393D49;
  color: whitesmoke;
}

.layui-body {
  background: rgb(40, 40, 40);
  align-items: center;
  justify-content: center;
  color: white;
}

#header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
</style>
