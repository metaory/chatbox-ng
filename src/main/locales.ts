export default class Locale {
  t(key: TranslationKey): string {
    return translations[key]
  }
}

type TranslationKey = keyof typeof translations

const translations = {
  'Show/Hide': 'Show/Hide',
  Exit: 'Exit',
  New_Version: 'New Version',
  Restart: 'Restart',
  Later: 'Later',
  App_Update: 'App Update',
  New_Version_Downloaded: 'New version has been downloaded, restart the application to apply the update.',
  Copy: 'Copy',
  Cut: 'Cut',
  Paste: 'Paste',
  PasteAsPlainText: 'Paste as Plain Text',
  ReplaceWith: 'Replace with',
  ResetZoom: 'Reset Zoom',
  ZoomIn: 'Zoom In',
  ZoomOut: 'Zoom Out',
}
