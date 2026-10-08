import { blob } from '@nuxthub/blob'

export default eventHandler(async (event) => {
  const raw = getRouterParam(event, 'pathname') || ''
  const pathname = decodeURIComponent(raw)

  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: 'pathname is required' })
  }

  // metadata aja (bukan serve file)
  let meta
  try {
    meta = await blob.head(pathname)
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'blob not found' })
  }

  if (!meta) {
    throw createError({ statusCode: 404, statusMessage: 'blob not found' })
  }

  return {
    pathname: meta.pathname,
    size: meta.size,
    contentType: meta.contentType,
    uploadedAt: meta.uploadedAt,
    url: `/images/${meta.pathname}`,
  }
})
