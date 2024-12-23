/*
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

			https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

 import { defineConfig } from 'vitest/config';
 import { sveltekit } from '@sveltejs/kit/vite';
 
 
 export default defineConfig({
   plugins: [
     sveltekit(),
     {
       name: 'kml-mime-type',
       configureServer(server) {
         server.middlewares.use((req, res, next) => {
           // Cast `req` to ensure TypeScript knows `url` exists
           const request = req as IncomingMessage & { url: string };
 
           if (request.url?.endsWith('.kml')) {
             res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
           }
           next();
         });
       },
     },
   ],
   test: {
     include: ['src/**/*.{test,spec}.{js,ts}'],
   },
 });
 