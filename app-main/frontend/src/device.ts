import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY = "qisas_device_id";

function makeId() {
  return "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(KEY);
    if (existing) return existing;
    const id = makeId();
    await AsyncStorage.setItem(KEY, id);
    return id;
  } catch {
    // Fallback for edge cases
    return Platform.OS + "_" + makeId();
  }
}
