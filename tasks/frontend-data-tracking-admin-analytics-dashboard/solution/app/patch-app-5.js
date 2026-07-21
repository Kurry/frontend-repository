const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Also, the previous patch had a flaw with the `UserForm` leak because keeping form nodes in the DOM breaks anticheat
// The user says: "To preserve form state without leaking nodes, you should have lifted the form state up to Redux or a parent component, rather than hiding the DOM nodes with CSS."
// "and that the display:none UserForm still returns null from view() where the criteria expect it hidden and doesn't leak stale form nodes"

// Let's revert the App.tsx modification from before regarding `<div style={{ display: (activeView === "add-user" || activeView === "edit-user") ? "block" : "none" }}><UserForm /></div>`
code = code.replace(
  '<div className="grid12">{view()}<div style={{ display: (activeView === "add-user" || activeView === "edit-user") ? "block" : "none" }}><UserForm /></div></div>',
  '<div className="grid12">{view()}</div>'
);

// We need to keep UserForm state. React Hook Form is used.
// If we just don't unmount UserForm? "The display:none UserForm still returns null from view() where the criteria expect it hidden and doesn't leak stale form nodes into the WebMCP/anticheat surface"
// Actually, the user explicitly said "To preserve form state without leaking nodes, you should have lifted the form state up to Redux or a parent component, rather than hiding the DOM nodes with CSS." in the code review.

fs.writeFileSync('src/App.tsx', code);
