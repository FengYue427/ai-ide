export type FileTreeNode = {
  name: string
  path: string
  kind: 'file' | 'folder'
  fileIndex?: number
  children?: FileTreeNode[]
}

export type FlatFileTreeRow =
  | {
      kind: 'folder'
      path: string
      name: string
      depth: number
      expanded: boolean
    }
  | {
      kind: 'file'
      path: string
      name: string
      depth: number
      fileIndex: number
    }

export function buildFileTree(
  entries: Array<{ file: { name: string }; index: number }>,
): FileTreeNode[] {
  const root: FileTreeNode[] = []

  entries.forEach(({ file, index: idx }) => {
    const parts = file.name.split('/').filter(Boolean)
    let current = root
    let currentPath = ''

    parts.forEach((part, partIndex) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLeaf = partIndex === parts.length - 1
      let node = current.find((item) => item.name === part && item.kind === (isLeaf ? 'file' : 'folder'))
      if (!node) {
        node = isLeaf
          ? { name: part, path: currentPath, kind: 'file', fileIndex: idx }
          : { name: part, path: currentPath, kind: 'folder', children: [] }
        current.push(node)
      }
      if (!isLeaf) current = node.children!
    })
  })

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach((node) => node.children && sortNodes(node.children))
  }

  sortNodes(root)
  return root
}

export function collectFolderPaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = []
  for (const node of nodes) {
    if (node.kind === 'folder') {
      paths.push(node.path)
      if (node.children) paths.push(...collectFolderPaths(node.children))
    }
  }
  return paths
}

export function flattenVisibleFileTree(
  nodes: FileTreeNode[],
  expandedFolders: Set<string>,
  depth = 0,
): FlatFileTreeRow[] {
  const rows: FlatFileTreeRow[] = []

  for (const node of nodes) {
    if (node.kind === 'folder') {
      const expanded = expandedFolders.has(node.path)
      rows.push({
        kind: 'folder',
        path: node.path,
        name: node.name,
        depth,
        expanded,
      })
      if (expanded && node.children) {
        rows.push(...flattenVisibleFileTree(node.children, expandedFolders, depth + 1))
      }
      continue
    }

    rows.push({
      kind: 'file',
      path: node.path,
      name: node.name,
      depth,
      fileIndex: node.fileIndex ?? 0,
    })
  }

  return rows
}
