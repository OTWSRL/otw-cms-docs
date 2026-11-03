import { withCms } from '@otwdesign/next/config'

// Linked to a checkout of the CMS (create-otw-cms --link), so Turbopack's root must hold both.
const root = '/Users/tahirmehmood/data/www/project data/claude/tahir'

export default withCms({ turbopack: { root }, outputFileTracingRoot: root })
