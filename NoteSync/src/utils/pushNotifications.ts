import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export function canRegisterForRemotePushNotifications(): boolean {
  if (Platform.OS === "web") {
    return false;
  }

  const executionEnvironment = Constants.executionEnvironment;
  const appOwnership = Constants.appOwnership;

  return !(
    Platform.OS === "android" &&
    (executionEnvironment === "storeClient" || appOwnership === "expo")
  );
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!canRegisterForRemotePushNotifications()) {
    return null;
  }

  try {
    const currentPermissions = await Notifications.getPermissionsAsync();
    let finalStatus = currentPermissions.status;

    if (finalStatus !== "granted") {
      const requestPermissions = await Notifications.requestPermissionsAsync();
      finalStatus = requestPermissions.status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId =
      (
        Constants.expoConfig?.extra as
          | { eas?: { projectId?: string } }
          | undefined
      )?.eas?.projectId ?? (Constants as any).easConfig?.projectId;

    if (!projectId) {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}
