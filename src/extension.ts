import { existsSync } from "fs";
import { parse, resolve } from "path";
import * as vscode from "vscode";
import { createTestCommand, showDocument } from "./commands/createTest";
import { configuration } from "./configuration";
import { TypeScriptMockFileWriter } from "./generators/implementations/filewriter/TypeScriptMockFileWriter";
import { assureDir } from "./helpers/fs-ultra";
import { TypeScriptParser } from "./helpers/typescriptParser";

const TYPESCRIPT: vscode.DocumentFilter = { language: 'typescript' }

export class CompleteActionProvider implements vscode.CodeActionProvider {

    public async provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): Promise<vscode.Command[]> {

        try {
            const keyword = document.getText(range);
            // const cachedExports: IExport[] = await DefinitionProvider.instance.getCachedExportsAsync();

            if (TypeScriptParser.isTypeStatement(document, keyword)) {
                return [
                    {
                        arguments: [document, keyword],
                        command: 'testely.createMockData',
                        title: `Create mock for ${keyword}.`
                    }
                ];
            }

        } catch (err) {

        }
        
        return [];
    }
}

export function activate(context: vscode.ExtensionContext) {
    vscode.commands.executeCommand("setContext", "testely.supportedLangIds", ["typescript", "typescriptreact", "java"])
    
    let disposable = vscode.commands.registerCommand("testely.createTest", (args, thisArg) => {
        if (args) {
            vscode.workspace.openTextDocument(args).then((document) => {
                return createTestCommand(document)
            })
        } else {
            const { document } = vscode.window.activeTextEditor || {}

            if (!document) {
                return vscode.window.showErrorMessage("Could not manage to find file for test creation.")
            }
            
            return createTestCommand(document)
        }
    })

    let disposable2 = vscode.commands.registerCommand("testely.openSourceFile", (args, thisArg) => {
        if (args) {
            vscode.workspace.openTextDocument(args).then((document) => {
                return createTestCommand(document)
            })
        } else {
            const { document } = vscode.window.activeTextEditor || {}
            
            if (!document) {
                return vscode.window.showErrorMessage("Could not manage to find file for test creation.")
            }

            return createTestCommand(document)
        }
    })
    
    if (configuration.getExperimentalMockData()) {
        context.subscriptions.push(vscode.languages.registerCodeActionsProvider(TYPESCRIPT, new CompleteActionProvider()))

        const mockDataCreator = vscode.commands.registerCommand("testely.createMockData", async function(this: any, document: vscode.TextDocument, keyword: string) {
            const [properties, imports] = await TypeScriptParser.getResolvedTypeField(document, keyword)
            const { base, dir } = parse(document.fileName)
            const filePath = resolve(dir, "..", "data", "__mocks__", `mock${capitalize(base)}`);
            const file = parse(filePath)
            
            let exists = false
            assureDir(file.dir)
            
            if (existsSync(filePath)) {
                exists = true
            }
            
            const writer = new TypeScriptMockFileWriter(filePath, document)
            await writer.prepare({ properties, imports, keyword })
            
            if (exists) {
                await writer.append()
            } else {
                await writer.write()
            }
            
            showDocument(filePath)
        })

        context.subscriptions.push(mockDataCreator)
    }

    context.subscriptions.push(disposable, disposable2)
}

export function deactivate() {}

const capitalize = (str: string) => {
    if(typeof str === 'string') {
        return str.replace(/^\w/, c => c.toUpperCase());
    } else {
        return '';
    }
};