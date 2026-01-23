import { Storage } from 'superduperannotate/environment'

// TODO: async Storage
export class MonkeyStorage extends Storage {
    get(key: string): string | undefined {
        return GM_getValue(key)
    }
    set(key: string, value: string): void {
        GM_setValue(key, value)
    }
    remove(key: string): void {
        GM_deleteValue(key)
    }
}
