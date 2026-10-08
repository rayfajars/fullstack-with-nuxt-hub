import { blob } from '@nuxthub/blob'

export default eventHandler(async (event) => {
  const raw = getRouterParam(event, 'pathname') || ''
  const pathname = decodeURIComponent(raw)

  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: 'pathname is required' })
  }

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

  // HEAD: status 200 + header, tanpa body
  setResponseStatus(event, 200)
  if (meta.contentType) {
    setHeader(event, 'content-type', meta.contentType)
  }
  if (meta.size != null) {
    setHeader(event, 'content-length', String(meta.size))
  }
  return sendNoContent(event, 200)
})
