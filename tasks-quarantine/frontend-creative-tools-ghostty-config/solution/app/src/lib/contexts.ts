import {createContext} from "svelte";
import type {SettingInfo} from "./settings/types";


// Only the display-facing fields are shared with child components, not the config-key metadata (`key`, `default`, `repeatable`) or the widget def.
// `labelId` names the visible label; `controlId` is the id of the primary labelable control so
// the setting name can be a real <label for> association, not just aria-labelledby.
export const [getSetting, setSetting] = createContext<Omit<SettingInfo, "key" | "default" | "repeatable" | "widget"> & {labelId?: string; controlId?: string; settingKey?: string}>();
