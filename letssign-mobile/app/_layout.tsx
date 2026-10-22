import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' },
          }}
        >
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="dark" backgroundColor="#fff" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}