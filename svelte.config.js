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

import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as child_process from 'node:child_process';
import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    // adapter: adapter({
    //   out: 'build'
    // }),
    files: {
      assets: 'public', // Default is 'public', so this is usually not required
    },
    adapter: vercel(),
    prerender: {
      handleHttpError: ({ status, path, referrer, referenceType }) => {
        if (status === 404 && path === '/favicon.png') {
          console.warn(`Ignoring 404 error for missing favicon: ${path}`);
          return;8
        }
        throw new Error(`${status} on ${path} (referrer: ${referrer})`);
      }
    },

    // https://kit.svelte.dev/docs/configuration#version
    version: {
      name: child_process.execSync('git rev-parse HEAD').toString().trim(),
    },
  },
};

export default config;
