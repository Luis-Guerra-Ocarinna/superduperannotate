import { observe } from '@violentmonkey/dom';
import { runCustomCode } from 'superduperannotate';
import './app';
import expose, { main } from './app';
import './meta.js?userscript-metadata';

const start = () => {
  unsafeWindow['superduperannotate'] = expose

  main()
  runCustomCode(expose.config, expose)
}

let ran = false
const timeoutId = setTimeout(() => {
  if (ran) return

  console.warn('observer timeout reached, running `main` anyway')
  ran = true
  start()
}, 20 * 1_000)

observe(document.body, () => {
  if (ran) return true

  const $triggerAppeared = document.querySelector('app-vector sa-editors-layout app-header-panel sa-editor-workflow>button[data-qa-id="status-button"]')

  if (!$triggerAppeared) return

  ran = true
  clearTimeout(timeoutId)

  // delay just a bit to ensure app is prepare to receive commands
  setTimeout(start, 500)
  return true
})
