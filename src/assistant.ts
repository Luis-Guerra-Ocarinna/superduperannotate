import globals from './globals'
import { assert, TypedEventTarget } from './utils'

const objContextEmitter = new TypedEventTarget<{
    'open': Element
}>()

const objContext$ = new MutationObserver((mutations, _observer) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (!(node instanceof Element)) continue

            const $context = node
                .querySelector(`div.cdk-global-overlay-wrapper > div.cdk-overlay-pane
                                > ng-component > div.object-context-menu-container`)
            if (!$context) continue

            objContextEmitter.dispatchEvent(new CustomEvent('open', { detail: $context }))
        }
    }
})

objContextEmitter.addEventListener('open', ({ detail: $objectContext }) => {
    const $focusable = $objectContext
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(`
            object-details > div > div.tab-contents
            > object-details-attributes > sa-editor-attributes-list
            > div.attributes > attribute-group :is(input, textarea)`)
        // .querySelector<HTMLInputElement | HTMLTextAreaElement>(`
        //     object-details > div > div.tab-contents
        //     > object-details-attributes > sa-editor-attributes-list
        //     > div.attributes > attribute-group:nth-child(2) :is(input, textarea)`)
        || $objectContext.querySelector<HTMLTextAreaElement>(`
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