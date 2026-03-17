declare module '@jiaminghi/data-view-react' {
  import type { ComponentType, CSSProperties, ReactNode } from 'react'

  interface BasicProps {
    className?: string
    style?: CSSProperties
    children?: ReactNode
    color?: string[]
    backgroundColor?: string
  }

  interface DigitalFlopProps {
    className?: string
    style?: CSSProperties
    config?: Record<string, unknown>
  }

  export const BorderBox8: ComponentType<BasicProps>
  export const BorderBox12: ComponentType<BasicProps>
  export const BorderBox13: ComponentType<BasicProps>
  export const Decoration3: ComponentType<BasicProps>
  export const DigitalFlop: ComponentType<DigitalFlopProps>
}
