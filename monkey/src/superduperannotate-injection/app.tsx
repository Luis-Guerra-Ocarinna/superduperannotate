import * as assistant from 'superduperannotate/assistant'
import * as extensions from 'superduperannotate/extensions'

import { createSignal } from 'solid-js'
import { Bind, BindingManager } from 'superduperannotate/bindings'
import { ConfigPanel } from 'superduperannotate/config-panel'
import { Config, } from 'superduperannotate/environment'
import { toast } from 'superduperannotate/toaster'
import { renderFreely, sleep, type HTML } from 'superduperannotate/utils'
import { MonkeyStorage } from './monkey-storage'

const storage = new MonkeyStorage()
const config = new Config(storage)

const binds = new BindingManager({
  'A -b': extensions.panels.toggleRight,

  'C -t': extensions.panels.selectTags,
  'C -g': extensions.panels.selectObjects,

  'A -a': extensions.panels.toggleItemsDisclosure,
  'A -v': extensions.panels.toggleObjectsVisibility,

  ' m4': () => extensions.panels.toggleObjectsVisibility,
  // send shift + down
  ' m3': () => document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 40, shiftKey: true })),
  // send ctrl + shift + down
  'C m3': () => document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 40, shiftKey: true, ctrlKey: true })),

  // TODO: receive correct stage names from each project type/id
  // WARN: assuming specific order
  // approve image
  'A -f': async () => {
    document.querySelector<HTML>('sa-editor-workflow[data-qa-id=transitions] button').click()
    await sleep(10)
    document.querySelector<HTML>('div[id^=dropdown-menu-panel] > div.sn-dropdown-menu-content div[sndropdownitem]').click()
  },
  // reject image
  'A -r': async () => {
    document.querySelector<HTML>('sa-editor-workflow[data-qa-id=transitions] button').click()
    await sleep(10)
    document.querySelector<HTML>('div[id^=dropdown-menu-panel] > div.sn-dropdown-menu-content div[sndropdownitem]:nth-child(2)').click()
  },

  // dele all objects
  'C -D': async () => {
    extensions.panels.selectObjects()
    await sleep(50)

    const $delAll = document.querySelector<HTML>('app-right-panel action-bar button[data-qa-id=delete-all-button]')
    $delAll.click()

    extensions.panels.selectTags()
  },

  // cycle class visibility
  'A -q': () => {
    const $eyes = document.querySelectorAll<HTML>('app-right-panel virtual-scroller object-class-group sn-icon[data-qa-id=class-group-visibility-button]').values()
    for (const $eye of $eyes) {
      if ($eye.querySelector('use[*|href$=open]')) {
        $eye.click()
        $eyes.next().value?.click()
        return
      }
    }

    document.querySelector<HTML>('app-right-panel virtual-scroller object-class-group sn-icon[data-qa-id=class-group-visibility-button]').click()
  },

  // copy image name
  'A -c': async () => {
    const imgSrc = document.querySelector<HTML<'img'>>('div.imageWrapper img').src
    const imgName =
      imgSrc.includes('assets.superannotate.com')
        ? document.querySelector<HTML<'img'>>('app-bottom-bar div.image-container.selected img').alt
        : imgSrc.includes('blob.core.windows.net')
          ? decodeURIComponent(
            new URL(imgSrc)
              .pathname
              .split('/')
              .pop()
          ).split('/').pop()
          : undefined

    if (!imgName) return toast(`couldn't find image name`, { background: 'crimson' })

    await navigator.clipboard.writeText(imgName)

    toast('copied', { background: 'mediumseagreen' })
  },
  // copy image
  'A -C': async () => {
    const fetchImageBlob: (url: string) => Promise<Blob> = async (url) => {
      // NOTE: needs a local proxy
      // const response = await fetch('http://localhost:3000/?target=' + encodeURIComponent(url), { method: 'GET' })
      // const blob = await response.blob()
      const blob = await new Promise<Blob>((resolve, reject) => GM.xmlHttpRequest({
        url,
        onload: (resp) => {
          if (resp.status < 200 || resp.status >= 300)
            return reject(new Error(`HTTP ${resp.status}: ${resp.statusText}`))

          resolve(resp.response as Blob)
        },
        onerror: reject,
        responseType: 'blob'
      }))

      const imageBlob = new Blob([blob], { type: 'image/png' })
      return imageBlob
    }

    try {
      const imageBlob = await fetchImageBlob(document.querySelector<HTML<'img'>>('.imageWrapper img').src)
      const clipItem = new ClipboardItem({ [imageBlob.type]: imageBlob })
      await navigator.clipboard.write([clipItem])
      toast('copied Image', { background: 'gold' })
    } catch (error) {
      console.error('Failed to copy image:', error)
      toast('error', { background: 'crimson' })
    }
  },

  // prefetch magic select
  'A -g': async () => {
    toast('prefetching', { background: 'grey' })

    const done = !!await new Promise((resolve) => {
      const _superduperannotate = 'any-value'
      const id = crypto.randomUUID()

      const handleResponse = (event: MessageEvent) => {
        if (event.source !== window.parent) return

        const { _superduperannotate, id: responseId, value } = event.data || {}

        if (!_superduperannotate || responseId !== id) return

        window.removeEventListener('message', handleResponse)

        resolve(value)
      }
      window.addEventListener('message', handleResponse);

      window.parent.postMessage({
        _superduperannotate,
        id,
        value: document.querySelector<HTML<'img'>>('div.imageWrapper img').src
      }, '*');
    })

    if (done)
      toast('prefetched', { background: 'mediumseagreen' })
    else
      toast('couldn\'t prefetch', { background: 'crimson' })
  }
})

const [showConfig, setShowConfig] = createSignal(false)
renderFreely(() => <ConfigPanel
  config={config}
  visible={showConfig()}
  onVisibilityChange={setShowConfig}
/>)
const toggleConfig = () => setShowConfig(p => !p)
binds.set(new Bind().ctrl().key('- '), toggleConfig)

//TODO: bindingManager should accept modifiers alone and other events to listen
// and prevent when typing on inputs
let altPressed = false
let shiftPressed = false
document.addEventListener('keydown', e => {
  if (e.key === 'Alt') altPressed = true
  if (e.key === 'Shift') shiftPressed = true

  const $tooltip = document.querySelector<HTML>('.instance-tooltip')
  if (!$tooltip) return

  switch (true) {
    case (altPressed && shiftPressed):
      $tooltip.classList.add('instance-tooltip-overridden')
      $tooltip.style.setProperty('--tooltip-top', '16vh')
      $tooltip.style.setProperty('--tooltip-left', '56vw')
      $tooltip.style.setProperty('--tooltip-bottom', 'unset')
      $tooltip.style.setProperty('--tooltip-right', 'unset')
      break
    case (altPressed && !shiftPressed): {
      const rect = $tooltip.getBoundingClientRect()
      $tooltip.classList.add('instance-tooltip-overridden')
      $tooltip.style.setProperty('--tooltip-top', rect.top + 'px')
      $tooltip.style.setProperty('--tooltip-left', rect.left + 'px')
      $tooltip.style.setProperty('--tooltip-bottom', 'unset')
      $tooltip.style.setProperty('--tooltip-right', 'unset')
      break
    }
  }
})
document.addEventListener('keyup', e => {
  if (e.key === 'Alt') altPressed = false
  if (e.key === 'Shift') shiftPressed = false

  const $tooltip = document.querySelector<HTML>('.instance-tooltip')
  if (!$tooltip) return

  // When no modifiers are held, remove override
  if (!altPressed && !shiftPressed) {
    $tooltip.classList.remove('instance-tooltip-overridden')
    $tooltip.style.removeProperty('--tooltip-top')
    $tooltip.style.removeProperty('--tooltip-left')
    $tooltip.style.removeProperty('--tooltip-bottom')
    $tooltip.style.removeProperty('--tooltip-right')
  }
})
GM.addStyle(`
    .instance-tooltip-overridden {
      top: var(--tooltip-top, auto) !important;
      left: var(--tooltip-left, auto) !important;
      bottom: var(--tooltip-bottom, auto) !important;
      right: var(--tooltip-right, auto) !important;
    }
`)

const expose = {
  assistant,
  extensions,
  binds,
  storage,
  config,
  toast,
  GM,
  unsafeWindow,
}

export async function main() {
  binds.listen(document.body)

  assistant.start()
}

export default expose
