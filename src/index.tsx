export * as utils from './utils'

import type { Config } from './environment'

// WARN: assuming that the storage was not corrupted
// alternatively you could fork this repo and hardcode it
export function runCustomCode(config: Config, dependencies: Record<string, any>) {
    const code = config.customCode

    if (!code) return

    Function(...[
        ...Object.keys(dependencies),
        code
    ])(...Object.values(dependencies))
}
