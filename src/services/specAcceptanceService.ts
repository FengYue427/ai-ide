interface FileLike {
  name: string
  content: string
}

export function appendToSpecAcceptanceFile<T extends FileLike>(
  files: T[],
  specAcceptancePath: string,
  addition: string,
): T[] {
  if (!addition) return files
  return files.map((file) =>
    file.name === specAcceptancePath
      ? { ...file, content: `${file.content}${addition}` }
      : file,
  )
}
