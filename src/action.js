
import * as KeyboardUtil from "@novnc/novnc/core/input/util.js";

import { reverseDOMKeyTable } from "@novnc/novnc/core/input/domkeytable.js";


class Position {
    constructor(width = null, height = null) {
        this.width = width;
        this.height = height;
    }

    toString() {
        return `(${this.width}, ${this.height})`;
    }
}

class ClickableArea {
    // upper_left_position, lower_right_position
    constructor(upperLeftPosition = null, lowerRightPosition = null) {
        this.upperLeftPosition = upperLeftPosition;
        this.lowerRightPosition = lowerRightPosition;
    }
    getCenterPosition() {
        return new Position(
            (this.upperLeftPosition.width + this.lowerRightPosition.width) / 2,
            (this.upperLeftPosition.height + this.lowerRightPosition.height) / 2
        );
    }
    fromJson(jsonDict) {
        return new ClickableArea(
            Position.fromJson(jsonDict.upperLeftPosition.width, jsonDict.upperLeftPosition.height),
            Position.fromJson(jsonDict.lowerRightPosition.width, jsonDict.lowerRightPosition.height)
        );
    }
    toString() {
        return `(${this.upperLeftPosition.width}, ${this.upperLeftPosition.height}) - (${this.lowerRightPosition.width}, ${this.lowerRightPosition.height})`;
    }
}

function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

let ActionClasses;


class Action {
    static className = 'Action';
    static get baseAttributes() {
        return ["actionTime", "beforeActionObs", "afterActionObs"];
    }

    constructor(kwargs = {}) {
        this.baseAttributes = Action.baseAttributes;
        this.actionTime = kwargs.actionTime;
        this.beforeActionObs = kwargs.beforeActionObs;
        this.afterActionObs = kwargs.afterActionObs;
    }

    get actionType() {
        return this.constructor.className;
    }

    async step(rfb) {
        // This method should be overridden in subclasses
        throw new Error('You have to implement the method step!');
    }

    saveAction() {
        let dic = {};
        for (let attr of this.saveAttributes) {
            dic[attr] = this[attr];
        }
        dic["actionType"] = this.actionType;
        return dic;
    }

    toString() {
        let attrs = [];
        for (let attr of this.saveAttributes) {
            let value = this[attr];
            if (attr in ["beforeActionObs", "afterActionObs"]) {
                continue;
            } else {
                attrs.push(`${attr}="${value}"`);
            }
        }
        return `${this.actionType}(${attrs.join(', ')})`;
    }

    toIdealDictFormat() {
        let dic = {};
        dic["actionType"] = this.actionType;
        return dic;
    }

    toIdealDisplayFormat() {
        let attrs = [];
        for (let attr of this.saveAttributes) {
            if (attr in this.baseAttributes) {
                continue;
            }
            let value = this[attr];
            if (value) {
                attrs.push(`${attr}=${value}`);
            }
        }
        return `${this.actionType}(${attrs.join(', ')})`;
    }

    static fromJson(jsonDict) {
        const actionType = jsonDict["action_type"];
        if (!actionType) {
            return null;
        }

        const ActionClass = ActionClasses[actionType];
        if (!ActionClass) {
            return null;
        }

        delete jsonDict["action_type"];

        // 将jsonDict中的下划线转换为驼峰
        let camelCaseDict = {};
        for (let key in jsonDict) {
            camelCaseDict[toCamelCase(key)] = jsonDict[key];
        }

        const action = new ActionClass(camelCaseDict);
        return action;
    }
}

const MouseActionType = {
    down: 0,
    up: 1,
    scrollUp: 2,
    scrollDown: 3,
    move: 4,
    drag: 5,
    click: 6,
    doubleClick: 7
};

const MouseButton = {
    left: 0,
    middle: 1,
    right: 2
};

class MouseAction extends Action {
    static className = 'MouseAction';

    static get saveAttributes() {
        return ["mouseActionType", "mouseButton", "mousePosition", "scrollRepeat", "clickableArea"];
    }

    constructor(kwargs = {}) {
        super(kwargs);
        this.saveAttributes = MouseAction.saveAttributes;
        this.mouseActionType = kwargs.mouseActionType;
        if (typeof kwargs.mouseActionType === 'string') {
            this.mouseActionType = MouseActionType[kwargs.mouseActionType.toLowerCase()];
        }
        this.mouseButton = kwargs.mouseButton;
        if (typeof kwargs.mouseButton === 'string') {
            this.mouseButton = MouseButton[kwargs.mouseButton.toLowerCase()];
        }
        this.mousePosition = kwargs.mousePosition;
        this.dragStartPosition = kwargs.dragStartPosition;
        this.dragEndPosition = kwargs.dragEndPosition;
        this.scrollRepeat = kwargs.scrollRepeat;
        this.clickableArea = kwargs.clickableArea;
    }

    _mouseButtonToMask() {
        switch (this.mouseButton) {
            case MouseButton.left:
                return 1;
            case MouseButton.middle:
                return 2;
            case MouseButton.right:
                return 4;
            default:
                throw new Error('Invalid mouseButton');
        }
    }

    async step(rfb) {
        // rfb._sendMouse(x, y, mask)

        let x = this.mousePosition.width;
        let y = this.mousePosition.height;

        switch (this.mouseActionType) {
            case MouseActionType.down:
                rfb._sendMouse(x, y, this._mouseButtonToMask());
                break;
            case MouseActionType.up:
                rfb._sendMouse(x, y, 0);
                break;
            case MouseActionType.scrollUp:
                rfb._sendMouse(x, y, 16);
                rfb._sendMouse(x, y, 0);
                break;
            case MouseActionType.scrollDown:
                rfb._sendMouse(x, y, 8);
                rfb._sendMouse(x, y, 0);
                break;
            case MouseActionType.move:
                rfb._sendMouse(x, y, 0);
                break;
            case MouseActionType.drag:
                rfb._sendMouse(this.dragStartPosition.width, this.dragStartPosition.height, this._mouseButtonToMask());
                rfb._sendMouse(this.dragEndPosition.width, this.dragEndPosition.height, this._mouseButtonToMask());
                rfb._sendMouse(this.dragEndPosition.width, this.dragEndPosition.height, 0);
                break;
            case MouseActionType.click:
                rfb._sendMouse(x, y, this._mouseButtonToMask());
                rfb._sendMouse(x, y, 0);
                break;
            case MouseActionType.doubleClick:
                rfb._sendMouse(x, y, this._mouseButtonToMask());
                rfb._sendMouse(x, y, 0);
                rfb._sendMouse(x, y, this._mouseButtonToMask());
                rfb._sendMouse(x, y, 0);
                break;
            default:
                throw new Error('Invalid mouseActionType');
        }
    }
}


const KeyboardActionType = {
    down: 0,
    up: 1,
    press: 2,
    text: 3
};


const keysymExternalNameMap = {
    0x0030: "0",
    0x0031: "1",
    0x0032: "2",
    0x0033: "3",
    0x0034: "4",
    0x0035: "5",
    0x0036: "6",
    0x0037: "7",
    0x0038: "8",
    0x0039: "9",

    0x0041: "A",
    0x0042: "B",
    0x0043: "C",
    0x0044: "D",
    0x0045: "E",
    0x0046: "F",
    0x0047: "G",
    0x0048: "H",
    0x0049: "I",
    0x004a: "J",
    0x004b: "K",
    0x004c: "L",
    0x004d: "M",
    0x004e: "N",
    0x004f: "O",
    0x0050: "P",
    0x0051: "Q",
    0x0052: "R",
    0x0053: "S",
    0x0054: "T",
    0x0055: "U",
    0x0056: "V",
    0x0057: "W",
    0x0058: "X",
    0x0059: "Y",
    0x005a: "Z",

    0x0061: "a",
    0x0062: "b",
    0x0063: "c",
    0x0064: "d",
    0x0065: "e",
    0x0066: "f",
    0x0067: "g",
    0x0068: "h",
    0x0069: "i",
    0x006a: "j",
    0x006b: "k",
    0x006c: "l",
    0x006d: "m",
    0x006e: "n",
    0x006f: "o",
    0x0070: "p",
    0x0071: "q",
    0x0072: "r",
    0x0073: "s",
    0x0074: "t",
    0x0075: "u",
    0x0076: "v",
    0x0077: "w",
    0x0078: "x",
    0x0079: "y",
    0x007a: "z",
}

class KeyboardAction extends Action {
    static className = 'KeyboardAction';

    static get saveAttributes() {
        return ["keyboardActionType", "keyboardKey", "keyboardText"];
    }

    static standardisedKeyName(key) {
        const validKeysymdefLowerMap = {
            "win": "Meta",
            "windows": "Meta",
            "windowskey": "Meta",
            "windows key": "Meta",
            "Windows key": "Meta",
            "winkey": "Meta",
            "ctrl": "Control",
            "alt": "Alt",
            "shift": "Shift",
            "tab": "Tab",
            "return": "Enter",
            "enter": "Enter",
            "esc": "Escape",
            "backspace": "BackSpace",
            "delete": "Delete",
            "up": "Up",
            "down": "Down",
            "printscreen": "PrintScreen",
            "prtscn": "PrintScreen",
            " ": "Space",
        };

        if (key.toLowerCase() in validKeysymdefLowerMap) {
            return validKeysymdefLowerMap[key.toLowerCase()];
        } else {
            return key;
        }
    }


    static getKeysymName(keysym) {
        let keyName = reverseDOMKeyTable[keysym];
        if (keyName) {
            return keyName;
        }

        // If the key is not in the DOMKeyTable, try to get the key name from the keysymExternalNameMap
        // keysym is integer
        keyName = keysymExternalNameMap[keysym];
        if (keyName) {
            return keyName;
        }

        return "Unidentified";
    }

    constructor(kwargs = {}) {
        super(kwargs);
        this.saveAttributes = KeyboardAction.saveAttributes;
        this.keyboardActionType = kwargs.keyboardActionType;
        if (typeof kwargs.keyboardActionType === 'string') {
            this.keyboardActionType = KeyboardActionType[kwargs.keyboardActionType.toLowerCase()];
        }
        this.keyboardKey = kwargs.keyboardKey;
        this.keyboardText = kwargs.keyboardText;

        // Check if it's a combination key
        this._isCombinationKey = false;
        // if this.keyboardKey is not undefined and contains '+', then it's a combination key
        if (this.keyboardKey) {
            if (this.keyboardKey.includes('+')) {
                this._isCombinationKey = true;
                let keyboardKeyList = this.keyboardKey.split('+');
                this.keyboardKey = [];
                for (let key of keyboardKeyList) {
                    this.keyboardKey.push(KeyboardAction.standardisedKeyName(key));
                }
            } else {
                this._isCombinationKey = false;
                this.keyboardKey = KeyboardAction.standardisedKeyName(this.keyboardKey);
            }
        }
    }

    sendKey(rfb, keyboardKey, down) {
        let evt = {
            key: keyboardKey,
        };
        let keysym = KeyboardUtil.getKeysym(evt);
        // let code = KeyboardUtil.getKeycode(evt);
        rfb.sendKey(keysym, null, down);
    }

    async step(rfb) {
        if (this._isCombinationKey) {
            for (let key of this.keyboardKey) {
                this.sendKey(rfb, key, true);
            }
            for (let key of this.keyboardKey) {
                this.sendKey(rfb, key, false);
            }
        } else {
            switch (this.keyboardActionType) {
                case KeyboardActionType.down:
                    this.sendKey(rfb, this.keyboardKey, true);
                    break;
                case KeyboardActionType.up:
                    this.sendKey(rfb, this.keyboardKey, false);
                    break;
                case KeyboardActionType.press:
                    this.sendKey(rfb, this.keyboardKey, true);
                    this.sendKey(rfb, this.keyboardKey, false);
                    break;
                case KeyboardActionType.text:
                    // 通过连续按键来输入文本
                    for (let char of this.keyboardText) {
                        this.sendKey(rfb, char, true);
                        this.sendKey(rfb, char, false);
                    }
                    break;
                default:
                    throw new Error('Invalid keyboardActionType');
            }
        }
    }
}


class WaitAction extends Action {
    static className = 'WaitAction';
    static get saveAttributes() {
        return ["waitTime"];
    }

    constructor(kwargs = {}) {
        super(kwargs);
        this.saveAttributes = WaitAction.saveAttributes;
        this.waitTime = kwargs.waitTime;
    }

    async step(rfb) {
        return new Promise(resolve => setTimeout(resolve, this.waitTime));
    }
}


class PlanAction extends Action {
    static className = 'PlanAction';
    static get saveAttributes() {
        return ["element"];
    }

    constructor(kwargs = {}) {
        super(kwargs);
        this.saveAttributes = PlanAction.saveAttributes;
        this.element = kwargs.element;
    }

    async step(rfb) {
        return;
    }
}

class EvaluateSubTaskAction extends Action {
    static className = 'EvaluateSubTaskAction';
    static get saveAttributes() {
        return ["situation", "advice"];
    }

    constructor(kwargs = {}) {
        super(kwargs);
        this.saveAttributes = EvaluateSubTaskAction.saveAttributes;
        this.situation = kwargs.situation;
        this.advice = kwargs.advice;
    }

    async step(rfb) {
        return;
    }

}

function parseActionsFromText(text) {
    // Regular expression to find JSON strings and arrays
    const regex = /{.*?}|\[.*?\]/gs;

    // Find all possible JSON strings and arrays in the text
    const possibleJsons = text.match(regex);

    // If no possible JSON strings were found, throw an error or return a specific value
    if (!possibleJsons) {
        return null;
    }

    // Initialize an empty array to hold the actions
    let actions = [];

    // Try to parse each JSON string or array and convert it into an Action
    for (const possibleJson of possibleJsons) {
        try {
            // Check if the possibleJson is an array
            if (possibleJson.startsWith('[') && possibleJson.endsWith(']')) {
                // Parse the JSON string as an array
                const jsonArray = JSON.parse(possibleJson);

                // Convert each JSON object in the array into an Action
                for (const jsonDict of jsonArray) {
                    const action = Action.fromJson(jsonDict);
                    if (action) {
                        actions.push(action);
                    }
                }
            } else {
                // Parse the JSON string as an object
                const jsonDict = JSON.parse(possibleJson);
                const action = Action.fromJson(jsonDict);
                if (action) {
                    actions.push(action);
                }
            }
        } catch (error) {
            // Ignore errors and try the next JSON string or array
        }
    }

    // Return the array of actions
    return actions;
}


ActionClasses = {
    "MouseAction": MouseAction,
    "KeyboardAction": KeyboardAction,
    "WaitAction": WaitAction,
    "PlanAction": PlanAction,
    "EvaluateSubTaskAction": EvaluateSubTaskAction
};

export { Position, ClickableArea, Action, MouseAction, MouseButton, MouseActionType, KeyboardAction, KeyboardActionType, WaitAction, PlanAction, EvaluateSubTaskAction, parseActionsFromText };
