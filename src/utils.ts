import { render } from 'solid-js/web'

class AssertionError extends Error { }
export function assert(condition: unknown, msg?: string): asserts condition { if (!condition) throw new AssertionError(msg) }

export const renderFreely = (code: Parameters<typeof render>[0]) => {
    assert(document.body, 'No body in DOM')

    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(code, container)

    return () => {
        dispose()
        container.remove()
    }
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

type EventOrCustom<T> = T extends Event ? T : CustomEvent<T>
export class TypedEventTarget<TDetails extends Record<string, Event | any>> extends EventTarget {
    addEventListener<K extends keyof TDetails & string>(
        type: K,
        callback:
            ((evt: EventOrCustom<TDetails[K]>) => void)
            |
            { handleEvent(object: EventOrCustom<TDetails[K]>): void }
            | null,
        options?: AddEventListenerOptions | boolean
    ): void { return super.addEventListener(type, callback as any, options) }

    removeEventListener<K extends keyof TDetails & string>(
        type: K,
        callback:
            ((evt: EventOrCustom<TDetails[K]>) => void)
            |
            { handleEvent(object: EventOrCustom<TDetails[K]>): void }
            | null,
        options?: AddEventListenerOptions | boolean
    ): void { return super.removeEventListener(type, callback as any, options) }

    dispatchEvent<K extends keyof TDetails>(
        event: EventOrCustom<TDetails[K]>
    ): boolean { return super.dispatchEvent(event) }
}

export type HTML<K extends keyof HTMLElementTagNameMap | void = void> =
    K extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[K]
    : HTMLElement
