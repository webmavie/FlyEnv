import MenuEN from './en/menu'
import MenuZH from './zh/menu'
import MenuAZ from './az/menu'
import MenuAR from './ar/menu'
import UpdateEN from './en/update'
import UpdateZH from './zh/update'
import UpdateAZ from './az/update'
import UpdateAR from './ar/update'

import { createI18n } from 'vue-i18n'
import type { I18n } from 'vue-i18n'

export const lang = {
  en: {
    menu: MenuEN,
    update: UpdateEN
  },
  zh: {
    menu: MenuZH,
    update: UpdateZH
  },
  az: {
    menu: MenuAZ,
    update: UpdateAZ
  },
  ar: {
    menu: MenuAR,
    update: UpdateAR
  }
}

let i18n: I18n

export const AppI18n = (l?: string): I18n => {
  if (!i18n) {
    i18n = createI18n({
      legacy: true,
      locale: l || 'en',
      fallbackLocale: 'en',
      messages: lang
    })
  }
  if (l) {
    i18n.global.locale = l
  }
  return i18n
}

export const I18nT = (key: string, ...args: any): string => {
  // @ts-ignore
  return i18n.global.t(key, ...args)
}
