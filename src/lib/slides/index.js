import { intro } from './intro.js'
import { architecture } from './architecture.js'
import { database } from './database.js'
import { scheduling } from './scheduling.js'
import { features } from './features.js'
import { auth } from './auth.js'
import { deployment } from './deployment.js'

export const slides = [
  ...intro,
  ...architecture,
  ...database,
  ...scheduling,
  ...features,
  ...auth,
  ...deployment,
]
