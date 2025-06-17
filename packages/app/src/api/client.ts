import axios from 'axios'
import { Platform } from 'react-native'

const baseURL = Platform.select({
  web: process.env.NEXT_PUBLIC_API_URL,
  default: process.env.EXPO_PUBLIC_API_URL,
})

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for auth
api.interceptors.request.use((config) => {
  // Add auth token if available
  const token = Platform.select({
    web: localStorage.getItem('token'),
    default: null, // Use secure storage for mobile
  })
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
}) 