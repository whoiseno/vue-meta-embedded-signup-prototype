<script setup lang="ts">
import FacebookIcon from './FacebookIcon.vue'
import { computed } from 'vue'
import { useFacebookSDK } from '@/composable/use-facebook-sdk-v2'

const { FB, isReady, isLoading, error } = useFacebookSDK()

interface Props {
  configId?: string
  buttonLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  configId: import.meta.env.VITE_META_CONFIG_ID,
  buttonLabel: 'Connect WhatsApp Business',
})

// ── Emits ──────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  /** Fired when the user completes the signup flow. */
  success: [response: { code: string; wabaId?: string; phoneNumberId?: string }]
  /** Fired when the user cancels or the popup is closed without completing. */
  cancel: [currentStep?: string]
  /** Fired on any SDK or flow error. */
  error: [err: Error]
}>()

// ── State ──────────────────────────────────────────────────────────────────────

const isDisabled = computed(() => !isReady.value || isLoading.value)

const buttonLabel = computed(() => {
  if (isLoading.value) return 'Loading SDK…'
  if (!isReady.value) return 'Unavailable'
  return props.buttonLabel
})

// ── Message event listener ─────────────────────────────────────────────────────
// Meta fires a `message` event during the flow containing WABA + phone number IDs.
// Must be registered before FB.login() is called.

interface EmbeddedSignupMessageData {
  type: 'WA_EMBEDDED_SIGNUP'
  event: 'FINISH' | 'CANCEL' | 'ERROR'
  data: {
    phone_number_id?: string
    waba_id?: string
    current_step?: string
  }
  version: string
}

let _sessionData: Pick<EmbeddedSignupMessageData['data'], 'phone_number_id' | 'waba_id'> = {}

function _onMessage(event: MessageEvent): void {
  // if (event.origin !== 'https://www.facebook.com') return
  console.log('Received message event:', event)
  try {
    const payload: EmbeddedSignupMessageData =
      typeof event.data === 'string' ? JSON.parse(event.data) : event.data

    if (payload.type !== 'WA_EMBEDDED_SIGNUP') return

    if (payload.event === 'FINISH') {
      _sessionData = {
        phone_number_id: payload.data.phone_number_id,
        waba_id: payload.data.waba_id,
      }
    }

    if (payload.event === 'CANCEL' || payload.event === 'ERROR') {
      emit('cancel', payload.data.current_step)
    }
  } catch {
    // Ignore non-JSON messages from facebook.com (e.g. internal SDK frames)
  }
}

function launchSignup(): void {
  if (!FB.value || !isReady.value) return
  console.log('Launching Facebook Embedded SignUp flow with config ID:', props.configId)
  _sessionData = {}
  window.addEventListener('message', _onMessage)

  FB.value.login(
    (response) => {
      window.removeEventListener('message', _onMessage)

      if (!response.authResponse) {
        // User closed the popup without completing
        emit('cancel')
        return
      }

      const { code, accessToken } = response.authResponse

      if (!code && !accessToken) {
        emit('error', new Error('[SignupLauncher] No auth code or token in FB.login() response.'))
        return
      }

      emit('success', {
        // code is present when response_type: 'code' (recommended)
        code: (code ?? accessToken)!,
        wabaId: _sessionData.waba_id,
        phoneNumberId: _sessionData.phone_number_id,
      })
    },
    {
      config_id: props.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: '3', // Required to receive the message event with WABA + phone IDs
      },
    },
  )
}
</script>

<template>
  <div class="flex flex-col items-center gap-y-8">
    <button
      type="button"
      class="focus-visible:border-blue-500 focus-visible:ring-blue-500/50 rounded-md border border-transparent bg-clip-padding text-base font-medium focus-visible:ring-3 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none select-none bg-neutral-200 text-neutral-900 hover:bg-neutral-200/80 h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3"
      :disabled="isDisabled"
      :aria-busy="isLoading"
      :aria-label="buttonLabel"
      @click="launchSignup"
    >
      <FacebookIcon /> {{ buttonLabel }}
    </button>
    <p v-if="error" class="text-sm font-medium text-rose-400" role="alert">
      {{ error.message }}
    </p>
  </div>
</template>
