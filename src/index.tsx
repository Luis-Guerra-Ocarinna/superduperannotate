import { HelloWorld } from './hello-world'
import { renderFreely } from './utils'

export * as utils from './utils'
export * from './hello-world'

const dispose = renderFreely(HelloWorld)
setTimeout(dispose, 5 * 1000)
