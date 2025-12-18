import { observe } from '@violentmonkey/dom';
import './app';
import { main } from './app';
import './meta.js?userscript-metadata';

observe(document.body, () => {
  const $triggerAppeared = document.querySelector('app-vector sa-editors-layout app-header-panel sa-editor-workflow>button[data-qa-id="status-button"]')

  if (!$triggerAppeared) return

  // delay just a bit to ensure app is prepare to receive commands
  setTimeout(main, 500)
  return true
})
