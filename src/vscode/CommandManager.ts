/* https://help.aliyun.com/zh/oss/developer-reference/upload-a-local-file#section-l5s-l7g-bdo */
import * as vscode from "vscode"
import OSS from 'ali-oss'
import path from "path"
import fs from 'fs'
import getClipboardImage from "../lib/getClipboardImage"

export class CommandManager {
    static async uploadImageFromClipboard() {
        // 通过 PowerShell 脚本缓存剪切板图片
        const imgPath = await getClipboardImage()

        if (!imgPath) {
            vscode.window.showInformationMessage('剪切板无图片')
            return
        }

        const res = await uploadFile(imgPath)

        insertUrl([res?.url])
    }

    static async uploadImageFromExplorer() {
        const result = await vscode.window.showOpenDialog({
            filters: {
                Images: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg']
            },
            canSelectMany: true
        })

        const promiseArr: Array<Promise<OSS.PutObjectResult | undefined>> = []
        const urlArr: Array<string> = []

        if (result) {
            result.map((item) => {
                const filePath = item.fsPath
                const res = uploadFile(filePath)
                promiseArr.push(res)
            })
        }

        const resArr = await Promise.allSettled(promiseArr)

        resArr.forEach(res => {
            if (res.status !== 'fulfilled') {
                urlArr.push('')
                return
            }
            urlArr.push(res.value?.url || '')
        })

        insertUrl(urlArr)
    }
}





/**
 * 借助 ali-oss 来上传单个文件
 * @param filePath 本地待上传文件完整路径
 * @param destFilePath 服务端的文件完整路径。支持默认生成
 * @returns
 */
export async function uploadFile(filePath: string, destFilePath?: string) {

    return await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: '正在上传图片……',
            cancellable: true
        }, async () => {

            const keyArgs = get4KeyArgs()
            if (!keyArgs) return

            if (!destFilePath) {
                destFilePath = generateDestFilePath(filePath)
            }

            const client = new OSS(keyArgs)

            try {
                const result = await client.put(destFilePath, path.normalize(filePath))
                return result
            } catch (e: any) {
                vscode.window.showErrorMessage('上传失败: ' + e.message + '如果是 502 错误，可能是因为开了代理')
                console.error(e)
                return
            }
        })
}


/**
 * 读取四项关键值。可以从 setting 中读取，也可以从 json 文件中读取
 * @returns
 */
function get4KeyArgs() {
    const config = vscode.workspace.getConfiguration('lin')

    const enableConfigPath = config.get<boolean>('enableConfigPath')

    if (!enableConfigPath) {
        const region = config.get<string>('region')
        const accessKeyId = config.get<string>('accessKeyId')
        const accessKeySecret = config.get<string>('accessKeySecret')
        const bucket = config.get<string>('bucket')

        if (!region || !accessKeyId || !accessKeySecret || !bucket) {
            vscode.window.showErrorMessage('请检查四项关键值')
            return
        }
        return { region, accessKeyId, accessKeySecret, bucket }
    }

    const configPath = config.get<string>('configPath')
    if (!configPath) {
        vscode.window.showErrorMessage('请填写 lin.configPath 配置项')
        return
    }
    if (!fs.existsSync(configPath)) {
        vscode.window.showErrorMessage(`configPath: ${configPath} 不存在`)
        return
    }

    const configRaw = fs.readFileSync(configPath, 'utf8')
    let configJson: any = null
    try {
        configJson = JSON.parse(configRaw)
    } catch (error) {
        vscode.window.showErrorMessage('解析 json 格式错误。\n')
    }
    try {
        const region = configJson.region
        const accessKeyId = configJson.accessKeyId
        const accessKeySecret = configJson.accessKeySecret
        const bucket = configJson.bucket

        return { region, accessKeyId, accessKeySecret, bucket }
    } catch (error) {
        vscode.window.showErrorMessage('请检查四项关键值。\n')
    }


}




function insertUrl(urlArr: Array<string | undefined>) {
    // 获取当前激活的文本编辑器
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        return // 如果没有激活的文本编辑器，则不进行任何操作
    }

    let insertStr = ''
    urlArr.forEach(url => {
        if (!url) {
            insertStr += `![](上传失败)\n`
        } else {
            insertStr += `![](${url})\n`
        }
    })

    // 获取当前光标位置
    let position = editor.selection.active

    // 插入内容
    editor.edit(editBuilder => {
        editBuilder.insert(position, insertStr)
    })
}







function generateFileName() {
    const date = new Date()
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = (date.getDate()).toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const mu = date.getMinutes().toString().padStart(2, '0')
    const mi = date.getMilliseconds().toString().padStart(3, '0')
    const rd = Math.random().toString(16).substring(2, 5)
    return `${y}-${m}-${d}__${h}-${mu}-${mi}__${rd}`
}

function generateDestFilePath(filePath: string): string {
    const folder = vscode.workspace.getConfiguration('lin').get<string>('destFileFolder', 'blog/')
    const extname = path.extname(filePath)
    const filename = generateFileName() + extname
    const destPath = path.join(folder, filename).replace('\\', '/')

    return destPath
}
