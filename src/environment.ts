/**
 * @remarks
 * **WARNING:** Avoid implementing this as a wrapper for `localStorage`. 
 * Any other script on the same origin can modify the data, leading to potential 
 * security or state consistency issues.
 */
// TODO: as exercise, implements safe localStorage wrapper (sandbox, security policies, signing...)
export abstract class Storage {
    constructor(public readonly prefix: string = 'superduperannotate.config') { }
    public abstract get(key: string): string | undefined
    public abstract set(key: string, value: string): void
    public abstract remove(key: string): void
}

export class LogStorage extends Storage {
    private static _storage: Record<string, string> = {}

    public get(key: string): string | undefined {
        console.debug('getting from store', { key, _prefix: this.prefix })
        return LogStorage._storage[this.prefix + '-' + key]
    }

    public set(key: string, value: string): void {
        console.debug('setting to the store', { key, value, _prefix: this.prefix })
        LogStorage._storage[this.prefix + '-' + key] = value
    }

    public remove(key: string): void {
        console.debug('removing from store', { key, _prefix: this.prefix })
        delete LogStorage._storage[this.prefix + '-' + key]
    }
}

// TODO: make it deeply reactive to auto-save itself
export class Config {
    customCode: string | undefined

    // TODO: better way to save bindings
    // for now just saving in custom code

    constructor(private _storage: Storage) {
        this.load()
    }

    load() {
        for (const key in this) {
            if (!Object.hasOwn(this, key)) continue
            if (key.startsWith('_')) continue
            const value = this._storage.get(key)

            // since it has default values defined in class,
            // probably it will never be undefined (unless the storage is changed manually)
            if (value === undefined) continue

            this[key] = JSON.parse(value)
        }
    }

    save() {
        for (const key in this) {
            if (!Object.hasOwn(this, key)) continue
            if (key.startsWith('_')) continue
            const value = this[key]

            this._storage.set(key, JSON.stringify(value))
        }
    }
}
