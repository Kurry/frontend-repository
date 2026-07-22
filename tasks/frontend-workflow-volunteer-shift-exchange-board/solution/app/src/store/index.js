import { configureStore } from '@reduxjs/toolkit'
import rosterReducer from './rosterSlice'
import exchangeReducer from './exchangeSlice'

export const store = configureStore({
  reducer: {
    roster: rosterReducer,
    exchange: exchangeReducer
  }
})
