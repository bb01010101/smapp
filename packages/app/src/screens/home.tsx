import { View, Text, Platform } from 'react-native'
import { styled } from 'nativewind'

const StyledView = styled(View)
const StyledText = styled(Text)

export function HomeScreen() {
  return (
    <StyledView className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <StyledText className="text-xl font-bold text-gray-900 dark:text-white">
        Welcome to {Platform.OS === 'web' ? 'Web' : 'Mobile'} App
      </StyledText>
      <StyledText className="mt-2 text-gray-600 dark:text-gray-400">
        This is a shared screen component
      </StyledText>
    </StyledView>
  )
} 