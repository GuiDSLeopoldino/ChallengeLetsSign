import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from 'react-native';
import { View } from 'react-native';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="document-text-outline" size={48} color="#EC4899" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabBarActiveTintColor = '#EC4899';
  const tabBarInactiveTintColor = '#9CA3AF';
  const tabBarBackground = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        tabBarStyle: {
          backgroundColor: tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documentos',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pending"
        options={{
          title: 'Pendentes',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="signed"
        options={{
          title: 'Assinados',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}