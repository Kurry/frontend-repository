const { sortUsers, SEED_USERS } = require('./src/data.ts');
console.log(SEED_USERS.map(u => u.firstName));
const sortedName = sortUsers(SEED_USERS, 'name-az');
console.log("NAME-AZ:", sortedName.map(u => u.firstName));
const sortedNew = sortUsers(SEED_USERS, 'newest');
console.log("NEWEST:", sortedNew.map(u => u.firstName));
