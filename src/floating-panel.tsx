// TODO: avoid style attributes, use tailwind and/or css modules
// TODO: receive styles
// TODO: refactor styles
import { children, createEffect, createSignal, mergeProps, onCleanup, type Component, type JSX } from 'solid-js'
import globals from './globals'
import type { HTML } from './utils'

export type FloatingPanelProps = {
    width?: string | number | undefined
    height?: string | number | undefined
    x?: string | number | undefined
    y?: string | number | undefined
    // TODO: unify source of truthy
    visible?: boolean | undefined
    onVisibilityChange?: ((visible: boolean) => void) | undefined
    children?: JSX.Element
}

/**
 * The panel’s visibility can be controlled externally via a signal 
 * or locked to always visible/hidden.              
 * If `visible` is omitted, the panel manages its own visibility internally.
 */
export const FloatingPanel: Component<FloatingPanelProps> = (props) => {
    const safeChildren = children(() => props.children)

    let el: HTML<'div'> | undefined

    const isControlled = () => props.visible !== undefined

    const [pos, setPos] = createSignal<{ x: number, y: number }>()
    const [size, setSize] = createSignal<{ width: number, height: number }>()

    const isXUnset = () => !pos() && props.x === undefined
    const isYUnset = () => !pos() && props.y === undefined

    const finalProps = mergeProps({
        width: 'auto',
        height: 'auto',
        x: '50%',
        y: '50%',
        visible: true,
    } satisfies Partial<FloatingPanelProps>, props)

    const [isVisible, setIsVisible] = createSignal(finalProps.visible)
    createEffect(() => {
        if (isControlled())
            setIsVisible(finalProps.visible)
    })


    let dragCleanup = () => { }
    function drag(e: PointerEvent) {
        if (e.button !== 0) return
        if (e.target instanceof HTMLElement && e.target.closest('[data-no-drag]')) return

        const rect = el!.getBoundingClientRect()
        const offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }

        const move = (e: PointerEvent) => {
            setPos({
                x: Math.max(0, e.clientX - offset.x),
                y: Math.max(0, e.clientY - offset.y),
            })
        }

        globals.window.addEventListener('pointermove', move)
        globals.window.addEventListener(
            'pointerup',
            () => globals.window.removeEventListener('pointermove', move),
            { once: true }
        )

        dragCleanup = () => globals.window.removeEventListener('pointermove', move)
    }

    let resizeCleanup = () => { }
    function resize(e: PointerEvent) {
        if (e.button !== 0) return
        e.stopPropagation()

        const rect = el!.getBoundingClientRect()
        const start = {
            mx: e.clientX,
            my: e.clientY,
            width: rect.width,
            height: rect.height,
        }

        const move = (e: PointerEvent) => {
            setSize({
                width: start.width + e.clientX - start.mx,
                height: start.height + e.clientY - start.my,
            })
        }

        globals.window.addEventListener('pointermove', move)
        globals.window.addEventListener(
            'pointerup',
            () => globals.window.removeEventListener('pointermove', move),
            { once: true }
        )

        resizeCleanup = () => globals.window.removeEventListener('pointermove', move)
    }

    onCleanup(() => {
        dragCleanup()
        resizeCleanup()
    })

    function hide() {
        if (isControlled())
            finalProps.onVisibilityChange?.(false)
    }

    const toCss = (v: number | string) => typeof v === 'number' ? `${v}px` : v
    const panelStyle: JSX.CSSProperties = {
        position: 'fixed',
        overflow: 'hidden',
        border: '1px solid hsla(0, 0%, 0%, 0.12)',
        'border-radius': '12px',
        'box-shadow': '0 8px 24px hsla(0, 0%, 0%, 0.12)',
        'z-index': 9999,
        cursor: 'grab',
        background: 'gray',
        'max-width': 'calc(100vw - 25px)',
        'max-height': 'calc(100vh - 50px)',
    }
    const hideStyle: JSX.CSSProperties = {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: '4px 10px',
        'font-size': 'larger',
        color: 'hsla(0, 0%, 100%, 1)',
        background: 'none',
        border: 'none',
    }
    const childStyle: JSX.CSSProperties = {
        'margin-inline': '4px',
        'margin-block': '24px',
        cursor: 'auto',
        overflow: 'auto',
        height: 'calc(100% - 48px)',
        width: 'calc(100% - 8px)',
        // TODO: not fully working as expected
        'max-width': 'calc(100vw - 25px - 48px)',
        'max-height': 'calc(100vh - 50px - 8px)',
    }
    const resizeStyle: JSX.CSSProperties = {
        position: 'absolute',
        right: 0,
        bottom: 0,
        padding: '4px 10px',
        cursor: 'nwse-resize',
        'font-size': 'larger',
        color: 'hsla(0, 0%, 100%, 1)',
        'user-select': 'none',
    }
    return (
        <div ref={el} onPointerDown={drag}
            style={{
                ...panelStyle,
                display: isVisible() ? 'block' : 'none',
                left: toCss(pos()?.x || finalProps.x),
                top: toCss(pos()?.y || finalProps.y),
                transform: `
                    ${isXUnset() ? 'translateX(-50%)' : ''} 
                    ${isYUnset() ? 'translateY(-50%)' : ''}
                `.trim() || 'none',
                width: toCss(size()?.width || finalProps.width),
                height: toCss(size()?.height || finalProps.height),
            }}
        >
            <button onClick={hide} style={hideStyle}> &ndash; </button>

            <div data-no-drag style={childStyle}>
                {safeChildren()}
            </div>

            <div onPointerDown={resize} style={resizeStyle}> {'//'} </div>
        </div>
    )
}
