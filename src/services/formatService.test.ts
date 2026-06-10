import { describe, expect, it } from 'vitest'
import { formatService } from './formatService'

describe('formatService', () => {
  it('indents java brace blocks', async () => {
    const input = `public class Demo {
void run() {
if (true) {
System.out.println("ok");
}
}
}`
    const { code: formatted } = await formatService.formatCode(input, 'java')
    expect(formatted).toContain('    void run()')
    expect(formatted).toContain('        if (true)')
  })

  it('reports brace formatter for java', () => {
    expect(formatService.usesBraceFormatter('java')).toBe(true)
    expect(formatService.getOptionsForLanguage('java').tabWidth).toBe(4)
  })
})
