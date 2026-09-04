import { intro } from './intro.js'
import { architecture } from './architecture.js'
import { database } from './database.js'
import { featuresHead, featCreate, featDetail, featSearch, featImportExport, featNotify } from './features.js'
import { authBasic, authDeep } from './auth.js'
import { schedCreateDeep, uptimeDeep, notifyDeep } from './scheduling.js'
import { cdcDeep } from './cdc.js'
import { deployment } from './deployment.js'

export const slides = [
  ...intro,
  ...architecture,
  ...database,
  // 03 — mỗi tính năng: cơ bản (screenshot + sequence gọn) rồi chuyên sâu
  ...featuresHead,
  ...authBasic,
  ...authDeep,
  ...featCreate,
  ...schedCreateDeep,
  ...featDetail,
  ...uptimeDeep,
  ...cdcDeep,
  ...featSearch,
  ...featImportExport,
  ...featNotify,
  ...notifyDeep,
  ...deployment,
]
