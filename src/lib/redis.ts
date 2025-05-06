import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Redis credentials are not properly configured')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Function to test Redis connection
export async function testConnection() {
  try {
    await redis.ping()
    console.log('Redis connection successful')
    return true
  } catch (error) {
    console.error('Redis connection failed:', error)
    return false
  }
}
