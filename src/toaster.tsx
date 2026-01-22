import { createSignal, onCleanup, onMount, type Component, type JSX } from 'solid-js';
import { renderFreely } from './utils';

export type ToastProps = {
    text: string
    background: JSX.CSSProperties['background']
    color?: JSX.CSSProperties['color']
    duration?: number | undefined
    onClose?: (() => void) | undefined
}

export const Toast: Component<ToastProps> = (props) => {
    const [visible, setVisible] = createSignal(false)

    const transitionTime = 0.75
    onMount(() => {
        // element mounted
        requestAnimationFrame(() =>
            // element painted
            requestAnimationFrame(() =>
                // runs only after first paint
                setVisible(true)
            )
        )

        const dismissTimer = setTimeout(() => {
            setVisible(false)
            if (props.onClose)
                setTimeout(props.onClose, transitionTime * 1000)
        }, props.duration ?? 1.5 * 1000)

        onCleanup(() => clearTimeout(dismissTimer))
    })

    const bottom = '50px'
    const toastStyle: JSX.CSSProperties = {
        position: 'fixed',
        bottom: bottom,
        left: '50%',
        padding: '8px 12px',
        'border-radius': '4px',
        'box-shadow': '0 2px 10px hsla(0, 0%, 0%, 0.1)',
        'font-family': 'sans-serif',
        'font-size': 'larger',
        'letter-spacing': '1.75px',
        transition: `
            opacity ${transitionTime}s ease,
            translate ${transitionTime}s ease
        `,
        'pointer-events': 'none',
        'z-index': 9999,
    }

    return (
        <div
            style={{
                ...toastStyle,
                opacity: visible() ? 1 : 0,
                background: props.background,
                color: props.color ?? 'white',
                translate: `-50% ${visible() ? '0' : bottom}`,
            }}
        >
            {props.text}
        </div>
    )
}

type ToastArgs = Omit<ToastProps, 'text' | 'onClose'>
export const toast = (
    text: string,
    options: ToastArgs
) => {
    const dispose = renderFreely(() => (
        <Toast
            text={text}
            background={options.background}
            color={options.color}
            duration={options.duration}
            onClose={() => dispose()}
        />
    ))

    return dispose
}
