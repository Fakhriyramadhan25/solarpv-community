// src/hooks.server.js
import { serialize } from 'cookie';

export async function handle({ event, resolve }) {
  // Access the __vercel_live_token cookie from the incoming request
  const vercelLiveToken = event.cookies.get('__vercel_live_token');

  // If you want to log or use the token, you can check its value here
  console.log('Vercel Live Token:', vercelLiveToken);

  // Get the response from the event
  const response = await resolve(event);

  // If the token is missing or invalid, you can choose to set a new cookie (if necessary)
  if (!vercelLiveToken) {
    // Set a default token value or generate your own value if required
    const defaultTokenValue = 'Edinburgher@2021';

    const cookieOptions = {
      path: '/',
      httpOnly: true,  // Cookie cannot be accessed via JavaScript
      secure: true,    // Cookie will only be sent over HTTPS
      sameSite: 'none' // Required for cross-site cookies
    };

    response.headers.set(
      'Set-Cookie',
      serialize('__vercel_live_token', defaultTokenValue, cookieOptions)
    );
  }

  // Return the modified response
  return response;
}
