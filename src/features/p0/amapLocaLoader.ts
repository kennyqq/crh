const AMAP_SCRIPT_ID = 'amap-jsapi-v2'
const LOCA_SCRIPT_ID = 'amap-loca-v2'

let amapLoaderPromise: Promise<{ AMap: any; Loca: any }> | null = null

function appendScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null

    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === 'true') {
        resolve()
        return
      }

      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${id}`)), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.defer = true

    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }

    script.onerror = () => reject(new Error(`Failed to load ${id}`))

    document.head.appendChild(script)
  })
}

export function loadAmapLoca(key: string, securityJsCode?: string) {
  if (!key) {
    return Promise.reject(new Error('Missing AMap key'))
  }

  if (securityJsCode) {
    window._AMapSecurityConfig = {
      ...(window._AMapSecurityConfig ?? {}),
      securityJsCode,
    }
  }

  if (window.AMap && window.Loca) {
    return Promise.resolve({ AMap: window.AMap, Loca: window.Loca })
  }

  if (!amapLoaderPromise) {
    amapLoaderPromise = (async () => {
      await appendScript(
        AMAP_SCRIPT_ID,
        `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`,
      )

      await appendScript(
        LOCA_SCRIPT_ID,
        `https://webapi.amap.com/loca?v=2.0.0&key=${encodeURIComponent(key)}`,
      )

      if (!window.AMap || !window.Loca) {
        throw new Error('AMap or Loca is unavailable after script load')
      }

      return { AMap: window.AMap, Loca: window.Loca }
    })().catch((error) => {
      amapLoaderPromise = null
      throw error
    })
  }

  return amapLoaderPromise
}
