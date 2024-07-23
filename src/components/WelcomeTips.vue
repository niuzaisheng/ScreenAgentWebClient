<template>
    <lay-layer title="Quick Start" v-model="visibleTips" :shade="false" :area="['50vw', '80vh']" :btn="action11">
        <lay-container>
            <div class="markdown-body" v-html="markedContent"></div>
            <lay-form label-position="top">
                <lay-form-item label="VNC Password">
                    <lay-input v-model="password" placeholder="password" type="password" password></lay-input>
                    <p>this password will not upload to the cloud, will be stored in your browser locally.</p>
                </lay-form-item>
                <lay-form-item>
                    <lay-button type="primary" @click="savePassword" fluid>Save Password Locally</lay-button>
                </lay-form-item>
            </lay-form>
        </lay-container>
    </lay-layer>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { layer } from '@layui/layui-vue'
import { marked } from 'marked';
import 'github-markdown-css';

let localStorage = window.localStorage;
let showTips = localStorage.getItem('showTips');
const visibleTips = ref(true);
if (showTips === 'false') {
    visibleTips.value = false;
}

const password = ref(localStorage.getItem('password') || '');

const action11 = ref([
    {
        text: "Close",
        callback: () => {
            visibleTips.value = false;
        }
    },
    {
        text: "Never show again",
        callback: () => {
            visibleTips.value = false;
            localStorage.setItem('showTips', 'false');
        }
    }
])

const markedContent = ref('');

function savePassword() {
    localStorage.setItem('password', password.value);
    layer.notify({ title: 'Password Saved', content: 'Password saved locally.', icon: 1 });
}

onMounted(async () => {
    const response = await fetch('/src/assets/WelcomeTips.md');
    const markdown = await response.text();
    markedContent.value = marked(markdown);
});
</script>