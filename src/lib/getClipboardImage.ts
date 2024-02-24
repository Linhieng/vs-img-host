// 参考自 https://github.com/PicGo/PicGo-Core
import path from 'node:path'
import fs from 'node:fs'
import os from 'os'
import { spawn } from 'child_process'
import win10ps1 from './clipboard/win10ps1'


const CONFIG_PATH_BASE_DIR = path.join(os.homedir(), '.lin')
const CLIPBOARD_IMAGE_FOLDER = 'clipboard-images'
const CLIPBOARD_IMAGE_PATH = path.join(CONFIG_PATH_BASE_DIR, CLIPBOARD_IMAGE_FOLDER)
const SCRIPT_PATH = path.join(CONFIG_PATH_BASE_DIR, 'win10.ps1')

createScriptFile()


function createScriptFile() {
  if (!fs.existsSync(SCRIPT_PATH)) {
    fs.writeFileSync(
      SCRIPT_PATH,
      win10ps1,
      'utf8'
    )
  }
}

function createImageFolder(): void {
  const folder = CLIPBOARD_IMAGE_PATH
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
  }
}

/**
 * 运行脚本，将剪切板中的图片缓存到 imagePath 中
 * @param scriptPath 脚本路径
 * @param imagePath 缓存文件路径
 */
function runScriptToAcheImg(scriptPath: string, imagePath: string) {
  return spawn('powershell', [
    '-noprofile',
    '-noninteractive',
    '-nologo',
    '-sta',
    '-executionpolicy', 'unrestricted',
    // fix windows 10 native cmd crash bug when "picgo upload"
    // https://github.com/PicGo/PicGo-Core/issues/32
    // '-windowstyle','hidden',
    // '-noexit',
    '-file', scriptPath,
    imagePath
  ])
}


export default async function getClipboardImage() {
  return await new Promise<string | undefined>((resolve: Function): void => {
    // add an clipboard image folder to control the image cache file
    createImageFolder()
    const imagePath = path.join(CLIPBOARD_IMAGE_PATH, `${Date.now()}.png`)
    const execution = runScriptToAcheImg(SCRIPT_PATH, imagePath)

    execution.stdout.on('data', (data: Buffer) => {
      const resultImgPath = data.toString().trim()

      if (!fs.existsSync(resultImgPath)) {
        resolve(undefined)
      } else {
        resolve(resultImgPath)
      }

    })
  })
}
