import { render } from 'solid-js/web'

class AssertionError extends Error { }
export const assert = (condition: any, msg?: string) => { if (!condition) throw new AssertionError(msg) }

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
