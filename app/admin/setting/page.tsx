import { AdminSetting } from '~/components/admin/setting/Container'
import { kunMetadata } from './metadata'
import {
  kunGetDisableRegisterStatusActions,
  kunGetFeatureAccessActions,
  kunGetRedirectConfigActions
} from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import type { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const [setting, response, featureAccess] = await Promise.all([
    kunGetRedirectConfigActions(),
    kunGetDisableRegisterStatusActions(),
    kunGetFeatureAccessActions()
  ])

  if (
    typeof response === 'string' ||
    typeof setting === 'string' ||
    typeof featureAccess === 'string'
  ) {
    const errorText =
      typeof response === 'string'
        ? response
        : typeof setting === 'string'
          ? setting
          : typeof featureAccess === 'string'
            ? featureAccess
            : ''
    return <ErrorComponent error={errorText} />
  }

  return (
    <AdminSetting
      setting={setting}
      disableRegister={response.disableRegister}
      featureAccess={featureAccess}
    />
  )
}
