declare global {
  interface Window {
    AMap?: any
    Loca?: any
    _AMapSecurityConfig?: {
      securityJsCode?: string
      serviceHost?: string
    }
  }
}

export {}
