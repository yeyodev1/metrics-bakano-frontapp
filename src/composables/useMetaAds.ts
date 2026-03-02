import { ref } from 'vue'
import { metaService, type MetaPage } from '@/services/meta.service'

/**
 * Composable to handle Meta Ads integration flow following Official SDK patterns
 */
export function useMetaAds() {
  const isSDKLoaded = ref(false)
  const isLoggingIn = ref(false)
  const loginStatus = ref<'connected' | 'not_authorized' | 'unknown' | 'idle'>('idle')
  const error = ref<string | null>(null)

  // Flow steps for the UI
  const authStep = ref<'idle' | 'pick_page' | 'done'>('idle')
  const availablePages = ref<MetaPage[]>([])
  const longToken = ref<string | null>(null)

  const META_APP_ID = '1465122391696717'

  /**
   * IMPORTANT: Reduced scopes to avoid "Invalid Scopes" if the app is not yet a verified Business App.
   * Eliminamos 'ads_management' porque la aplicación solo requiere LECTURA de métricas ('ads_read').
   */
  const REQUIRED_SCOPES = 'pages_show_list,pages_read_engagement,ads_read,business_management'

  /**
   * statusChangeCallback (As requested from documentation)
   * This processes the response from FB.getLoginStatus() or FB.login()
   */
  const statusChangeCallback = async (response: any) => {
    console.log('FB Status Change Response:', response)

    if (response.status === 'connected') {
      // The person is logged into Facebook and your app.
      loginStatus.value = 'connected'
      const shortToken = response.authResponse.accessToken

      // If we are actively trying to connect, proceed to backend auth
      if (isLoggingIn.value) {
        await handleBackendAuth(shortToken)
      }
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
      loginStatus.value = 'not_authorized'
      isLoggingIn.value = false
    } else {
      // The person is not logged into Facebook, or status unknown
      loginStatus.value = 'unknown'
      isLoggingIn.value = false
    }
  }

  /**
   * checkLoginState (As requested)
   */
  const checkLoginState = () => {
    // @ts-ignore
    if (window.FB) {
      // @ts-ignore
      FB.getLoginStatus((response) => {
        statusChangeCallback(response)
      })
    }
  }

  /**
   * Initializes the Meta SDK (fbAsyncInit flow)
   */
  const initSDK = (): Promise<void> => {
    return new Promise((resolve) => {
      // @ts-ignore
      if (window.FB) {
        isSDKLoaded.value = true
        resolve()
        return
      }

      // @ts-ignore
      window.fbAsyncInit = function () {
        // @ts-ignore
        FB.init({
          appId: META_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        })

        // As requested: track page view
        // @ts-ignore
        FB.AppEvents.logPageView()
        isSDKLoaded.value = true

        // As requested: initial status check
        // @ts-ignore
        FB.getLoginStatus((response) => {
          statusChangeCallback(response)
          resolve()
        })
      };

      // Inject SDK script
      (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0]
        if (d.getElementById(id)) return
        js = d.createElement(s); js.id = id
        // @ts-ignore
        js.src = "https://connect.facebook.net/en_US/sdk.js"
        // @ts-ignore
        fjs.parentNode.insertBefore(js, fjs)
      }(document, 'script', 'facebook-jssdk'))
    })
  }

  /**
   * loginWithMeta (The trigger for FB.login)
   */
  const loginWithMeta = async () => {
    isLoggingIn.value = true
    error.value = null

    try {
      await initSDK()

      // We call FB.login directly as requested for custom buttons
      // @ts-ignore
      FB.login((response) => {
        statusChangeCallback(response)
      }, { scope: REQUIRED_SCOPES })

    } catch (err: any) {
      isLoggingIn.value = false
      error.value = 'No se pudo cargar el SDK de Meta.'
      console.error(err)
    }
  }

  /**
   * Backend Verification flow
   */
  const handleBackendAuth = async (shortToken: string) => {
    try {
      const data = await metaService.authenticate(shortToken)
      availablePages.value = data.pages
      longToken.value = data.longToken
      authStep.value = 'pick_page'
      isLoggingIn.value = false
    } catch (err: any) {
      isLoggingIn.value = false
      error.value = 'Error al verificar la cuenta con el servidor.'
      console.error(err)
    }
  }

  /**
   * Finalizes the integration by saving the selected page
   */
  const selectPageAndSave = async (workspaceId: string, page: MetaPage) => {
    isLoggingIn.value = true
    try {
      await metaService.saveIntegration({
        workspaceId,
        pageId: page.id,
        pageName: page.name,
        // CRÍTICO: Guardamos el User Access Token (longToken) en vez del Page Access Token
        // ya que solo el token de usuario tiene permisos para leer AdAccounts y campañas.
        accessToken: longToken.value || page.access_token
      })
      authStep.value = 'done'
    } catch (err: any) {
      error.value = 'Error al guardar la página seleccionada.'
      console.error(err)
    } finally {
      isLoggingIn.value = false
    }
  }

  return {
    isSDKLoaded,
    isLoggingIn,
    loginStatus,
    error,
    authStep,
    availablePages,
    initSDK,
    loginWithMeta,
    checkLoginState,
    selectPageAndSave,
    resetFlow: () => { authStep.value = 'idle'; error.value = null }
  }
}
