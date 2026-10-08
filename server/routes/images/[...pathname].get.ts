import { blob } from '@nuxthub/blob'

export default eventHandler(async (event) => {
  const raw = getRouterParam(event, 'pathname') || ''
  const pathname = decodeURIComponent(raw)

  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: 'pathname is required' })
  }

  // cek dulu biar 404 rapi (head throw atau null)
  try {
    const meta = await blob.head(pathname)
    if (!meta) {
      throw createError({ statusCode: 404, statusMessage: 'blob not found' })
    }
  }
  catch (err: unknown) {
    const e = err as { statusCode?: number; statusMessage?: string }
    if (e?.statusCode === 404) {
      // normalisasi message
      throw createError({ statusCode: 404, statusMessage: 'blob not found' })
    }
    throw createError({ statusCode: 404, statusMessage: 'blob not found' })
  }

  return blob.serve(event, pathname)
})
