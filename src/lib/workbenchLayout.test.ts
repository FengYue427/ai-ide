import { describe, expect, it } from 'vitest'
import {
  getActiveAuxiliarySlot,
  isWorkbenchAuxiliaryOpen,
  patchCloseAuxiliary,
  patchOpenAuxiliary,
  patchOpenChatPanel,
  patchOpenGitPanel,
  patchToggleAuxiliary,
  patchToggleGitPanel,
} from './workbenchLayout'

const emptyAux = {
  showSearchPanel: false,
  showPreview: false,
  showCodeReview: false,
  showPerformance: false,
}

describe('workbenchLayout', () => {
  it('getActiveAuxiliarySlot prefers first match order', () => {
    expect(
      getActiveAuxiliarySlot({ ...emptyAux, showSearchPanel: true, showPreview: true }),
    ).toBe('search')
  })

  it('patchOpenAuxiliary enables only one slot and clears right', () => {
    expect(patchOpenAuxiliary('preview')).toEqual({
      showSearchPanel: false,
      showPreview: true,
      showCodeReview: false,
      showPerformance: false,
      showChatPanel: false,
      showGitPanel: false,
    })
  })

  it('patchToggleAuxiliary closes when same slot active', () => {
    expect(patchToggleAuxiliary('search', { ...emptyAux, showSearchPanel: true })).toEqual(
      patchCloseAuxiliary(),
    )
  })

  it('patchToggleAuxiliary opens when different or none', () => {
    expect(patchToggleAuxiliary('search', emptyAux)).toEqual(patchOpenAuxiliary('search'))
    expect(patchToggleAuxiliary('search', { ...emptyAux, showPreview: true })).toEqual(
      patchOpenAuxiliary('search'),
    )
  })

  it('patchOpenChatPanel clears git and auxiliaries', () => {
    expect(patchOpenChatPanel()).toEqual({
      ...patchCloseAuxiliary(),
      showGitPanel: false,
      showChatPanel: true,
    })
  })

  it('patchOpenGitPanel clears chat and auxiliaries', () => {
    expect(patchOpenGitPanel()).toEqual({
      ...patchCloseAuxiliary(),
      showChatPanel: false,
      showGitPanel: true,
    })
  })

  it('patchToggleGitPanel', () => {
    expect(patchToggleGitPanel({ showGitPanel: true })).toEqual({ showGitPanel: false })
    expect(patchToggleGitPanel({ showGitPanel: false })).toEqual(patchOpenGitPanel())
  })

  it('isWorkbenchAuxiliaryOpen', () => {
    expect(isWorkbenchAuxiliaryOpen({ ...emptyAux, showChatPanel: false, showGitPanel: false })).toBe(
      false,
    )
    expect(
      isWorkbenchAuxiliaryOpen({
        ...emptyAux,
        showPreview: true,
        showChatPanel: false,
        showGitPanel: false,
      }),
    ).toBe(true)
  })
})
