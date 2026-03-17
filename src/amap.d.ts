interface ImportMetaEnv {
  readonly VITE_AMAP_KEY?: string
  readonly VITE_AMAP_SECURITY_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  AMap?: {
    Map: new (element: HTMLElement, config: Record<string, unknown>) => AMapMap
    Polyline: new (config: Record<string, unknown>) => AMapOverlay
    CircleMarker: new (config: Record<string, unknown>) => AMapOverlay
    Marker: new (config: Record<string, unknown>) => AMapOverlay
    Text: new (config: Record<string, unknown>) => AMapOverlay
    Pixel: new (x: number, y: number) => unknown
  }
  __amapLoader?: Promise<void>
}

interface AMapMap {
  clearMap: () => void
  add: (overlays: AMapOverlay[]) => void
  setFitView: (overlays: AMapOverlay[], immediately?: boolean, avoid?: number[], maxZoom?: number) => void
  resize?: () => void
  remove?: (overlay: AMapOverlay) => void
  destroy: () => void
}

interface AMapOverlay {}
