import * as vscode from 'vscode'
import { CommandManager } from './vscode/CommandManager'

export async function activate(context: vscode.ExtensionContext) {

	const disposable = [
		vscode.commands.registerCommand(
			'lin.uploadImageFromExplorer',
			async () => await CommandManager.uploadImageFromExplorer()
		),
		vscode.commands.registerCommand(
			'lin.uploadImageFromClipboard',
			async () => await CommandManager.uploadImageFromClipboard()
		),
	]

	context.subscriptions.push(...disposable)

	return context
}

export function deactivate() { }
