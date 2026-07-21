import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SEED_USERS, User, Role, Status } from '../data';

export interface UsersState { data: User[]; }
const initialState: UsersState = { data: SEED_USERS.map((u) => ({ ...u })) };

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (s, a: PayloadAction<User>) => { s.data.push(a.payload); },
    updateUser: (s, a: PayloadAction<User>) => {
      const i = s.data.findIndex((u) => u.id === a.payload.id);
      if (i >= 0) s.data[i] = a.payload;
    },
    patchUsers: (s, a: PayloadAction<{ ids: string[]; patch: Partial<User> }>) => {
      s.data.forEach((u) => { if (a.payload.ids.includes(u.id)) Object.assign(u, a.payload.patch); });
    },
    deleteUser: (s, a: PayloadAction<string>) => { s.data = s.data.filter((u) => u.id !== a.payload); },
    deleteUsers: (s, a: PayloadAction<string[]>) => { s.data = s.data.filter((u) => !a.payload.includes(u.id)); },
    updateUsersStatus: (s, a: PayloadAction<{ ids: string[]; status: Status }>) => {
      s.data.forEach((u) => { if (a.payload.ids.includes(u.id)) u.status = a.payload.status; });
    },
    updateUsersRole: (s, a: PayloadAction<{ ids: string[]; role: Role }>) => {
      s.data.forEach((u) => { if (a.payload.ids.includes(u.id)) u.role = a.payload.role; });
    },
    setUsers: (s, a: PayloadAction<User[]>) => { s.data = a.payload; },
    resetUsers: (s) => { s.data = SEED_USERS.map((u) => ({ ...u })); },
  },
});

export const {
  addUser, updateUser, patchUsers, deleteUser, deleteUsers,
  updateUsersStatus, updateUsersRole, setUsers, resetUsers,
} = usersSlice.actions;
export default usersSlice.reducer;
