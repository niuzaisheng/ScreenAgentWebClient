<template>

    <lay-form-item label="Stage">
        <lay-step :active="stageIndex" current-status="success" @onChange="changeStageManually">
            <lay-step-item title="Prepare"></lay-step-item>
            <lay-step-item title="Planing"></lay-step-item>
            <lay-step-item title="Acting"></lay-step-item>
            <lay-step-item title="Reflecting"></lay-step-item>
            <lay-step-item title="End"></lay-step-item>
        </lay-step>

        <lay-button @click="toNextState" type="primary">② Next Stage</lay-button>
        <lay-button @click="resetAutomaton">Reset</lay-button>
    </lay-form-item>

    <lay-form-item label="Auto Transition">
        <lay-switch v-model="autoTransitionFlag"></lay-switch>
    </lay-form-item>

    <lay-form-item label="Stage Flags">
        <!-- 显示 subTaskSuccessFlag, needRetryFlag, needReformulateFlag, finishFlag -->
        <lay-checkbox size="xs" v-model="subTaskSuccessFlag">Subtask Success</lay-checkbox>
        <lay-checkbox size="xs" v-model="needRetryFlag">Need Retry</lay-checkbox>
        <lay-checkbox size="xs" v-model="needReformulateFlag">Need Reformulate Task</lay-checkbox>
        <lay-checkbox size="xs" v-model="finishFlag">Finish Task</lay-checkbox>
    </lay-form-item>

    <!-- subTasks 的展示 -->
    <lay-form-item label="Sub-tasks List">
        <lay-scroll  height="200px" style="background-color: whitesmoke" thumbColor="#000000">
            <lay-container>
                <lay-row>
                    <lay-col span="24">
                        <lay-panel v-for="(subTaskAction, index) in subTasks" :key="index" style="margin: 5px; padding: 5px">
                            <p>{{ index + 1 }} . {{ subTaskAction.element }}</p>
                        </lay-panel>
                    </lay-col>
                </lay-row>
            </lay-container>
        </lay-scroll>
    </lay-form-item>

</template>

<script setup>
import { ref, inject, watch } from 'vue';
import bus from '../eventBus';
import { useMachine } from '@xstate/vue';
import { createMachine, assign } from 'xstate';
import { layer } from '@layui/layer-vue';
import nunjucks from 'nunjucks';

import { PlanAction, EvaluateSubTaskAction } from '../action';

// ScreenAgent Pipeline Automaton
// 一共有五个状态：Prepare, Planing, Acting, Reflecting, End
// 其中，Reflecting状态需要根据结果判断情况，有三种情况：
// 1. 如果Reflecting的结果为 "sub_task_success" 则将当前TODO list中的任务状态改为"done"，并进入下一个任务
// 2. 如果Reflecting的结果为 "need_retry" 则重试当前任务
// 3. 如果Reflecting的结果为 "need_reformulate" 则返回Planing状态，重新规划任务
// 4. 如果Reflecting的结果为 "finish" 则结束任务，进入End状态
// Automaton 需要维护一个TODO list subTasks，用于存储当前任务列表
// Automaton 需要维护一个当前任务的索引，用于记录当前任务的位置

let videoWidth = ref(0);
let videoHeight = ref(0);

let taskPrompt = inject('taskPrompt');

let stageIndex = ref(0);
let autoTransitionFlag = ref(false);

let promptDisplay = inject('promptDisplay');

let subTasks = inject('subTasks');
let currentSubTaskIndex = inject('currentSubTaskIndex');

let actionsList = inject('actionsList');

let subTaskSuccessFlag = ref(false);
let needRetryFlag = ref(false);
let needReformulateFlag = ref(false);
let finishFlag = ref(false);
let advice = ref("");

let selectedPromptLanguage = inject('selectedPromptLanguage');
let selectedOperatingSystem = inject('selectedOperatingSystem');

function renderPrompt(stage) {
    var filePrefix = "";
    switch (stage) {
        case "prepare":
            promptDisplay.value = "";
            return;
        case "planing":
            filePrefix = "planner_agent";
            break;
        case "acting":
            filePrefix = "actor_agent";
            break;
        case "reflecting":
            filePrefix = "evaluator_agent";
            break;
        case "end":
            promptDisplay.value = "End of the task.";
            return;
    }

    var current_task = "";
    if (subTasks.value.length > 0) {
        current_task = subTasks.value[currentSubTaskIndex.value].element;
    }

    var sub_task_list = subTasks.value.map((subTaskAction, index) => {
        return subTaskAction.element;
    });
    
    fetch(`prompts/${filePrefix}_${selectedOperatingSystem.value}_${selectedPromptLanguage.value}.txt`)
        .then(response => response.text())
        .then(promptTemplate => {
            // 填充渲染模板
            let data = {
                video_width: videoWidth.value,
                video_height: videoHeight.value,
                task_prompt: taskPrompt.value,
                current_task: current_task,
                sub_task_list: sub_task_list,
                advice: advice.value
            };
            let renderedPrompt = nunjucks.renderString(promptTemplate, data);
            promptDisplay.value = renderedPrompt;
        });
}

const stateNameMap = {
    0: "prepare",
    1: "planing",
    2: "acting",
    3: "reflecting",
    4: "end"
}
let Automaton = createMachine({
    id: 'automaton',
    initial: 'prepare',
    states: {
        prepare: {
            entry: (context, event) => {
                stageIndex.value = 0;
                renderPrompt('prepare')
                bus.emit('GetScreenSize');
                subTasks.value = [];
                currentSubTaskIndex.value = -1;
                advice.value = "";
                subTaskSuccessFlag.value = false;
                needRetryFlag.value = false;
                needReformulateFlag.value = false;
                finishFlag.value = false;
            },
            on: {
                NEXT: [
                    {
                        target: 'planing',
                        guard: () => taskPrompt.value !== "",
                    },
                    {
                        target: 'prepare',
                        actions: () => {
                            layer.msg('Please set the task prompt first!');
                        }
                    }
                ],
                RESET: { target: 'prepare' },
                CHANGE_STAGE_MANUALLY: { target: (context, event) => event.targetState },
            }
        },
        planing: {
            entry: (context, event) => {
                stageIndex.value = 1;
                renderPrompt('planing')
            },
            on: {
                NEXT: [
                    {
                        target: 'acting',
                        guard: () => subTasks.value.length > 0,
                        actions: () => {
                            currentSubTaskIndex.value = 0;
                        }
                    }, {
                        target: 'planing',
                        guard: () => subTasks.value.length === 0,
                        actions: () => {
                            currentSubTaskIndex.value = -1;
                            layer.msg('No sub-tasks to execute! Back to planing.');
                        }
                    }
                ],
                RESET: { target: 'prepare' },
                CHANGE_STAGE_MANUALLY: { target: (context, event) => event.targetState },
            }
        },
        acting: {
            entry: (context, event) => {
                stageIndex.value = 2;
                renderPrompt('acting')
            },
            on: {
                NEXT: { target: 'reflecting' },
                RESET: { target: 'prepare' },
                CHANGE_STAGE_MANUALLY: { target: (context, event) => event.targetState },
            }
        },
        reflecting: {
            entry: (context, event) => {
                stageIndex.value = 3;
                renderPrompt('reflecting')
                subTaskSuccessFlag.value = false;
                needRetryFlag.value = false;
                needReformulateFlag.value = false;
                finishFlag.value = false;
                advice.value = "";
            },
            on: {
                NEXT: [
                    {
                        target: 'acting',
                        guard: () => subTaskSuccessFlag.value,
                        actions: () => {
                            // 更新subTasks
                            currentSubTaskIndex.value += 1;
                            layer.msg('Sub-task success!');
                        }
                    },
                    {
                        target: 'acting',
                        guard: () => needRetryFlag.value,
                        actions: () => {
                            layer.msg('Need retry the current sub-task!');
                        }
                    },
                    {
                        target: 'planing',
                        guard: () => needReformulateFlag.value,
                        actions: () => {
                            layer.msg('Need reformulate the task!');
                        }
                    },
                    {
                        target: 'end',
                        guard: () => finishFlag.value || currentSubTaskIndex.value == subTasks.value.length,
                        actions: () => {
                            layer.msg('End of the task!');
                        }
                    }
                ],
                RESET: { target: 'prepare' },
                CHANGE_STAGE_MANUALLY: { target: (context, event) => event.targetState },
            }
        },
        end: {
            entry: (context, event) => {
                stageIndex.value = 4;
                renderPrompt('end')
            },
            on: {
                RESET: { target: 'prepare' },
                CHANGE_STAGE_MANUALLY: { target: (context, event) => event.targetState },
            }
        }
    },
});

const { snapshot, send } = useMachine(Automaton);

function toNextState() {
    send({ type: 'NEXT' });
}

function resetAutomaton() {
    // 重置状态机
    send({ type: 'RESET' });
    layer.msg('Automaton reset!');
}

function changeStageManually(index) {
    // 手动切换状态
    // let stateName = stateNameMap[index]
    // layer.msg(`Change to stage ${stateName} Manually!`);
    // send({ type: 'CHANGE_STAGE_MANUALLY', targetState: stateName });
}

function updateStatusByAction(actions) {
    // 处理模型输出的动作序列，以更新状态机状态
    // 找到其中的PlanAction动作更新subTasks；
    // 找到其中的EvaluateSubTaskAction动作更新subTaskSuccessFlag, needRetryFlag, needReformulateFlag, finishFlag和advice。
    let hasNewPlans = false;
    for (let action of actions) {
        if (action instanceof PlanAction) {
            hasNewPlans = true;
            break;
        }
    }
    if (hasNewPlans) {
        subTasks.value = actions.filter(action => action instanceof PlanAction);
    }

    for (let action of actions) {
        if (action instanceof EvaluateSubTaskAction) {
            const situation = action.situation;
            advice.value = action.advice;
            if (situation === "sub_task_success") {
                subTaskSuccessFlag.value = true;
            } else if (situation === "need_retry") {
                needRetryFlag.value = true;
            } else if (situation === "need_reformulate") {
                needReformulateFlag.value = true;
            } else if (situation === "finish") {
                finishFlag.value = true;
            }
        }
    }
    if (autoTransitionFlag.value) {
        toNextState();
    }
}

bus.on('AfterRunActions', () => {
    updateStatusByAction(actionsList.value);
});

bus.on('NewEvaluateAction', (evaluateAction) => {
    console.log('Receive new evaluate action', evaluateAction);
    updateStatusByAction([evaluateAction]);
});

bus.on('ScreenSize', (data) => {
    // data { videoWidth: videoWidth, videoHeight: videoHeight }
    videoWidth.value = data.videoWidth;
    videoHeight.value = data.videoHeight;
    console.log(`Update screen size: ${videoWidth.value} x ${videoHeight.value}`);
});

</script>

<style></style>