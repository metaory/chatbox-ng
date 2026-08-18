// 处理前端代码被剽窃的情况

import platform from '../platform'
import { CHATBOX_BUILD_TARGET } from '../variables'

switch (CHATBOX_BUILD_TARGET) {
  case 'mobile_app':
    break
  case 'unknown':
    if (platform.type === 'web') {
      // protect() // 迁移过程中，暂时关闭保护
    }
    break
}

function protect() {
  setInterval(() => {
    if (Math.random() < 0.1) {
      // 如果当前地址不正确，就跳转到正确地址
      const hostname = window.location.hostname
      if (hostname !== simpleDecrypt(lh) && !hostname.endsWith(simpleDecrypt(ca))) {
        setTimeout(toHomePage, 300)
      }
    }
  }, 1400)
}

function toHomePage() {
  const l = simpleDecrypt(ll)
  const h = simpleDecrypt(hh)
  ;(window as any)[l][h] = simpleDecrypt(hf)
}

const lh = '^_QR]]YAB' // localhost
const ca = 'QXSGSZN\x1fCYVB\\T^VU\x1bFSQRG\x19VUD' // chatbox-unbundled.pages.dev
const hf = 'ZDFCB\x0f\x19\x1dU_UCP_J\x1eD[TGXSXRV\x1eBRVPE\x1cRRB\x18' // https://chatbox-unbundled.pages.dev/

const ll = '^_QRE\\Y\\' // location
const hh = 'ZBWU' // href

// 简单的映射加密算法
function simpleEncrypt(text: string): string {
  const key = '202315626747'
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(c)
  }
  return result
}

function simpleDecrypt(text: string): string {
  return simpleEncrypt(text)
}
