const fs = require('fs');

let indexHtml = fs.readFileSync('tasks/frontend-creative-tools-terminal-portfolio/solution/app/index.html', 'utf8');
let appJs = fs.readFileSync('tasks/frontend-creative-tools-terminal-portfolio/solution/app/assets/app.js', 'utf8');

// A11y patch ended up doing <label class="form-control"><label for="...">...
// We just want to replace <label class="form-control"> with <div class="form-control">
appJs = appJs.replace(/<label class="form-control">/g, '<div class="form-control">');
appJs = appJs.replace(/<\/label>\n\s*<input/g, '</label>\n                <input');
appJs = appJs.replace(/<\/label>\n\s*<textarea/g, '</label>\n                <textarea');
appJs = appJs.replace(/<\/label>\n\s*<select/g, '</label>\n                <select');

appJs = appJs.replace(/<label class="cursor-pointer label">/g, '<div class="cursor-pointer label">');
// Since it matches `<label class="label-text" for="cp-featured">Featured</label>` and `</label>`
// Let's manually replace the remaining closing tags:
appJs = appJs.replace(
    /<\/label>\n\s*<button type="submit"/,
    '</div>\n              <button type="submit"'
);

// We need to fix the end tags for form controls.
appJs = appJs.replace(/<input type="text" id="cp-name" class="input input-sm input-bordered" required minlength="1" maxlength="80">\n\s*<\/label>/, '<input type="text" id="cp-name" class="input input-sm input-bordered" required minlength="1" maxlength="80">\n              </div>');
appJs = appJs.replace(/<input type="text" id="cp-slug" class="input input-sm input-bordered" required pattern="\^\[a-z0-9\]\+\(?\:-\[a-z0-9\]\+\)\*\$" maxlength="48">\n\s*<\/label>/, '<input type="text" id="cp-slug" class="input input-sm input-bordered" required pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" maxlength="48">\n              </div>');
appJs = appJs.replace(/<textarea id="cp-summary" class="textarea textarea-sm textarea-bordered" required minlength="1" maxlength="280"><\/textarea>\n\s*<\/label>/, '<textarea id="cp-summary" class="textarea textarea-sm textarea-bordered" required minlength="1" maxlength="280"></textarea>\n              </div>');
appJs = appJs.replace(/<\/select>\n\s*<\/label>/, '</select>\n              </div>');
appJs = appJs.replace(/<input type="number" id="cp-year" class="input input-sm input-bordered" required min="2000" max="2100" value="2024">\n\s*<\/label>/, '<input type="number" id="cp-year" class="input input-sm input-bordered" required min="2000" max="2100" value="2024">\n              </div>');
appJs = appJs.replace(/<input type="checkbox" id="cp-featured" class="checkbox checkbox-sm" \/>\n\s*<\/label>/, '<input type="checkbox" id="cp-featured" class="checkbox checkbox-sm" />\n              </div>');


fs.writeFileSync('tasks/frontend-creative-tools-terminal-portfolio/solution/app/assets/app.js', appJs);

console.log("Labels fixed");
