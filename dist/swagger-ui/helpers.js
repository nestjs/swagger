"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildJSInitOptions = buildJSInitOptions;
function buildJSInitOptions(initOptions) {
    const functionPlaceholder = '____FUNCTION_PLACEHOLDER____';
    const fns = [];
    let json = JSON.stringify(initOptions, (key, value) => {
        if (typeof value === 'function') {
            fns.push(value);
            return functionPlaceholder;
        }
        return value;
    }, 2);
    json = json.replace(new RegExp('"' + functionPlaceholder + '"', 'g'), () => fns.shift());
    return `let options = ${json};`;
}
