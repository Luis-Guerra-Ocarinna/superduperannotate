import globals from 'superduperannotate/globals';
import { overrideFetch } from 'superduperannotate/magic';
import './meta.js?userscript-metadata';

// @ts-expect-error ts(2322)
globals.window = unsafeWindow

overrideFetch()
