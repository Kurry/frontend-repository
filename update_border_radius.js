const fs = require('fs');

function replaceFile(path, regex, replaceStr) {
    if(fs.existsSync(path)) {
        let text = fs.readFileSync(path, 'utf8');
        let updated = text.replace(regex, replaceStr);
        if(text !== updated) {
            fs.writeFileSync(path, updated);
            console.log("Updated", path);
        }
    }
}

replaceFile('tasks/frontend-productivity-scribblespace/solution/app/src/components/Toolbar.vue', /rounded-xl/g, 'rounded-[12px]');
replaceFile('tasks/frontend-productivity-scribblespace/solution/app/src/components/MiniMap.vue', /border-radius: 12px;/g, 'border-radius: 12px;');

replaceFile('tasks/frontend-productivity-scribblespace/solution/app/src/components/CanvasObject.vue', /rounded-lg/g, 'rounded-[8px]');
