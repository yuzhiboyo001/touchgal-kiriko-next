import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { getFeatureAccess } from '~/lib/featureAccess'

export async function GET(req: NextRequest) {
  const payload = await verifyHeaderCookie(req)
  const access = await getFeatureAccess()

  const role = payload?.role ?? 0
  return NextResponse.json({
    success: true,
    data: {
      publishResource:
        role >= 4 ||
        (role >= 1 && role <= 3 && access.publishResource[role as 1 | 2 | 3]),
      dlsiteImport:
        role >= 4 ||
        (role >= 1 && role <= 3 && access.dlsiteImport[role as 1 | 2 | 3])
    }
  })
}
