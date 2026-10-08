<script setup lang="ts">
type Photo = {
  pathname: string
  size?: number
  contentType?: string
  uploadedAt: string
  url: string
}

const { data: photos, refresh, error: listError, pending } = await useFetch<Photo[]>('/api/blob')

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const uploadError = ref('')
const uploading = ref(false)

const selected = ref<Photo | null>(null)
const detailPending = ref(false)
const detailError = ref('')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] || null
  selectedFile.value = file
  uploadError.value = ''

  // revoke preview lama biar gak leak
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  if (file) {
    previewUrl.value = URL.createObjectURL(file)
  }
}

function clearSelection() {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  if (fileInput.value) fileInput.value.value = ''
}

async function uploadPhoto() {
  if (!selectedFile.value || uploading.value) return
  uploadError.value = ''
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', selectedFile.value)
    await $fetch('/api/blob', { method: 'POST', body })
    clearSelection()
    await refresh()
  }
  catch (err: unknown) {
    uploadError.value = extractError(err)
  }
  finally {
    uploading.value = false
  }
}

async function openDetail(item: Photo) {
  detailError.value = ''
  detailPending.value = true
  selected.value = null
  try {
    // fetch metadata segar dari API detail
    selected.value = await $fetch<Photo>(`/api/blob/${item.pathname}`)
  }
  catch (err: unknown) {
    detailError.value = extractError(err)
  }
  finally {
    detailPending.value = false
  }
}

function closeDetail() {
  selected.value = null
  detailError.value = ''
}

function formatSize(bytes?: number) {
  if (bytes == null) return '-'
  return `${(bytes / 1024).toFixed(1)} KB`
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  }
  catch {
    return iso
  }
}

function extractError(err: unknown): string {
  const e = err as { data?: { statusMessage?: string; message?: string }; statusMessage?: string; message?: string }
  return e?.data?.statusMessage || e?.data?.message || e?.statusMessage || e?.message || 'Request failed'
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <main class="wrap">
    <p class="nav"><NuxtLink to="/">← Users</NuxtLink></p>

    <section class="card">
      <h2>Upload photo</h2>
      <form class="form" @submit.prevent="uploadPhoto">
        <label>
          Image
          <input ref="fileInput" type="file" accept="image/*" @change="onFileChange">
        </label>
        <img v-if="previewUrl" :src="previewUrl" alt="preview" class="preview">
        <button type="submit" :disabled="uploading || !selectedFile">
          {{ uploading ? 'Uploading…' : 'Upload' }}
        </button>
      </form>
      <p v-if="uploadError" class="error">{{ uploadError }}</p>
    </section>

    <section class="card">
      <h2>Gallery</h2>
      <p v-if="pending">Loading…</p>
      <p v-else-if="listError" class="error">{{ listError.message || 'Failed to load photos' }}</p>
      <p v-else-if="!photos?.length">No photos yet.</p>
      <ul v-else class="grid">
        <li v-for="item in photos" :key="item.pathname" class="thumb">
          <button type="button" class="thumb-btn" @click="openDetail(item)">
            <img :src="item.url" :alt="item.pathname">
            <span>{{ item.pathname.split('/').pop() }}</span>
          </button>
        </li>
      </ul>
    </section>

    <section v-if="detailPending || selected || detailError" class="card detail">
      <div class="detail-head">
        <h2>Detail</h2>
        <button type="button" @click="closeDetail">Close</button>
      </div>
      <p v-if="detailPending">Loading…</p>
      <p v-else-if="detailError" class="error">{{ detailError }}</p>
      <div v-else-if="selected" class="detail-body">
        <img :src="selected.url" :alt="selected.pathname" class="large">
        <div class="meta">
          <strong>{{ selected.pathname.split('/').pop() }}</strong>
          <span>path: {{ selected.pathname }}</span>
          <span>size: {{ formatSize(selected.size) }}</span>
          <span>type: {{ selected.contentType || '-' }}</span>
          <span>uploaded: {{ formatDate(selected.uploadedAt) }}</span>
          <span>url: {{ selected.url }}</span>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.wrap { max-width: 720px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
.nav { margin-bottom: 1rem; }
.nav a { color: #06c; text-decoration: none; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
.form { display: grid; gap: 0.5rem; }
.form label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
input { padding: 0.4rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 0.4rem 0.75rem; cursor: pointer; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.error { color: #b00020; margin: 0.5rem 0 0; }
.preview { max-width: 240px; max-height: 180px; object-fit: contain; border: 1px solid #eee; border-radius: 4px; background: #fafafa; }
.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
.thumb { margin: 0; }
.thumb-btn { display: grid; gap: 0.35rem; width: 100%; padding: 0.4rem; border: 1px solid #eee; border-radius: 6px; background: #fff; text-align: left; }
.thumb-btn img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; background: #f0f0f0; }
.thumb-btn span { font-size: 0.75rem; color: #444; word-break: break-all; }
.detail-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.detail-head h2 { margin: 0; }
.detail-body { display: grid; gap: 0.75rem; margin-top: 0.75rem; }
.large { max-width: 100%; max-height: 360px; object-fit: contain; border: 1px solid #eee; border-radius: 6px; background: #fafafa; }
.meta { display: grid; gap: 0.15rem; font-size: 0.9rem; }
.meta strong { font-size: 1rem; }
</style>
