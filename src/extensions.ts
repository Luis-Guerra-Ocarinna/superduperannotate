import globals from './globals'
import { assert } from './utils'

export const disableHistoryNavigation = (wnd: Window = globals.window) => {
    if ((disableHistoryNavigation as any)['called']) return

    wnd.history.pushState(null, '', wnd.location.href)
    wnd.onpopstate = () => history.go(1);

    (disableHistoryNavigation as any)['called'] = true
}

export const turnQAModeOn = (doc: Document = globals.document) => {
    const QASwitch = doc.querySelector<HTMLInputElement>(
        'sn-switch[label="QA mode"] input[type=checkbox]'
    )

    QASwitch && !QASwitch.checked && QASwitch.click()
}

export const setFillOpacity0 = (doc: Document = globals.document) => {
    const event = new KeyboardEvent('keyup', {
        key: '[',
        keyCode: 219,
        bubbles: true,
    })

    for (let i = 0; i < 5; i++) {
        doc.body.dispatchEvent(event)
    }
}

export const setStatusFilter = (status: string = 'Completed', doc: Document = globals.document) => {
    panels.openFilter()

    const $status = doc.querySelector('sn-select[data-qa-id="filters-annotation-status"]')
    assert($status)

    const $statusContainer = $status.querySelector('div.sn-select-container')
    assert($statusContainer)

    $statusContainer.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }))
    const $annotationStatusDesired = $status
        .querySelectorAll<HTMLElement>('select-dropdown-panel div.sn-option-wrapper')
        .values()
        .find(($o) => $o.querySelector('span.sn-option-name')!.textContent === status)
    assert($annotationStatusDesired)

    $annotationStatusDesired.click()

    const $filterButton = doc.querySelector<HTMLButtonElement>('button#apply-filter-button')
    assert($filterButton)
    $filterButton.click()
}

export const panels = {
    toggleRight: (doc: Document = globals.document) => {
        const togglePanel = doc.querySelector<HTMLElement>('sn-icon[data-qa-id="right-panel-toggle"]')
        assert(togglePanel)
        togglePanel.click()
    },

    selectObjects: (doc: Document = globals.document) => {
        const objectsTab = doc.querySelector<HTMLElement>('app-right-panel sn-tab-header #sn-tab-label-0')
        assert(objectsTab)
        objectsTab.click()
    },

    toggleObjectsVisibility: (doc: Document = globals.document) => {
        const selectedObjects = doc.querySelectorAll('app-right-panel virtual-scroller object-item div.selected')

        if (!selectedObjects.length) {
            const toggleVisibility = doc.querySelector<HTMLElement>('app-right-panel action-bar button[data-qa-id="show-hide-all-button"]')
            assert(toggleVisibility)
            toggleVisibility.click()
            return
        }

        selectedObjects.forEach(object => {
            const toggleVisibility = object.querySelector<HTMLElement>('sn-icon[data-qa-id="data-visibility-button"]')
            toggleVisibility?.click()
        })
    },

    selectTags: (doc: Document = globals.document) => {
        const tagsTab = doc.querySelector<HTMLElement>('app-right-panel sn-tab-header #sn-tab-label-1')
        assert(tagsTab)
        tagsTab.click()
    },

    toggleItemsDisclosure: (doc: Document = globals.document) => {
        const toggle = doc.querySelector<HTMLElement>('app-right-panel action-bar button[data-qa-id="expand-collapse-button"]')
        assert(toggle)
        toggle.click()
    },

    toggleClassDisclosure: (name: string, doc: Document = globals.document) => {
        const toggle = doc
            .querySelectorAll('app-right-panel sn-tab-group > div.sn-tab-body > objects-tab div.scrollable-content > object-class-group')
            .values()
            .find((group) => group.querySelector('sn-select .sn-value span')?.textContent === name)
            ?.querySelector<HTMLElement>('div[data-qa-id=class-group-expand-button]')
        assert(toggle, `expand control not found for ${name}`)
        toggle.click()
    },

    toggleBottom: (doc: Document = globals.document) => {
        const togglePanel = doc.querySelector<HTMLElement>('app-bottom-bar div.title')
        assert(togglePanel)
        togglePanel.click()
    },

    openFilter: (doc: Document = globals.document) => {
        const filterIcon = doc.querySelector<HTMLElement>('app-bottom-bar div.filter')
        assert(filterIcon)
        filterIcon.click()
    },
}

