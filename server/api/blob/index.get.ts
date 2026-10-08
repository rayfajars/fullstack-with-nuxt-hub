import { blob } from '@nuxthub/blob'

export default eventHandler(async () => {
  // list semua di prefix photos (paginasi sederhana kalau ada cursor)
  const items: Array<{
    pathname: string
    size?: number
    contentType: string | undefined
    uploadedAt: Date
    url: string
  }> = []

  let cursor: string | undefined
  do {
    const page = await blob.list({ prefix: 'photos', cursor, limit: 1000 })
    for (const b of page.blobs) {
      items.push({
        pathname: b.pathname,
        size: b.size,
        contentType: b.contentType,
        uploadedAt: b.uploadedAt,
        url: `/images/${b.pathname}`,
      })
    }
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)

  return items
})
