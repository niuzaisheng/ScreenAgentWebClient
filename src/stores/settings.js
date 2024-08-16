import { defineStore } from 'pinia'

export const useSettingsStore = defineStore({
    id: 'settings',
    state: () => {
        return {
            vncPassword: '', // VNC Password

            selectedModel: 1,
            selectedModelName: 'gpt-4o',

            apiKey: 'YOUR_API', // OpenAI API Key

            selfServerBaseURL: 'http://localhost:8000', // Self Server Base URL
            selfServerModelName: 'Phi-3-vision-128k-instruct', // Self Server Model Name

            selectedOperatingSystem: 'win', // Operating System
            selectedPromptLanguage: 'en', // Prompt Language

            showTips: true, // Show Tips
        }
    },
    persist: {
        storage: localStorage,
        paths: ['vncPassword', 'selectedModel', 'selectedModelName', 'apiKey', 'selfServerBaseURL', 'selfServerModelName', 'selectedOperatingSystem', 'selectedPromptLanguage', 'showTips'],
    }
})