type Modifier = 'C' | 'A'
type PermuteMods<T, Sep extends string = '-', U = T> = T extends string
    ? `${T}${Sep}${PermuteMods<Exclude<U, T>, Sep>}` | T
    : never
export type Modifiers = PermuteMods<Modifier>

export type Key = `-${string}`
export type Mouse = `m${'0' | '1' | '2' | '3' | '4'}`
export type Input = Key | Mouse

export type BindString = `${Modifiers} ${Input}` | ` ${Key | Mouse}`
type BindHash = BindString

export type Action = () => void

type Binds = Map<BindHash, Action>
type ReadOnlyBinds = ReadonlyMap<BindHash, Action>
type BindParam = Bind | BindString

export class Bind {
    #ctrl?: Extract<Modifier, 'C'>
    #alt?: Extract<Modifier, 'A'>
    #key?: Key
    #mouse?: Mouse

    constructor(bind?: BindString | string) {
        if (!bind) return this

        const [input, modsString] = bind.split(' ').reverse()

        if (this.isKey(input!)) this.key(input)
        else if (this.isMouse(input!)) this.mouse(input)
        else throw new Error('Invalid input. `Key` strokes should start with `-`, and `Mouse` clicks with `m`')

        const mods = modsString?.split('-') ?? []
        if (mods.length > 3) throw new Error('Mods were specified wrong. Should be single letters separated by hyphen')

        if (mods.includes('C')) this.ctrl()
        if (mods.includes('A')) this.alt()
    }

    static fromEvent(event: KeyboardEvent | MouseEvent): Bind {
        const bind = new Bind()

        if (event.ctrlKey) bind.ctrl()
        if (event.altKey) bind.alt()

        if (event instanceof KeyboardEvent) bind.key(`-${event.key}`)
        else if (event instanceof MouseEvent) bind.mouse(`m${event.button}` as Mouse)
        else throw new Error('Invalid event type')

        return bind
    }

    ctrl(): this { this.#ctrl = 'C'; return this }

    alt(): this { this.#alt = 'A'; return this }

    // TODO: returnable errors
    private isKey(keyInput: string): keyInput is Key {
        try { this.assertKey(keyInput) } catch { return false }

        return true
    }

    private assertKey(keyInput: string): asserts keyInput is Key {
        const [prefix, key] = [keyInput.slice(0, 1), keyInput.slice(1)]

        if (prefix !== '-')
            throw new Error('Invalid `Key`. Should start with `-`')
        if (key.length !== 1)
            throw new Error('Invalid `Key`. Should none or a single character')
    }

    key(key: Key): this {
        if (this.#mouse)
            throw new Error('Cannot set `Key` when `Mouse` is already set')

        this.assertKey(key)

        this.#key = key

        return this
    }

    private isMouse(mouseInput: string): mouseInput is Mouse {
        try { this.assertMouse(mouseInput) } catch { return false }

        return true
    }

    private assertMouse(mouseInput: string): asserts mouseInput is Mouse {
        const [prefix, button] = [mouseInput.slice(0, 1), Number(mouseInput.slice(1))]

        if (prefix !== 'm')
            throw new Error('Invalid `Mouse`. Should start with `m`')
        if (button < 0 || button > 5)
            throw new Error('Invalid `Mouse`. Should be a number between 0 and 5')
    }

    mouse(mouse: Mouse): this {
        if (this.#key)
            throw new Error('Cannot set `Mouse` when `Key` is already set')

        this.assertMouse(mouse)

        this.#mouse = mouse

        return this
    }

    toString(): BindString {
        const input = this.#key || this.#mouse

        if (!input) throw new Error('No input was set')

        return `${[this.#ctrl, this.#alt].join('-')} ${input}` as BindString
    }

    hash(): BindHash { return this.toString() }
}

export class Keybindings {
    private _binds: Binds = new Map()
    get binds(): ReadOnlyBinds { return this._binds }

    private setBath(binds: Partial<Record<BindString, Action>>) {
        for (const [bind, action] of Object.entries(binds)) {
            if (!action) continue
            this._binds.set(new Bind(bind).hash(), action)
        }
    }

    constructor(binds?: Partial<Record<BindString, Action>>) {
        if (!binds) return

        this.setBath(binds)
    }

    listen(element: HTMLElement) {
        const handle = (event: KeyboardEvent | MouseEvent) => {
            let bind
            try { bind = Bind.fromEvent(event) } catch { return }

            const action = this.get(bind)
            if (action) {
                event.preventDefault()
                action()
            }
        }

        element.addEventListener('keydown', handle)
        element.addEventListener('mouseup', handle)
    }

    set(...args: [Partial<Record<BindString, Action>>] | [BindParam, Action]) {
        if (args.length === 1) return this.setBath(args[0])

        const [bind, action] = args
        this._binds.set(
            (bind instanceof Bind ? bind : new Bind(bind)).hash(),
            action
        )
    }

    get(bind: BindParam): (Action) | undefined {
        bind = bind instanceof Bind ? bind : new Bind(bind)
        return this._binds.get(bind.hash())
    }

    remove(bind: BindParam) {
        bind = bind instanceof Bind ? bind : new Bind(bind)
        this._binds.delete(bind.hash())
    }
}
