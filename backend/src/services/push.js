const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPush(token, title, body) {
  if (!token || !Expo.isExpoPushToken(token)) return;
  try {
    await expo.sendPushNotificationsAsync([{ to: token, sound: 'default', title, body }]);
  } catch (error) {
    console.error('Push notification failed:', error);
  }
}

module.exports = { sendPush };
