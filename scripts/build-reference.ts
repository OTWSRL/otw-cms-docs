import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractReference } from './reference/extract.ts'

// Run before dev, build and typecheck: the Code Reference is read from the installed packages, so
// it always describes the versions this site runs.
const root = join(import.meta.dirname, '..')
const reference = extractReference(root)
writeFileSync(
  join(root, 'src', 'docs', 'reference.generated.json'),
  `${JSON.stringify(reference)}\n`,
)
const versions = reference.packages.map((pkg) => `${pkg.name}@${pkg.version}`).join(', ')
console.log(`docs: reference for ${reference.extensions.length} extension points from ${versions}`)
