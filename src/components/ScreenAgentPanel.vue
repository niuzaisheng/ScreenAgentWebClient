<template>
    <lay-collapse openKeys="model-settings">
        <lay-collapse-item title="Model Settings" id="model-settings">
            <lay-form label-position="top">
                <lay-form-item label="Select Model">
                    <lay-select v-model="selectedModel">
                        <lay-select-option :value="1" label="GPT-4o"
                            @click="setSelectedModel('gpt-4o')"></lay-select-option>
                        <lay-select-option :value="2" label="GPT-4V"
                            @click="setSelectedModel('gpt-4v')"></lay-select-option>
                        <lay-select-option :value="3" label="Self Server"
                            @click="setSelectedModel('self-server')"></lay-select-option>
                    </lay-select>
                </lay-form-item>

                <div id="openai-settings" v-show="selectedModel != 3">
                    <lay-form-item label="OpenAI API Key (Save locally only, won't be uploaded.)">
                        <lay-input v-model="apiKey" placeholder="sk-XXXXX" type="password" password></lay-input>
                    </lay-form-item>
                </div>

                <div id="self-sever-settings" v-show="selectedModel === 3">
                    <lay-form-item label="API Base URL">
                        <lay-input v-model="baseURL" placeholder="http://localhost:8000"></lay-input>
                    </lay-form-item>
                    <lay-form-item label="Model Name">
                        <lay-input v-model="selfServerModelName" placeholder="Phi-3-vision-128k-instruct"></lay-input>
                    </lay-form-item>
                </div>

            </lay-form>
        </lay-collapse-item>

        <lay-collapse-item title="ScreenAgent Pipline" id="pipeline">
            <lay-form label-position="top">

                <lay-form-item label="Prompt Template">
                    <lay-space>
                        <p>Prompt Language</p>
                        <lay-select size="sm" v-model="selectedPromptLanguage">
                            <lay-select-option v-for="(value, key) in promptLanguageMap" :key="key" :value="value"
                                :label="key"></lay-select-option>
                        </lay-select>
                        <p>Operating System</p>
                        <lay-select size="sm" v-model="selectedOperatingSystem">
                            <lay-select-option v-for="(value, key) in operatingSystemNameMap" :key="key" :value="value"
                                :label="key"></lay-select-option>
                        </lay-select>
                    </lay-space>
                </lay-form-item>

                <lay-form-item label="① Task">
                    <lay-dropdown updateAtScroll>
                        <lay-input v-model="taskPrompt" placeholder="Task"></lay-input>
                        <template #content>
                            <lay-dropdown-menu size="sm">
                                <lay-dropdown-menu-item v-for="example in taskExamples[selectedPromptLanguage]"
                                    :key="example" @click="taskPrompt = example">{{ example }}</lay-dropdown-menu-item>
                            </lay-dropdown-menu>
                        </template>
                    </lay-dropdown>
                </lay-form-item>

                <Automaton />

                <lay-form-item label="Prompt">
                    <lay-textarea v-model="promptDisplay" :autosize="{ minHeight: 100 }"></lay-textarea>
                </lay-form-item>

                <lay-form-item v-show="sendScreenImage" label="Send Screen Image">
                    <div class="img-content">
                        <img :src="sendScreenImage" style="max-width: 100%;">
                    </div>
                </lay-form-item>

                <lay-form-item>
                    <lay-button type="primary" :loading="sendPormptLoading" @click="sendPormptHandle" fluid> ③ Send 
                        Pormpt to
                        VLM</lay-button>
                </lay-form-item>

                <lay-form-item label="Original Response">
                    <lay-textarea v-model="originalResponseDisplay" placeholder="Original Response"
                        :autosize="{ minHeight: 100 }" disabled="disabled"></lay-textarea>
                </lay-form-item>

                <lay-form-item>
                    <lay-button type="primary" @click="copyOriginalResponseToEditor" fluid>④ Copy Original Response
                        to
                        Editor</lay-button>
                </lay-form-item>

                <lay-form-item label="Response Editor">
                    <lay-textarea v-model="responseEditor" placeholder="Response Editor"
                        :autosize="{ minHeight: 100 }"></lay-textarea>
                </lay-form-item>

                <lay-form-item>
                    <lay-button type="primary" @click="parseActionsHandle" fluid>⑤ Try to Parse Actions in
                        Editor</lay-button>
                </lay-form-item>

                <lay-form-item label="Parsed Actions">
                    <lay-scroll height="300px" style="background-color: whitesmoke" thumbColor="#000000">
                        <lay-container>
                            <lay-row>
                                <lay-col span="24">
                                    <lay-panel v-for="(action, index) in actionsList" :key="index"
                                        style="margin: 5px; padding: 5px">
                                        <p> {{ action.toIdealDisplayFormat() }} </p>
                                    </lay-panel>
                                </lay-col>
                            </lay-row>
                        </lay-container>
                    </lay-scroll>
                </lay-form-item>

                <lay-form-item>
                    <p>⚠️ Model can make mistakes. Check before run actions.</p>
                    <lay-button type="primary" @click="runActionsHandle" fluid>⑥ Run Actions</lay-button>
                </lay-form-item>
            </lay-form>

        </lay-collapse-item>

        <lay-collapse-item title="Events" id="event_display">
            <lay-form label-position="top">

                <lay-form-item label="Event History">
                    <lay-scroll height="300px" style="background-color: whitesmoke" thumbColor="#000000">
                        <lay-container>
                            <lay-row>
                                <lay-col span="24">
                                    <lay-panel v-for="(action, index) in events" :key="index"
                                        style="margin: 5px; padding: 5px">
                                        <p> {{ action.toIdealDisplayFormat() }} </p>
                                    </lay-panel>
                                </lay-col>
                            </lay-row>
                        </lay-container>
                    </lay-scroll>
                </lay-form-item>

                <lay-form-item>
                    <lay-space>
                        <p>Max Log</p>
                        <lay-input-number v-model="maxEvents" size="sm" :min="1"></lay-input-number>

                        <lay-button-group>
                            <lay-button size="sm" type="default" @click="events = []">Clear History</lay-button>
                            <!-- <lay-button size="sm" type="default" @click="mergeActions">Merge Actions</lay-button>
                            <lay-button size="sm" type="default">Export History</lay-button> -->
                        </lay-button-group>
                    </lay-space>

                </lay-form-item>

                <!-- 构造新的事件的表单 -->
                <lay-form-item label="New Mouse Action">
                    <lay-space>
                        <p>X</p>
                        <lay-input-number v-model="newMouseActionX" size="sm" :min="0" :max="1920"></lay-input-number>
                        <p>Y</p>
                        <lay-input-number v-model="newMouseActionY" size="sm" :min="0" :max="1080"></lay-input-number>

                        <lay-dropdown updateAtScroll>
                            <lay-button size="sm" type="primary">Mouse Button</lay-button>
                            <template #content>
                                <lay-dropdown-menu size="sm">
                                    <lay-dropdown-menu-item
                                        @click="newMouseActionHandle('move')">Move</lay-dropdown-menu-item>
                                    <lay-dropdown-menu-item @click="newMouseActionHandle('left_click')">Left
                                        Click</lay-dropdown-menu-item>
                                    <lay-dropdown-menu-item @click="newMouseActionHandle('right_click')">Right
                                        Click</lay-dropdown-menu-item>
                                    <lay-dropdown-menu-item @click="newMouseActionHandle('left_double_click')">Left
                                        Double Click</lay-dropdown-menu-item>
                                    <lay-dropdown-menu-item @click="newMouseActionHandle('right_double_click')">Right
                                        Double
                                        Click</lay-dropdown-menu-item>
                                    <lay-dropdown-menu-item
                                        @click="newMouseActionHandle('middle')">Middle</lay-dropdown-menu-item>
                                </lay-dropdown-menu>
                            </template>
                        </lay-dropdown>
                    </lay-space>
                </lay-form-item>

                <lay-form-item label="New Key Action">
                    <lay-space>
                        <lay-input v-model="newKeyboardActionKey" size="sm" placeholder="key"></lay-input>
                        <lay-button type="primary" size="sm" @click="newKeyboardActionHandle">Send Key</lay-button>
                        <lay-input v-model="newKeyboardActionText" size="sm" placeholder="text"></lay-input>
                        <lay-button type="primary" size="sm" @click="newKeyboardActionTextHandle">Send
                            Text</lay-button>
                    </lay-space>
                </lay-form-item>

                <lay-form-item label="New Plan Action">
                    <lay-space>
                        <lay-input v-model="newPlanAction" size="sm" placeholder="element"></lay-input>
                        <lay-button type="primary" size="sm" @click="newPlanActionHandle">Add New Plan</lay-button>
                    </lay-space>
                </lay-form-item>

                <lay-form-item label="New Evaluate Action">
                    <lay-space>
                        <!-- sub_task_success, need_retry, need_reformulate -->
                        <lay-radio v-model="newEvaluateActionSelected" name="action" :value="1"
                            label="sub_task_success"></lay-radio>
                        <lay-radio v-model="newEvaluateActionSelected" name="action" :value="2"
                            label="need_retry"></lay-radio>
                        <lay-radio v-model="newEvaluateActionSelected" name="action" :value="3"
                            label="need_reformulate"></lay-radio>
                    </lay-space>
                    <lay-space>
                        <lay-input v-model="newEvaluateActionAdvice" size="sm" placeholder="advice"></lay-input>
                        <lay-button type="primary" size="sm" @click="newEvaluateActionHandle">Add New
                            Evaluate</lay-button>
                    </lay-space>
                </lay-form-item>
            </lay-form>
        </lay-collapse-item>
    </lay-collapse>
</template>

<script setup>
import { ref, reactive, watchEffect, provide } from 'vue';
import { layer } from '@layui/layer-vue'
import OpenAI from "openai";
import { Position, ClickableArea, Action, MouseAction, MouseButton, MouseActionType, KeyboardAction, KeyboardActionType, WaitAction, PlanAction, EvaluateSubTaskAction, parseActionsFromText } from '../action';
import bus from '../eventBus';
import Automaton from './Automaton.vue';

let rfb;
let localStorage = window.localStorage;


// Model settings panel
const selectedModel = ref(1);

var selectedModelName = 'gpt-4o'; // default 

const baseURL = ref('http://localhost:8000'); // Self Server Base URL
watchEffect(() => {
    localStorage.setItem('baseURL', baseURL.value);
});

const apiKey = ref(''); // OpenAI API Key
if (localStorage.getItem('apiKey')) {
    apiKey.value = localStorage.getItem('apiKey');
}
watchEffect(() => {
    localStorage.setItem('apiKey', apiKey.value);
});

const sendPormptLoading = ref(false);
function setSelectedModel(model) {
    selectedModelName = model;
}
const selfServerModelName = ref('');

// ScreenAgent pipeline panel
const operatingSystemNameMap = ref({
    "Windows": "win",
    "Linux Desktop": "linux",
    // "MacOS": "macos",
})
const selectedOperatingSystem = ref("win");
provide('selectedOperatingSystem', selectedOperatingSystem);

const promptLanguageMap = ref({
    "English": "en",
    "Chinese-Simplified": "zh",
})
const selectedPromptLanguage = ref("en");
provide('selectedPromptLanguage', selectedPromptLanguage);

const taskPrompt = ref('');
provide('taskPrompt', taskPrompt);
const taskExamples = ref({
    en: [
        "Open the browser and go to wikipedia.org",
        "Open start menu and search for 'cmd'",
    ],
    zh: [
        "打开浏览器并访问 wikipedia.org",
        "打开开始菜单并搜索 'cmd'",
    ],
})

const sendScreenImage = ref('')

const subTasks = ref([]);
provide('subTasks', subTasks);
const currentSubTaskIndex = ref(-1);
provide('currentSubTaskIndex', currentSubTaskIndex);

const promptDisplay = ref('');
provide('promptDisplay', promptDisplay);

const originalResponseDisplay = ref('');
const responseEditor = ref('');
var actionsList = ref([]);
provide('actionsList', actionsList);

function copyOriginalResponseToEditor() {
    responseEditor.value = originalResponseDisplay.value;
}

// Events panel
var events = ref([]);
const maxEvents = ref(10);

const newMouseActionX = ref(0);
const newMouseActionY = ref(0);
const newKeyboardActionKey = ref('');
const newKeyboardActionText = ref('');
const newPlanAction = ref('');
const newEvaluateActionSelected = ref(1);
const newEvaluateActionAdvice = ref('');

bus.on('rfbCreated', (rfbItem) => {
    console.log('rfbCreated', rfbItem);
    rfb = rfbItem;

    rfb.addEventListener("mousedown", (data) => {
        data = data.detail;
        let position = new Position(parseInt(data.x), parseInt(data.y));
        let mouseButton = data.button;
        let action = new MouseAction({ mouseActionType: MouseActionType.down, mouseButton: mouseButton, mousePosition: position });
        updateEventHistory(action);
    });

    rfb.addEventListener("mouseup", (data) => {
        data = data.detail;
        let position = new Position(parseInt(data.x), parseInt(data.y));
        let mouseButton = data.button;
        let action = new MouseAction({ mouseActionType: MouseActionType.up, mouseButton: mouseButton, mousePosition: position });
        updateEventHistory(action);
    });

    rfb.addEventListener("mousemove", (data) => {
        data = data.detail;
        let position = new Position(parseInt(data.x), parseInt(data.y));
        let action = new MouseAction({ mouseActionType: MouseActionType.move, mousePosition: position });
        updateEventHistory(action);
    });

    rfb.addEventListener("wheel", (data) => {
        data = data.detail;
        let position = new Position(parseInt(data.x), parseInt(data.y));
        let action = null;
        if (data.direction == "scrollUp") {
            action = new MouseAction({ mouseActionType: MouseActionType.scrollUp, mousePosition: position });
        } else {
            action = new MouseAction({ mouseActionType: MouseActionType.scrollDown, mousePosition: position });
        }
        updateEventHistory(action);
    });

    rfb.addEventListener("sendKey", (data) => {
        data = data.detail;
        // { keysym: keysym, scancode: 0, down: bool }
        let keyboardActionType = null;
        if (data.click) {
            keyboardActionType = KeyboardActionType.click;
        }
        if (data.down === true) {
            keyboardActionType = KeyboardActionType.press;
        } else if (data.down === false) {
            keyboardActionType = KeyboardActionType.up;
        }
        let keyboardKey = KeyboardAction.getKeysymName(data.keysym);
        let action = new KeyboardAction({ keyboardKey: keyboardKey, keyboardActionType: keyboardActionType });
        updateEventHistory(action);
    });
});

bus.on('rfbDisconnected', (rfbItem) => {
    console.log('rfbDisconnected', rfbItem);
    rfb = null;
});

async function sendPormptHandle() {

    if (promptDisplay.value === '') {
        layer.msg('Prompt is empty');
        return;
    }
    let openai;
    let modelName;
    if (selectedModelName === 'self-server') {
        openai = new OpenAI({
            apiKey: '',
            baseURL: baseURL.value,
            dangerouslyAllowBrowser: true,
        });
        modelName = selfServerModelName.value;
    } else {
        if (apiKey.value === '') {
            layer.msg('OpenAI API Key is empty, please fill in Model Settings');
            return;
        }
        openai = new OpenAI({
            apiKey: apiKey.value,
            dangerouslyAllowBrowser: true,
        });
        modelName = selectedModelName;
    }

    if (rfb) {
        let imageBase64 = rfb.toDataURL("image/jpeg", 1);
        sendScreenImage.value = imageBase64;
        originalResponseDisplay.value = '';
        var ret = '';
        try {
            sendPormptLoading.value = true;
            layer.msg('Waiting for response...');

            const stream = await openai.chat.completions.create({
                model: modelName,
                stream: true,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: promptDisplay.value },
                            {
                                type: "image_url",
                                image_url: {
                                    "url": imageBase64,
                                },
                            },
                        ],
                    },
                ],
            });
            for await (const chunk of stream) {
                let delta = chunk.choices[0]?.delta?.content || '';
                if (delta !== '') {
                    originalResponseDisplay.value += delta;
                }
            }

        } catch (error) {
            console.error(error);
            ret = error;
        } finally {
            sendPormptLoading.value = false;
        }
    }
    else {
        layer.msg('No connection to VNC server');
    }
}

function parseActionsHandle() {
    actionsList.value = [];
    actionsList.value = parseActionsFromText(responseEditor.value);
}

function runActionsHandle() {
    if (actionsList.value.length == 0) {
        layer.msg('No actions to run');
    } else {
        for (let action of actionsList.value) {
            action.step(rfb);
        }
        bus.emit('AfterRunActions', 'AfterRunActions');
        layer.msg('Actions sent');
    }
}

function updateEventHistory(action) {
    events.value.unshift(action);
    if (events.value.length > maxEvents.value) {
        events.value = events.value.slice(0, maxEvents.value);
    }
}

function mergeActions() {
    let mergedActions = [];
    for (let action of events.value) {
        if (action instanceof Action) {
            mergedActions.push(action);
        }
    }
    events.value = mergedActions;
}

function newMouseActionHandle(action) {
    let x = newMouseActionX.value;
    let y = newMouseActionY.value;
    let mousePosition = new Position(x, y);
    let mouseAction = null;
    let mouseActionType = null;
    let mouseButton = null;

    if (action == "move") {
        mouseActionType = MouseActionType.move;
    } else if (action == "left_click") {
        mouseActionType = MouseActionType.click;
        mouseButton = MouseButton.left;
    } else if (action == "right_click") {
        mouseActionType = MouseActionType.click;
        mouseButton = MouseButton.right;
    } else if (action == "left_double_click") {
        mouseActionType = MouseActionType.doubleClick;
        mouseButton = MouseButton.left;
    } else if (action == "right_double_click") {
        mouseActionType = MouseActionType.doubleClick;
        mouseButton = MouseButton.right;
    } else if (action == "middle") {
        mouseActionType = MouseActionType.click;
        mouseButton = MouseButton.middle;
    }
    mouseAction = new MouseAction({ mouseActionType: mouseActionType, mouseButton: mouseButton, mousePosition: mousePosition });
    mouseAction.step(rfb);
}

function newKeyboardActionHandle() {
    let keyboardKey = newKeyboardActionKey.value;
    let keyboardActionType = KeyboardActionType.press;
    let keyboardAction = new KeyboardAction({ keyboardKey: keyboardKey, keyboardActionType: keyboardActionType });
    keyboardAction.step(rfb);
}

function newKeyboardActionTextHandle() {
    let keyboardText = newKeyboardActionText.value;
    let keyboardActionType = KeyboardActionType.text;
    let keyboardAction = new KeyboardAction({ keyboardText: keyboardText, keyboardActionType: keyboardActionType });
    keyboardAction.step(rfb);
}

function newPlanActionHandle() {
    let planAction = new PlanAction({ element: newPlanAction.value });
    subTasks.value.push(planAction);
    layer.msg(`Add new plan "${newPlanAction.value}" to sub task list.`);
}

function newEvaluateActionHandle() {
    // newEvaluateActionSelected
    var situation = '';
    switch (newEvaluateActionSelected.value) {
        case 1:
            situation = 'sub_task_success';
            break;
        case 2:
            situation = 'need_retry';
            break;
        case 3:
            situation = 'need_reformulate';
            break;
        default:
            break;
    }
    let evaluateAction = new EvaluateSubTaskAction({ situation: situation, advice: newEvaluateActionAdvice });
    bus.emit('NewEvaluateAction', evaluateAction);
}

</script>

<style>
.layui-form-label {
    width: 500px !important;
}

.layui-colla-content {
    background-color: #ffffff;
}
</style>