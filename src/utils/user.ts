import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const DEVICE_ID_KEY = "@mausam_device_id";
const USER_ID_KEY = "@mausam_user_id";

const API_BASE_URL = "http://192.168.29.129:5000";

export async function getOrCreateDeviceId(): Promise<string> {
  const existingId = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (existingId) {
    return existingId;
  }

  const newId = Crypto.randomUUID();

  await AsyncStorage.setItem(
    DEVICE_ID_KEY,
    newId
  );

  return newId;
}

export async function registerOrGetUser(): Promise<{
  id: number;
  device_id: string;
  name: string | null;
  email: string | null;
}> {
  const deviceId = await getOrCreateDeviceId();

  const response = await fetch(
    `${API_BASE_URL}/api/user`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `User API failed with status ${response.status}`
    );
  }

  const data = await response.json();

  if (
    !data.success ||
    !data.user ||
    typeof data.user.id !== "number"
  ) {
    throw new Error(
      "Invalid user response from server."
    );
  }

  await AsyncStorage.setItem(
    USER_ID_KEY,
    String(data.user.id)
  );

  return data.user;
}

export async function getStoredUserId(): Promise<number | null> {
  const value =
    await AsyncStorage.getItem(USER_ID_KEY);

  if (!value) {
    return null;
  }

  const userId = Number(value);

  return Number.isFinite(userId)
    ? userId
    : null;
}