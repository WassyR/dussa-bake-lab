import { renderToPipeableStream, renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { PassThrough } from 'node:stream'
import App from './App'

/** Wait for lazy route modules so the saved page contains actual content. */
export function render(path, initialCatalog) {
  return new Promise((resolve, reject) => {
    const output = new PassThrough()
    output.resume()
    // A second, synchronous pass uses the now-resolved lazy modules. This
    // avoids saving streaming fallback segments that depend on inline JS.
    output.on('end', () => {
      try { resolve(renderToString(<StaticRouter location={path}><App initialCatalog={initialCatalog} /></StaticRouter>)) }
      catch (error) { reject(error) }
    })
    output.on('error', reject)
    const stream = renderToPipeableStream(<StaticRouter location={path}><App initialCatalog={initialCatalog} /></StaticRouter>, {
      onAllReady() { stream.pipe(output) },
      onError(error) { reject(error) },
    })
  })
}
