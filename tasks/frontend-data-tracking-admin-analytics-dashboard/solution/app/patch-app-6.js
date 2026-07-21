const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I need to change the `view()` function back to returning `<UserForm />` for add-user and edit-user
let newViewFunc = `  const view = () => {
    switch (activeView) {
      case 'all-users': return <AllUsers />;
      case 'add-user': case 'edit-user': return <UserForm />;
      case 'roles': return <ExtraView title="Roles" kind="roles" />;
      case 'permissions': return <ExtraView title="Permissions" kind="permissions" />;
      case 'user-logs': return <ExtraView title="User Logs" kind="logs" />;
      case 'user-stats': return <ExtraView title="User Stats" kind="stats" />;
      case 'user-payments': return <ExtraView title="User Payments" kind="payments" />;
      case 'user-products': return <ExtraView title="User Products" kind="products" />;
      default: return <Overview />;
    }
  };`;

code = code.replace(/  const view = \(\) => {[\s\S]*?  };/, newViewFunc);

fs.writeFileSync('src/App.tsx', code);
