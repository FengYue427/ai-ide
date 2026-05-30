#!/usr/bin/env node
/**
 * Create or update a GitHub Release with UTF-8 body from a markdown file.
 * Usage: node scripts/publish-github-release.mjs <tag> <title> <notesPath>
 * Token: GITHUB_TOKEN / GH_TOKEN, or git credential fill (github.com).
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const [, , tag, title, notesPath] = process.argv
if (!tag || !title || !notesPath) {
  console.error('Usage: node scripts/publish-github-release.mjs <tag> <title> <notesPath>')
  process.exit(1)
}

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN
  const input = 'protocol=https\nhost=github.com\n\n'
  const out = execSync('git credential fill', { input, encoding: 'utf8' })
  const match = out.match(/^password=(.+)$/m)
  if (!match) throw new Error('No GitHub token from git credential')
  return match[1].trim()
}

function fixLinks(body) {
  return body
    .replace(/\.\/V1\.1\.5_MASTER_PLAN\.md/g, 'https://github.com/FengYue427/ai-ide/blob/main/docs/V1.1.5_MASTER_PLAN.md')
    .replace(/\.\/V1\.1\.5_GA_EXECUTION\.md/g, 'https://github.com/FengYue427/ai-ide/blob/main/docs/V1.1.5_GA_EXECUTION.md')
    .replace(/\.\.\/CHANGELOG\.md#115--2026-05-29/g, 'https://github.com/FengYue427/ai-ide/blob/main/CHANGELOG.md#115--2026-05-29')
}

const repo = 'FengYue427/ai-ide'
const token = getToken()
const body = fixLinks(readFileSync(notesPath, 'utf8'))

async function gh(path, { method = 'GET', payload } = {}) {
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(payload ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

const existing = await gh(`/releases/tags/${tag}`)
const payload = { name: title, body, draft: false, prerelease: false }

let release
if (existing?.id) {
  release = await gh(`/releases/${existing.id}`, { method: 'PATCH', payload })
  console.log(`Updated release: ${release.html_url}`)
} else {
  release = await gh('/releases', {
    method: 'POST',
    payload: { tag_name: tag, ...payload, generate_release_notes: false },
  })
  console.log(`Created release: ${release.html_url}`)
}

console.log(`Title OK: ${release.name.startsWith('v1.1.5') ? 'yes' : release.name}`)
