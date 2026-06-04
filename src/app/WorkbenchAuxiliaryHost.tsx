import { useIDEStore } from '../store/ideStore'
import { getActiveAuxiliarySlot } from '../lib/workbenchLayout'
import SearchPanel from '../components/SearchPanel'
import PreviewPanel from '../components/PreviewPanel'
import CodeReviewPanel from '../components/CodeReviewPanel'
import PerformancePanel from '../components/PerformancePanel'
type WorkbenchAuxiliaryHostProps = {
  files: { name: string; content: string }[]
  onSearchNavigate: (file: string, line: number, column?: number) => void
  onSearchReplace: (file: string, newContent: string) => void
  onCloseAuxiliary: () => void
  onTestsGenerated?: (fileName: string, content: string) => void
  isRunning: boolean
  output: string[]
}

export function WorkbenchAuxiliaryHost({
  files,
  onSearchNavigate,
  onSearchReplace,
  onCloseAuxiliary,
  onTestsGenerated,
  isRunning,
  output,
}: WorkbenchAuxiliaryHostProps) {
  const showSearchPanel = useIDEStore((s) => s.showSearchPanel)
  const showPreview = useIDEStore((s) => s.showPreview)
  const showCodeReview = useIDEStore((s) => s.showCodeReview)
  const showPerformance = useIDEStore((s) => s.showPerformance)
  const activeFile = useIDEStore((s) => s.activeFile)
  const activeEditorSurface = useIDEStore((s) => s.activeEditorSurface)
  const fileTabs = useIDEStore((s) => s.files)
  const aiConfig = useIDEStore((s) => s.aiConfig)

  const slot = getActiveAuxiliarySlot({
    showSearchPanel,
    showPreview,
    showCodeReview,
    showPerformance,
  })

  if (slot === 'none') return null

  const currentFile = activeEditorSurface === 'file' ? fileTabs[activeFile] : null

  return (
    <aside className="workbench-auxiliary" aria-label="Workbench auxiliary panel">
      <div className="workbench-auxiliary__inner">
        {slot === 'search' ? (
          <SearchPanel
            layout="docked"
            files={files}
            onNavigate={onSearchNavigate}
            onReplace={onSearchReplace}
            onClose={onCloseAuxiliary}
          />
        ) : null}

        {slot === 'preview' && currentFile ? (
          <PreviewPanel
            content={currentFile.content}
            fileName={currentFile.name}
            onClose={onCloseAuxiliary}
            onRefresh={() => {}}
          />
        ) : null}

        {slot === 'codeReview' && currentFile ? (
          <CodeReviewPanel
            layout="docked"
            code={currentFile.content}
            language={currentFile.language}
            filename={currentFile.name}
            aiConfig={aiConfig}
            onClose={onCloseAuxiliary}
            onTestsGenerated={onTestsGenerated}
          />
        ) : null}

        {slot === 'performance' ? (
          <PerformancePanel
            layout="docked"
            isRunning={isRunning}
            output={output}
            onClose={onCloseAuxiliary}
          />
        ) : null}
      </div>
    </aside>
  )
}
