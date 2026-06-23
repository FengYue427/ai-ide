type FileLike = { name: string; content: string; language?: string }

export function markSpecTaskDoneByText(content: string, taskText: string): string {
  const needle = taskText.trim().toLowerCase()
  const lines = content.split(/\r?\n/)
  let changed = false
  const next = lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('- [ ]')) return line
    const text = trimmed.replace(/^[-*]\s+\[[ xX]\]\s+/, '').trim().toLowerCase()
    if (text === needle || (needle.length >= 8 && text.includes(needle.slice(0, 12)))) {
      changed = true
      return line.replace(/^(\s*[-*]\s+)\[ \]/, '$1[x]')
    }
    return line
  })
  return changed ? next.join('\n') : content
}

export function markSpecTaskDone<T extends FileLike>(
  files: T[],
  tasksPath: string,
  taskText: string,
): T[] {
  const target = tasksPath.trim()
  return files.map((file) => {
    if (file.name.replace(/\\/g, '/') !== target.replace(/\\/g, '/')) return file
    const next = markSpecTaskDoneByText(file.content, taskText)
    if (next === file.content) return file
    return { ...file, content: next }
  })
}
