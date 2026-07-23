const fs = require('fs');
const file = 'tasks/frontend-creative-tools-shapeshift-grid/solution/app/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// remove unreachable code in armClear
content = content.replace(
`  function armClear() {
    clearBoard(); return;
    setConfirmClear(true);
    clearTimeout(clearArmTimer);
    clearArmTimer = setTimeout(() => setConfirmClear(false), 2600);
  }`,
`  function armClear() {
    clearBoard();
  }`
);

// remove unreachable code in armDelete
content = content.replace(
`    const armDelete = () => {
      removeBoard(props.board.name, true); return;
      setConfirming(true);
      clearTimeout(confirmTimer);
      confirmTimer = setTimeout(() => setConfirming(false), 2600);
    };`,
`    const armDelete = () => {
      removeBoard(props.board.name, true);
    };`
);

fs.writeFileSync(file, content);
