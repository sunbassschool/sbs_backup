export function parseDriveId(url?: string): string | null {
  if (!url) return null

  // uc?id=XXX
  const ucMatch = url.match(/uc\?id=([^&]+)/)
  if (ucMatch) return ucMatch[1]

  // file/d/XXX
  const fileMatch = url.match(/file\/d\/([^/]+)/)
  if (fileMatch) return fileMatch[1]

  return null
}

export function driveDownload(url?: string): string | null {
  const id = parseDriveId(url)
  if (!id) return url || null
  return `https://drive.google.com/uc?export=download&id=${id}`
}

export function drivePreview(url?: string): string | null {
  const id = parseDriveId(url)
  if (!id) return url || null
  return `https://drive.google.com/file/d/${id}/preview`
}
