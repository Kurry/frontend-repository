import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  status: 'Active' | 'Invited' | 'Suspended';
  role: string;
  payments: number;
  products: number;
  lastActive: string;
}

const initialUsers: User[] = [
  { id: '1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', status: 'Active', role: 'Admin', payments: 1200, products: 4, lastActive: new Date().toISOString() },
  { id: '2', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', status: 'Active', role: 'User', payments: 300, products: 1, lastActive: new Date().toISOString() },
  { id: '3', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', status: 'Suspended', role: 'User', payments: 0, products: 0, lastActive: new Date().toISOString() },
  { id: '4', firstName: 'Diana', lastName: 'Prince', email: 'diana@example.com', status: 'Active', role: 'Manager', payments: 4500, products: 8, lastActive: new Date().toISOString() },
  { id: '5', firstName: 'Evan', lastName: 'Wright', email: 'evan@example.com', status: 'Invited', role: 'User', payments: 0, products: 0, lastActive: new Date().toISOString() },
  { id: '6', firstName: 'Fiona', lastName: 'Gallagher', email: 'fiona@example.com', status: 'Active', role: 'User', payments: 150, products: 2, lastActive: new Date().toISOString() },
  { id: '7', firstName: 'George', lastName: 'Costanza', email: 'george@example.com', status: 'Suspended', role: 'User', payments: 20, products: 1, lastActive: new Date().toISOString() },
  { id: '8', firstName: 'Hannah', lastName: 'Abbott', email: 'hannah@example.com', status: 'Active', role: 'Manager', payments: 800, products: 3, lastActive: new Date().toISOString() },
];

export const usersSlice = createSlice({
  name: 'users',
  initialState: {
    data: initialUsers,
  },
  reducers: {
    addUser: (state, action: PayloadAction<User>) => {
      state.data.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.data.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.data = state.data.filter(u => u.id !== action.payload);
    },
    deleteUsers: (state, action: PayloadAction<string[]>) => {
      state.data = state.data.filter(u => !action.payload.includes(u.id));
    },
    updateUsersStatus: (state, action: PayloadAction<{ ids: string[], status: User['status'] }>) => {
      state.data.forEach(u => {
        if (action.payload.ids.includes(u.id)) {
          u.status = action.payload.status;
        }
      });
    },
    updateUsersRole: (state, action: PayloadAction<{ ids: string[], role: string }>) => {
      state.data.forEach(u => {
        if (action.payload.ids.includes(u.id)) {
          u.role = action.payload.role;
        }
      });
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.data = action.payload;
    }
  },
});

export const { addUser, updateUser, deleteUser, deleteUsers, updateUsersStatus, updateUsersRole, setUsers } = usersSlice.actions;
export default usersSlice.reducer;
