/**
 * File System Access API (Chromium / Edge). Not in default TS DOM lib yet.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite' | 'readwrite-unsafe'
}

interface FileSystemDirectoryHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}

interface Window {
  showDirectoryPicker(options?: {
    id?: string
    mode?: 'read' | 'readwrite'
    startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  }): Promise<FileSystemDirectoryHandle>
}
