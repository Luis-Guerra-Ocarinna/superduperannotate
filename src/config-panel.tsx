import { createEffect, For, on, type Component, type JSX } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Config } from './environment'
import { FloatingPanel, type FloatingPanelProps } from './floating-panel'

export type ConfigPanelProps = {
    config: Config
} & Omit<FloatingPanelProps, 'children'> & {}

export const ConfigPanel: Component<ConfigPanelProps> = (props) => {
    const [config, setConfig] = createStore(props.config)

    const keys = Object.keys(config) as Array<keyof Config>
    const prettify = (v: unknown) => {
        if (v === undefined) return ''
        return JSON.stringify(v, null, 4)
    }

    const [values, setValues] = createStore(
        Object.fromEntries(keys.map(k => [k, prettify(config[k])]))
    )

    const [invalidStates, setInvalidStates] = createStore(
        Object.fromEntries(keys.map(k => [k, false]))
    )

    createEffect(
        on(
            // create subscription to all properties
            () => JSON.stringify(config),
            () => config.save(),
            { defer: true }
        )
    )


    function onInput(key: keyof Config, raw: string) {
        setValues(key, raw)

        try {
            const parsed = raw.trim() ? JSON.parse(raw) : undefined
            // TODO: verify why some times it keeps the invalidState as true
            setInvalidStates(key, false)
            setConfig(key, parsed)
            // TODO: stringify it without prettify every run
            setValues(key, prettify(parsed))
        } catch {
            setInvalidStates(key, true)
        }
    }


    const containerStyle: JSX.CSSProperties = {
        display: 'flex',
        'flex-wrap': 'wrap',
        gap: '8px',
        'font-family': 'monospace',
    }
    const fieldStyle: JSX.CSSProperties = {
        display: 'flex',
        'flex-direction': 'column',
        gap: '6px',
        padding: '10px',
        'border-radius': '10px',
        'background-color': 'hsl(220, 25%, 10%)',
        border: '1px solid hsl(230, 25%, 20%)',
    }
    const labelStyle: JSX.CSSProperties = {
        color: 'hsl(220, 15%, 75%)',
        'font-size': 'x-large',
    }
    const textareaBase: JSX.CSSProperties = {
        padding: '10px',
        'border-radius': '8px',
        'background-color': 'hsl(220, 30%, 10%)',
        color: 'hsl(0, 0%, 90%)',
        'font-size': 'x-large',
        'line-height': '1.5',
        'field-sizing': 'content',
    }
    return (
        // TODO: there is a way to pass all props to child without break reactivity?
        <FloatingPanel
            visible={props.visible}
            onVisibilityChange={props.onVisibilityChange}
            width={props.width}
            height={props.height}
            x={props.x}
            y={props.y}
        >
            <div style={containerStyle}>
                <For each={keys}>
                    {(key) => (
                        <div style={fieldStyle}>
                            <label style={labelStyle}> {key} </label>
                            <textarea
                                spellcheck={false}
                                value={values[key]}
                                onInput={(e) =>
                                    onInput(key, e.currentTarget.value)
                                }
                                style={{
                                    ...textareaBase,
                                    outline: invalidStates[key]
                                        ? '1px solid hsl(0, 100%, 71%)'
                                        : '1px solid hsl(221, 21%, 21%)',
                                }}
                            />
                        </div>
                    )}
                </For>
            </div>
        </FloatingPanel >
    )
}