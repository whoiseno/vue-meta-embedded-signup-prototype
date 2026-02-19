<script lang="ts" setup>
import { onMounted } from 'vue'

declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: {
      init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
      login(
        callback: (response: {
          authResponse: {
            code?: string
            accessToken?: string
            userID: string
            expiresIn: number
            signedRequest: string
            data_access_expiration_time?: number
          } | null
          status: 'connected' | 'not_authorized' | 'unknown'
        }) => void,
        options?: {
          config_id?: string
          response_type?: 'code' | 'token'
          override_default_response_type?: boolean
          scope?: string
          extras?: Record<string, unknown>
        },
      ): void
    }
  }
}

const injectScript = (): Promise<void> => {
  if (document.getElementById('facebook-jssdk')) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = `https://connect.facebook.net/en_US/sdk.js`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'))
    const previousScript = document.getElementsByTagName('script')[0]
    if (previousScript && previousScript.parentNode) {
      previousScript.parentNode.insertBefore(script, previousScript)
    } else {
      document.head.appendChild(script)
    }
  })
}

const initFacebookSDK = (): Promise<void> => {
  return new Promise((resolve) => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: import.meta.env.VITE_FACEBOOK_GRAPH_API_VERSION || 'v25.0',
      })
      resolve()
    }
  })
}

async function useFacecookSDK() {
  try {
    if (!import.meta.env.VITE_FACEBOOK_APP_ID) {
      throw new Error('Facebook App ID is not configured.')
    }
    // load the facebook sdk
    await injectScript()
    // initialize the facebook sdk
    await initFacebookSDK()

    window.addEventListener('message', (event) => {
      if (!event.origin.endsWith('facebook.com')) return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('message event: ', data) // remove after testing
          // your code goes here
        }
      } catch {
        console.log('message event: ', event.data) // remove after testing
        // your code goes here
      }
    })
  } catch (error) {
    console.error('Error during Facebook signup:', error)
  }
}

onMounted(async () => {
  await useFacecookSDK()
})

const handleFacebookSignUp = () => {
  if (!window.FB) {
    console.error('Facebook SDK not initialized.')
    return
  }

  window.FB.login(
    (response) => {
      if (response.status === 'connected') {
        console.log('User logged in and authenticated:', response.authResponse)
        // Handle successful login here (e.g., send data to your server)
      } else {
        console.warn('User cancelled login or did not fully authorize.')
      }
    },
    {
      config_id: import.meta.env.VITE_FACEBOOK_CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
    },
  )
}
</script>

<template>
  <div>
    <button
      type="button"
      class="text-neutral-950 bg-neutral-100 hover:bg-neutral-200/90 focus:ring-4 focus:outline-none focus:ring-neutral-100/50 box-border border border-transparent font-medium leading-5 px-4 py-2.5 text-center inline-flex items-center justify-center rounded-md text-base"
      @click="handleFacebookSignUp"
    >
      <svg viewBox="0 0 666.667 666.667" class="size-6 me-2">
        <defs>
          <clipPath id="facebook_icon__a" clipPathUnits="userSpaceOnUse">
            <path d="M0 700h700V0H0Z" />
          </clipPath>
        </defs>
        <g clip-path="url(#facebook_icon__a)" transform="matrix(1.33333 0 0 -1.33333 -133.333 800)">
          <path
            d="M0 0c0 138.071-111.929 250-250 250S-500 138.071-500 0c0-117.245 80.715-215.622 189.606-242.638v166.242h-51.552V0h51.552v32.919c0 85.092 38.508 124.532 122.048 124.532 15.838 0 43.167-3.105 54.347-6.211V81.986c-5.901.621-16.149.932-28.882.932-40.993 0-56.832-15.528-56.832-55.9V0h81.659l-14.028-76.396h-67.631v-171.773C-95.927-233.218 0-127.818 0 0"
            style="fill: #0866ff; fill-opacity: 1; fill-rule: nonzero; stroke: none"
            transform="translate(600 350)"
          />
          <path
            d="m0 0 14.029 76.396H-67.63v27.019c0 40.372 15.838 55.899 56.831 55.899 12.733 0 22.981-.31 28.882-.931v69.253c-11.18 3.106-38.509 6.212-54.347 6.212-83.539 0-122.048-39.441-122.048-124.533V76.396h-51.552V0h51.552v-166.242a250.559 250.559 0 0 1 60.394-7.362c10.254 0 20.358.632 30.288 1.831V0Z"
            style="fill: #fff; fill-opacity: 1; fill-rule: nonzero; stroke: none"
            transform="translate(447.918 273.604)"
          />
        </g>
      </svg>
      Connect with Facebook
    </button>
  </div>
</template>
