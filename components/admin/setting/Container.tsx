import { Divider } from '@heroui/divider'
import { RedirectSetting } from './RedirectSetting'
import { DisableRegisterSetting } from './DisableRegisterSetting'
import { FeatureAccessSetting } from './FeatureAccessSetting'
import type { AdminRedirectConfig } from '~/types/api/admin'
import type { FeatureAccess } from '~/lib/featureAccess'

interface Props {
  setting: AdminRedirectConfig
  disableRegister: boolean
  featureAccess: FeatureAccess
}

export const AdminSetting = ({
  setting,
  disableRegister,
  featureAccess
}: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">网站设置</h1>
      </div>

      <RedirectSetting setting={setting} />

      <Divider />

      <FeatureAccessSetting access={featureAccess} />

      <Divider />

      <DisableRegisterSetting disableRegister={disableRegister} />
    </div>
  )
}
