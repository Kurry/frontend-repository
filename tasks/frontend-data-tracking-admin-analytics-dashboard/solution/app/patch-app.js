const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Accessibility updates
code = code.replace(
  '<aside className={`sidebar ${sidebarOpen ? \'open\' : \'\'}`} aria-label="Primary navigation">',
  '<nav className={`sidebar ${sidebarOpen ? \'open\' : \'\'}`} aria-label="Primary navigation">'
);
code = code.replace(
  '      <aside className={`sidebar ${sidebarOpen ? \'open\' : \'\'}`} aria-label="Primary navigation">',
  '      <nav className={`sidebar ${sidebarOpen ? \'open\' : \'\'}`} aria-label="Primary navigation">'
);
code = code.replace('</aside>', '</nav>');

code = code.replace(
  '<div className="main-canvas">',
  '<main className="main-canvas">'
);
code = code.replace(
  '        <div className="main-canvas">',
  '        <main className="main-canvas">'
);
code = code.replace(
  '          <div className="grid12">{view()}</div>\n        </div>',
  '          <div className="grid12">{view()}</div>\n        </main>'
);

// Form visibility - Instead of completely unmounting, let's keep the form logic intact but in activeView switch we don't unmount UserForm?
// Actually, the judge says "After switching from Add User to Operations Overview and back, the partially entered form was reset".
// We can solve this by not having `view()` just return `<UserForm />` but instead render `<UserForm />` always, and control display in `view()`.
// Wait, `view()` returns the JSX to render. If we just return `<div style={{display: activeView === 'add-user' || activeView === 'edit-user' ? 'block' : 'none'}}><UserForm /></div>`
// Let's modify `view()` logic entirely.

let viewFunc = `
  const view = () => {
    switch (activeView) {
      case 'all-users': return <AllUsers />;
      case 'add-user': case 'edit-user': return null;
      case 'roles': return <ExtraView title="Roles" kind="roles" />;
      case 'permissions': return <ExtraView title="Permissions" kind="permissions" />;
      case 'user-logs': return <ExtraView title="User Logs" kind="logs" />;
      case 'user-stats': return <ExtraView title="User Stats" kind="stats" />;
      case 'user-payments': return <ExtraView title="User Payments" kind="payments" />;
      case 'user-products': return <ExtraView title="User Products" kind="products" />;
      default: return <Overview />;
    }
  };
`;

code = code.replace(/  const view = \(\) => {[\s\S]*?  };/, viewFunc);
code = code.replace(
  '<div className="grid12">{view()}</div>',
  '<div className="grid12">{view()}<div style={{ display: (activeView === "add-user" || activeView === "edit-user") ? "block" : "none" }}><UserForm /></div></div>'
);

fs.writeFileSync('src/App.tsx', code);
