import { type AppState } from '../store/types';

export function saveState(store: AppState) {
    store.undoStack = [...store.undoStack, JSON.parse(JSON.stringify(store.palettes))];
    store.redoStack = [];
}

export function undo(store: AppState) {
    if (store.undoStack.length > 0) {
        store.redoStack = [...store.redoStack, JSON.parse(JSON.stringify(store.palettes))];
        const previousState = store.undoStack[store.undoStack.length - 1];
        store.palettes = previousState;
        store.undoStack = store.undoStack.slice(0, -1);
    }
}

export function redo(store: AppState) {
    if (store.redoStack.length > 0) {
        store.undoStack = [...store.undoStack, JSON.parse(JSON.stringify(store.palettes))];
        const nextState = store.redoStack[store.redoStack.length - 1];
        store.palettes = nextState;
        store.redoStack = store.redoStack.slice(0, -1);
    }
}
