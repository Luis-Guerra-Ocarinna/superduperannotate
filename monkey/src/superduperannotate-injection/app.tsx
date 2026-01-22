import * as assistant from 'superduperannotate/assistant'
import * as extensions from 'superduperannotate/extensions'
import { Bind, BindingManager } from 'superduperannotate/bindings'
import { sleep } from 'superduperannotate/utils'

type HTML<K extends keyof HTMLElementTagNameMap | void = void> =
  K extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[K]
  : HTMLElement

const binds = new BindingManager({
  'A -b': extensions.panels.toggleRight,

  'C -t': extensions.panels.selectTags,
  'C -g': extensions.panels.selectObjects,

  'A -a': extensions.panels.toggleItemsDisclosure,
  'A -v': extensions.panels.toggleObjectsVisibility,

  ' m3': () => { extensions.disableHistoryNavigation(); alert('backward prevented') },
  ' m4': () => { extensions.disableHistoryNavigation(); alert('forward prevented') },
})

GM.addStyle(`
    .instance-tooltip-overridden {
      top: var(--tooltip-top, auto) !important;
      left: var(--tooltip-left, auto) !important;
      bottom: var(--tooltip-bottom, auto) !important;
      right: var(--tooltip-right, auto) !important;
    }

    .object-context-menu-container {
        max-height: unset !important;
    }

    .select-dropdown-panel .select-dropdown-panel-items {
        max-height: 300px !important;
    }
`)

export async function main() {
  assistant.start()

  //TODO: keybindings should accept modifiers alone and other events to listen
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

  binds.listen(document.body)

  binds.set(new Bind().ctrl().key('-D'), async () => {
    extensions.panels.selectObjects()
    await sleep(50)

    const $delAll = document.querySelector<HTML>('app-right-panel action-bar button[data-qa-id="delete-all-button"]')
    $delAll.click()

    extensions.panels.selectTags()
  })

  // cycle class visibility
  binds.set('A -q', () => {
    const $eyes = document.querySelectorAll<HTML>('app-right-panel virtual-scroller object-class-group sn-icon[data-qa-id=class-group-visibility-button]').values()
    for (const $eye of $eyes) {
      if ($eye.querySelector('use[*|href$=open]')) {
        $eye.click()
        $eyes.next().value?.click()
        return
      }
    }

    document.querySelector<HTML>('app-right-panel virtual-scroller object-class-group sn-icon[data-qa-id=class-group-visibility-button]').click()
  })

  const toastCopy = async (text: string, color: string) => {
    const msg = document.createElement('div')
    msg.textContent = text
    Object.assign(msg.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: color,
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '4px',
      fontFamily: 'sans-serif',
      zIndex: 9999,
      opacity: 1,
      transition: 'opacity 0.5s ease',
    })
    document.body.appendChild(msg)
    await sleep(2000)
    msg.style.opacity = '0'
    await sleep(500)
    msg.remove()
  }

  // copy image name
  binds.set('A -c', async () => {
    const imgName = decodeURIComponent(
      new URL(document.querySelector<HTML<'img'>>('img[src*=photo_]').src)
        .pathname
        .split('/')
        .pop()
    )
      .split('/')
      .pop()
      .replace(/\.\w+$/, '')
    await navigator.clipboard.writeText(imgName)

    toastCopy('Copied', 'mediumseagreen')
  })

  // copy image
  // NOTE: needs a local proxy
  binds.set('A -C', async () => {
    const fetchProxied = (url: string) => fetch('http://localhost:3000/?target=' + encodeURIComponent(url), { method: 'GET' })

    try {
      const response = await fetchProxied(document.querySelector<HTML<'img'>>('.imageWrapper img').src)
      const arrayBuffer = await response.arrayBuffer()
      // function detectImageType(buffer) {
      // 	const arr = new Uint8Array(buffer.slice(0, 4))
      // 	if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) return 'image/png'
      // 	if (arr[0] === 0xFF && arr[1] === 0xD8) return 'image/jpeg'
      // 	if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46) return 'image/gif'
      // 	return 'application/octet-stream'
      // }
      // const mimeType = detectImageType(arrayBuffer)
      const mimeType = 'image/png'
      const blob = new Blob([arrayBuffer], { type: mimeType })

      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      toastCopy('Copied Image', 'gold')
    } catch (error) {
      console.error('Failed to copy image:', error)
      toastCopy('Error', 'crimson')
    }
  })
}

unsafeWindow['BINDS'] = binds
