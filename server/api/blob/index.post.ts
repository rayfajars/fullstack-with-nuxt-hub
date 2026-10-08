import { blob, ensureBlob } from '@nuxthub/blob'

export default eventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file')

  if (!file || !(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: 'file is required' })
  }

  // validasi gambar max 2MB
  try {
    ensureBlob(file, { maxSize: '2MB', types: ['image'] })
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'invalid file'
    throw createError({ statusCode: 400, statusMessage: message })
  }

  const uploaded = await blob.put(file.name, file, {
    prefix: 'photos',
    addRandomSuffix: true,
  })

  return {
    pathname: uploaded.pathname,
    contentType: uploaded.contentType,
    size: uploaded.size,
    url: `/images/${uploaded.pathname}`,
  }
})
