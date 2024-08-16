<template>
    <lay-layer title="Quick Start" v-model="visibleTips" :shade="false" :area="['50vw', '80vh']" :btn="action">
        <lay-container>
            <div class="markdown-body" v-html="markedContent"></div>
            <lay-form label-position="top">
                <lay-form-item label="VNC Password">
                    <lay-input v-model="vncPassword" placeholder="YOUR_VNC_PASSWORD" type="password" password></lay-input>
                    <p>this password will not upload to the cloud, will be stored in your browser locally.</p>
                </lay-form-item>
            </lay-form>
        </lay-container>
    </lay-layer>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { layer } from '@layui/layui-vue'

import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings';

import bus from '../eventBus';

import { marked } from 'marked';
import 'github-markdown-css';

const settingsStore = useSettingsStore();
const { vncPassword, showTips } = storeToRefs(settingsStore);

const visibleTips = ref(true);
if (showTips === false) {
    visibleTips.value = false;
}

const action = ref([
    {
        text: "Never show again",
        callback: () => {
            showTips.value = false;
            visibleTips.value = false;
            bus.emit('newConnection');
        }
    },
    {
        text: "Close",
        callback: () => {
            visibleTips.value = false;
            bus.emit('newConnection');
        }
    }
])

const markedContent = ref('');

onMounted(async () => {
    const response = await fetch('/src/assets/WelcomeTips.md');
    const markdown = await response.text();
    markedContent.value = marked(markdown);
});
</script>