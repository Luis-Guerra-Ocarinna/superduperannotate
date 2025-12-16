import { hm } from '@violentmonkey/dom';
import { getPanel, showToast } from '@violentmonkey/ui';
import { render } from 'solid-js/web';
// global CSS
import globalCss from './style.css';
// CSS modules
import styles, { stylesheet } from './style.module.css';

import { HelloWorld } from 'superduperannotate';

function Wrapper() {
  const el = hm('div', {})
  render(HelloWorld, el)

  return (
    <div class={styles.title}>
      Get <button on:click={() => showToast(el, { theme: 'dark' })}>wrapped</button>
    </div>
  );
}

// Inject CSS
const randomHue = Math.floor(Math.random() * 360);
unsafeWindow.document.documentElement.style.setProperty('--random-hue', randomHue + 'deg');
GM.addStyle(globalCss);

const panel = getPanel({
  theme: 'dark',
  style: stylesheet,
});
Object.assign(panel.wrapper.style, {
  top: '50%',
  left: '50%',
  translate: '-50% -50%',
});
panel.show();
render(Wrapper, panel.body);
