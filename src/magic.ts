import globals from './globals'
import { toast } from './toaster'
import { assert } from './utils'

type Polygon = number[]
type Bbox = {
    x1: number
    x2: number
    y1: number
    y2: number
}

const toQuad = (points: number[]): [[number, number], [number, number], [number, number], [number, number]] => {
    return points
        .reduce((result, _value, index, array) => {
            if (index % 2 === 0) {
                result.push(array.slice(index, index + 2))
            }

            return result
        }, [] as number[][]
        ).reduce((acc, [x, y]) => {
            let [
                [minX, minY], [maxX, _ny],
                [_xx, maxY], [_nx, _xy]
            ] = acc

            minX = Math.min(minX, x ?? Infinity)
            minY = Math.min(minY, y ?? Infinity)
            maxX = Math.max(maxX, x ?? -Infinity)
            maxY = Math.max(maxY, y ?? -Infinity)

            return [
                [minX, minY], [maxX, minY],
                [maxX, maxY], [minX, maxY]
            ]
        }, [
            [Infinity, Infinity], [-Infinity, Infinity],

            [-Infinity, -Infinity], [Infinity, -Infinity]
        ])
}

type Container = [Polygon, unknown[]]
type Segment = [Container] | Container[]
type Data = { segments: Segment[] }

const _predictionCache = new Map<string, Response>()
const intercept_prediction: Interceptor = async (original, ...args) => {
    // TODO: better way trigger prefetch
    const _prefetching = !!args.at(2)

    const resource = args[0]
    const request = resource instanceof Request ? resource : new Request(String(resource), args[1])
    const init = args[1]
    const _url = resource instanceof Request ? resource.url : String(resource)
    const _key = _url

    if (_predictionCache.has(_key)) {
        console.debug(`[intercepted prediction] returning *cached* response for ${_key}`)
        const cachedResponse = _predictionCache.get(_key)!
        _predictionCache.delete(_key)
        return cachedResponse
    }

    const originalResponse = await (async () => {
        if (!_prefetching) return original(...args)

        const auth = _auth || await _authReady

        const headers = new Headers(request.headers ?? init?.headers)
        headers.set('Authorization', auth)

        const newInit = { ...init, headers }
        const newRequest = new Request(request, newInit)

        return original(newRequest, newInit)
    })()

    const response = originalResponse.clone()

    if (!response.ok) return originalResponse

    const data = await response.json()

    // TODO: documentation
    const checkSchema = (data: unknown): data is Data => {
        /*
            example = {
                segments: [ // Array
                    [ // somePolygonInfo // tuple
                        [ // infoContainer // tuple
                            [ // points // Array
                                // numbers
                            ],
                            [] // unknown
                        ]
                    ],
                    //...
                ]
            }
         */

        if (data == null || !(typeof data === 'object') || !('segments' in data) || !data['segments']) return false

        const segments = data['segments']

        if (!Array.isArray(segments)) return false

        // validated just the first one

        const somePolygonInfo = segments[0]

        if (!Array.isArray(somePolygonInfo) || somePolygonInfo.length !== 1) return false

        const infoContainer = somePolygonInfo[0]

        if (!Array.isArray(infoContainer) || infoContainer.length !== 2) return false

        const points = infoContainer[0]

        return (
            Array.isArray(points)
            && points.length > 2
            && typeof points[0] === 'number'
        )
    }
    if (!checkSchema(data)) {
        console.error(`[intercepted prediction] response from prediction didn't match to expected schema`, { data })

        // TODO: I'm not sure if it's ok to return the response since .json was already called, body would have been consumed, wouldn't it?
        // return originalResponse // let it go
    }

    for (const info of (data as Data).segments) {
        if (info.length > 1) {
            console.warn('[intercepted prediction] unhandled info', `why does it have ${info.length} elements?`, info)
            // continue // let it go too
        }

        const container = info[0]

        container[0] = toQuad(container[0]).flat()
    }

    console.debug('[intercepted prediction] segments were modified', { data })

    const newResponse = new Response(JSON.stringify(data), originalResponse)

    if (_prefetching) {
        console.debug(`[intercepted prediction] *prefetched* and *cached* response for ${_key}`)
        _predictionCache.set(_key, newResponse.clone())
    }

    return newResponse
}

type PolygonInfo = { type: 'polygon', points: Polygon }
type BboxInfo = { type: 'bbox', points: Bbox }
type Info = (BboxInfo | PolygonInfo) & { locked: boolean, exclude?: [] }

type Payload = { instances: Info[] }

// TODO: options to allow polygons,
// for now all polygons will be turned into bboxes,
// and if not possible an error will returned
const intercept_upload: Interceptor = async (original, ...args) => {
    const originalRequest = args[0]

    if (!(originalRequest instanceof Request)) {
        console.debug(`[intercepted upload] unhandled case where \`request\` is ${originalRequest.constructor}`, { args })

        return original(...args)
    }

    const request = originalRequest.clone()

    const checkSchema = (payload: unknown): payload is Payload => {
        if (typeof payload !== 'object' || !payload) return false
        if (!('instances' in payload)) return false

        const instances = payload['instances']
        if (!Array.isArray(instances) || instances.length < 1) return false

        // validated just the first one

        const info = instances[0]

        if (typeof info !== 'object' || !info['type']) return false

        return true
    }

    const payload = await request.json()

    if (!checkSchema(payload)) {
        console.warn(`[intercepted upload] payload didn't match the schema`, { payload })

        return original(originalRequest, args[1])
    }

    for (const info of payload.instances) {
        if (info.type !== 'polygon') continue

        const points = info.points

        if (points.length !== 8) {
            console.warn(`[intercepted upload] polygon not set to be a quadrilateral`, { info })
            // return original(originalRequest, args[1])
            // throw `non bbox-able polygon present` // does not stop fetch
            const error = 'non bbox-able polygon present'
            toast(error, { background: 'crimson', duration: 2 })
            return new Response(
                JSON.stringify({ error }),
                { status: 400, headers: { 'Content-Type': 'application/json' }, }
            )
        }

        const [x1, y1, x2, _y1, _x2, y2, _x1, _y2] = points as number[] & Record<0 | 1 | 2 | 5, number>

        delete info.exclude
        info.locked = false

        const bboxInfo = (info as any as BboxInfo)
        bboxInfo.type = 'bbox'
        bboxInfo.points = { x1, x2, y1, y2 }
    }

    console.debug(`[intercepted upload] instances were modified`, { payload })

    return original(request, {
        ...args[1],
        body: JSON.stringify(payload),
    })
}

let _auth: string | null = null
let _resolveAuthReady: ((value: string) => void) | null = null
let _authReady: Promise<string> = new Promise((res) => { _resolveAuthReady = res })
const _extractAuth: (...args: Parameters<typeof fetch>) => string | undefined = (...args) => {
    const request = args[0]
    if (request instanceof Request) {
        const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
        return header || undefined
    }

    const init = args[1]
    if (!init || !init.headers) return

    const headers = init.headers
    if (headers instanceof Headers) {
        const header = headers.get('authorization') ?? headers.get('Authorization')
        if (header) return header
    }

    if (Array.isArray(headers)) {
        for (const [key, value] of headers) {
            if (key.toLowerCase() === 'authorization') return value
        }
    }

    if (typeof headers === 'object') {
        for (const k of Object.keys(headers)) {
            if (k.toLowerCase() === 'authorization') return (headers as Record<string, string>)[k]
        }
    }
}
const intercept_telemetry: Interceptor = async (original, ...args) => {
    const auth = _extractAuth(...args)

    if (!auth) {
        console.error('[intercepted telemetry] couldn\'t get auth header from telemetry request')
    } else {
        _auth = auth
        if (_resolveAuthReady) {
            _resolveAuthReady(_auth)
            _resolveAuthReady = null
        }
    }

    return original(...args)
}

type Interceptor = (original: typeof fetch, ...args: Parameters<typeof fetch>) => Promise<Response>

const predictionURLPattern = new RegExp('https://ml-api.superannotate.com/segmentation/predict_polygons_from_url')
const uploadURLPattern = new RegExp('https://assets-provider.superannotate.com/api/v4/items/\\d+/annotations/upload')
const telemetryURLPattern = new RegExp('https://telemetry.superannotate.com/api/v1/logs')

const intercept_fetch: Interceptor = async (original, ...args) => {
    const resource = args[0]

    const url = resource instanceof Request ? resource.url : String(resource)

    if (telemetryURLPattern.test(url)) {
        console.debug('[intercepted fetch] intercepting telemetry', { resource })
        return intercept_telemetry(original, ...args)
    }

    if (uploadURLPattern.test(url)) {
        console.debug('[intercepted fetch] intercepting upload', { resource })
        return intercept_upload(original, ...args)
    }

    if (predictionURLPattern.test(url)) {
        console.debug('[intercepted fetch] intercepting prediction', { resource })
        return intercept_prediction(original, ...args)
    }

    return original(...args)
}

// TODO: feature flag/options to allow overridden
export const overrideFetch = () => {
    if ((overrideFetch as any)['called']) return

    const url = 'https://editor.superannotate.com'
    assert(globals.window.self.location.origin === url, `this script must run in the top frame context`)

    const originalFetch = globals.window.fetch
    globals.window.fetch = async (...args) => {
        return intercept_fetch(originalFetch, ...args)
    }

    (overrideFetch as any)['called'] = true
}

// prefetching related
window.addEventListener('message', async (event) => {
    if (event.origin !== 'https://vector.superannotate.com') return

    const { _superduperannotate, id, value } = event.data || {}
    if (!_superduperannotate || !id) return

    const imgURL: string = value
    const response = await globals.window.fetch(
        'https://ml-api.superannotate.com/segmentation/predict_polygons_from_url?url=' + encodeURIComponent(imgURL),
        {
            method: 'POST',
        },
        //@ts-expect-error ts(2554)
        true
    )

    event.source!.postMessage(
        { _superduperannotate, id, value: await response.json() },
        { targetOrigin: event.origin }
    )
})
