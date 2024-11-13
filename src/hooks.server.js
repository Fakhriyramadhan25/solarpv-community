// src/hooks.server.js
import { serialize } from 'cookie';

export async function handle({ event, resolve }) {
  // Access the __vercel_live_token cookie from the incoming request (for debugging)
  const vercelLiveToken = event.cookies.get('__vercel_live_token');
  console.log('Current __vercel_live_token:', vercelLiveToken);

  // Get the response from the event
  const response = await resolve(event);

  // If no cookie is set, set it manually (fallback behavior)
  if (!vercelLiveToken) {
    const cookieOptions = {
      path: '/',
      httpOnly: true,   // Cookie cannot be accessed via JavaScript
      secure: true,     // Cookie will only be sent over HTTPS
      sameSite: 'none'  // Required for cross-site cookies
    };

    // Log to debug
    console.log('Setting __vercel_live_token cookie');

    // Set the cookie with a sample value (adjust this logic if necessary)
    response.headers.set(
      'Set-Cookie',
      serialize('__vercel_live_token', 'Edinburgher@2021', cookieOptions)
    );
  }

  return response;
}
