import globals from './globals'
import { assert, TypedEventTarget, type HTML } from './utils'

const objContextEmitter = new TypedEventTarget<{
    'open': HTMLDivElement
}>()

const objContext$ = new MutationObserver((mutations, _observer) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (!(node instanceof Element)) continue

            const $context = node
                .querySelector(`div.cdk-global-overlay-wrapper > div.cdk-overlay-pane
                                > ng-component > div.object-context-menu-container`)
            if (!$context) continue

            assert($context instanceof HTMLDivElement)

            objContextEmitter.dispatchEvent(new CustomEvent('open', { detail: $context }))
            return
        }
    }
})

objContextEmitter.addEventListener('open', ({ detail: $objectContext }) => {
    const $focusable = $objectContext.querySelector<HTML<'input' | 'textarea'>>(`
            object-details > div > div.tab-contents
            > object-details-attributes > sa-editor-attributes-list
            > div.attributes > attribute-group:nth-child(${1}) :is(input, textarea)`)
        || $objectContext.querySelector<HTML<'textarea'>>(`
            sa-editor-class-select > sn-select
            div.sn-value-container > div.sn-select-input
            textarea`)

    assert($focusable)

    $focusable.select()
})

export const start = (doc: Document = globals.document) => {
    const $overlayContainer = doc.querySelector('body > div.cdk-overlay-container')
    assert($overlayContainer)
    objContext$.observe($overlayContainer, { childList: true })
}