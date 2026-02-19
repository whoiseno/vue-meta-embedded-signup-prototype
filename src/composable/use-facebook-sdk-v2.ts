/**
 * useFacebookSDK.ts
 *
 * Composable responsible for loading and initialising the Facebook JS SDK.
 * It is intentionally decoupled from the Embedded Signup logic so that the
 * SDK lifecycle (load → init → ready) can be managed once, at the app level,
 * and consumed anywhere via direct import.
 *
 * Usage
 * ─────
 *   // main.ts — load once at startup
 *   const { loadSDK } = useFacebookSDK({ appId: '...', version: 'v21.0' })
 *   await loadSDK()
 *
 *   // Any child component / composable — consume shared state, no options needed
 *   const { FB, isReady, error } = useFacebookSDK()
 */

import { ref, readonly, shallowRef, type DeepReadonly, type ShallowRef, type Ref } from 'vue'

export interface FacebookSDKOptions {
  /** Meta App ID. Falls back to VITE_META_APP_ID env variable. */
  appId?: string
  /** Graph API version. Default: 'v21.0' */
  version?: string
  /** Parse XFBML tags on init. Default: false */
  xfbml?: boolean
  /** Enable cookie support. Default: false */
  cookie?: boolean
  /** Load the debug build of the SDK. Default: true in dev, false in prod */
  debug?: boolean
}

export interface FacebookInitParams {
  appId: string
  version: string
  xfbml: boolean
  cookie: boolean
}

export interface FacebookLoginOptions {
  config_id?: string
  response_type?: 'code' | 'token'
  override_default_response_type?: boolean
  scope?: string
  extras?: Record<string, unknown>
}

export interface FacebookAuthResponse {
  code?: string
  accessToken?: string
  userID: string
  expiresIn: number
  signedRequest: string
  data_access_expiration_time?: number
}

export interface FacebookLoginResponse {
  authResponse: FacebookAuthResponse | null
  status: 'connected' | 'not_authorized' | 'unknown'
}

export interface FacebookStatic {
  init(params: FacebookInitParams): void
  login(callback: (response: FacebookLoginResponse) => void, options?: FacebookLoginOptions): void
  getLoginStatus(callback: (response: FacebookLoginResponse) => void, force?: boolean): void
  logout(callback: (response: FacebookLoginResponse) => void): void
}

export interface UseFacebookSDKReturn {
  /** The raw `window.FB` object — null until the SDK is ready. */
  FB: DeepReadonly<ShallowRef<FacebookStatic | null>>
  /** True once FB.init() has completed successfully. */
  isReady: DeepReadonly<Ref<boolean>>
  /** True while the script tag is being fetched or FB.init() is running. */
  isLoading: DeepReadonly<Ref<boolean>>
  /** Any Error that occurred during load/init, otherwise null. */
  error: DeepReadonly<Ref<Error | null>>
  /** Load and initialise the SDK. Idempotent and safe to call multiple times. */
  loadSDK: () => Promise<void>
  /** Tear down the SDK completely (useful for testing or forced re-init). */
  resetSDK: () => void
}

// ─── Augment window to include FB globals ────────────────────────────────────

declare global {
  interface Window {
    FB: FacebookStatic
    fbAsyncInit: () => void
  }
}

// ─── Module-level singletons ─────────────────────────────────────────────────
// Shared across every call to useFacebookSDK() in the same app instance.

const _FB = shallowRef<FacebookStatic | null>(null)
const _isReady = ref<boolean>(false)
const _isLoading = ref<boolean>(false)
const _error = ref<Error | null>(null)

let _loadPromise: Promise<void> | null = null

const SDK_SCRIPT_ID = 'facebook-jssdk'
const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'
const SDK_DEBUG_URL = 'https://connect.facebook.net/en_US/sdk/debug.js'
const INIT_TIMEOUT_MS = 10_000

export function useFacebookSDK(options: FacebookSDKOptions = {}): UseFacebookSDKReturn {
  const {
    appId = '' as string | undefined,
    version = 'v21.0',
    xfbml = false,
    cookie = false,
    debug = import.meta.env.DEV,
  } = options

  /**
   * Injects the FB SDK <script> tag and resolves once it has loaded.
   * If the tag already exists in the DOM, resolves immediately.
   */
  function _injectScript(): Promise<void> {
    if (document.getElementById(SDK_SCRIPT_ID)) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.id = SDK_SCRIPT_ID
      script.src = debug ? SDK_DEBUG_URL : SDK_URL
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'

      script.onload = (): void => resolve()
      script.onerror = (): void =>
        reject(new Error(`[useFacebookSDK] Failed to load SDK from ${script.src}`))

      const firstScript = document.getElementsByTagName('script')[0]
      firstScript?.parentNode?.insertBefore(script, firstScript)
    })
  }

  /**
   * Calls FB.init() and resolves when the SDK is ready.
   * Uses the `fbAsyncInit` hook for correct timing per Meta's documentation.
   * Resolves immediately if the SDK is already initialised (e.g. after a hot reload).
   */
  function _initSDK(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Short-circuit: nothing to do if already ready
      if (_isReady.value) {
        resolve()
        return
      }

      // Guard: appId is required to initialise
      if (!appId) {
        reject(
          new Error(
            '[useFacebookSDK] No App ID provided. ' +
              'Pass `appId` to useFacebookSDK() or set VITE_META_APP_ID in your .env file.',
          ),
        )
        return
      }

      // Short-circuit: SDK script loaded but fbAsyncInit already fired (hot-reload)
      if (window.FB) {
        _finalise()
        resolve()
        return
      }

      // Timeout guard — if fbAsyncInit never fires (e.g. CSP block), reject cleanly
      let settled = false

      const timeout = setTimeout((): void => {
        if (!settled) {
          settled = true
          reject(
            new Error(
              '[useFacebookSDK] Timed out waiting for fbAsyncInit. ' +
                'Check that connect.facebook.net is not blocked.',
            ),
          )
        }
      }, INIT_TIMEOUT_MS)

      // Chain any previously registered fbAsyncInit handler
      const previousInit: (() => void) | undefined = window.fbAsyncInit

      window.fbAsyncInit = (): void => {
        if (typeof previousInit === 'function') previousInit()

        try {
          window.FB.init({ appId: appId!, version, xfbml, cookie })
          _finalise()

          if (!settled) {
            settled = true
            clearTimeout(timeout)
            resolve()
          }
        } catch (err) {
          if (!settled) {
            settled = true
            clearTimeout(timeout)
            reject(
              new Error(
                `[useFacebookSDK] FB.init() threw: ${err instanceof Error ? err.message : String(err)}`,
              ),
            )
          }
        }
      }
    })
  }

  /**
   * Syncs the window.FB global into our reactive ref and updates state flags.
   */
  function _finalise(): void {
    _FB.value = window.FB
    _isReady.value = true
    _isLoading.value = false
    _error.value = null

    if (import.meta.env.DEV) {
      console.info(`[useFacebookSDK] ✓ SDK ready — appId: ${appId}, version: ${version}`)
    }
  }

  /**
   * Loads and initialises the Facebook JS SDK.
   *
   * - Idempotent: safe to call multiple times — subsequent calls no-op or return
   *   the in-flight Promise.
   * - Should be awaited once in main.ts before app.mount().
   */
  async function loadSDK(): Promise<void> {
    if (_isReady.value) return
    if (_loadPromise) return _loadPromise

    _isLoading.value = true
    _error.value = null

    _loadPromise = (async (): Promise<void> => {
      try {
        await _injectScript()
        await _initSDK()
      } catch (err) {
        _isLoading.value = false
        _isReady.value = false
        _error.value = err instanceof Error ? err : new Error(String(err))
        _loadPromise = null // Allow a retry on the next call
        throw err
      }
    })()

    return _loadPromise
  }

  /**
   * Tears down all SDK state and removes the injected script tag.
   * Intended for use in tests or when forcing a re-initialisation.
   */
  function resetSDK(): void {
    const existing = document.getElementById(SDK_SCRIPT_ID)
    if (existing) existing.remove()

    _FB.value = null
    _isReady.value = false
    _isLoading.value = false
    _error.value = null
    _loadPromise = null

    // Clear globals by casting to any to avoid type conflicts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).FB = undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).fbAsyncInit = undefined

    if (import.meta.env.DEV) {
      console.info('[useFacebookSDK] SDK state reset.')
    }
  }

  return {
    FB: readonly(_FB),
    isReady: readonly(_isReady),
    isLoading: readonly(_isLoading),
    error: readonly(_error),
    loadSDK,
    resetSDK,
  }
}
