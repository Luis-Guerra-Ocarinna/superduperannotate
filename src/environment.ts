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

// TODO: make it deeply reactive to auto-save itself
export class Config {

    constructor(private _storage: Storage) {
        this.load()
    }

    load() {
        for (const key in this) {
            if (!Object.hasOwn(this, key)) continue
            const value = this._storage.get(key)

            // since it has default values defined in class,
            // probably it will never be undefined (unless the storage is changed manually)
            if (!value) continue

            this[key] = JSON.parse(value)
        }
    }

    save() {
        for (const key in this) {
            if (!Object.hasOwn(this, key)) continue
            const value = this[key]

            this._storage.set(key, JSON.stringify(value))
        }
    }
}
