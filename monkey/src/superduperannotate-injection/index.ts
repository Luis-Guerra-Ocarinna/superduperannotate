import './app';
import './meta.js?userscript-metadata';

import { assert } from 'superduperannotate/utils';

assert(document.body, 'Body didn\'t load yet');
