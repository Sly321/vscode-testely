import { TextDocument } from "vscode";
import { File } from "../generators/File";

export function fileFromTextDocument(textDocument: TextDocument): File {
	const file = new File(textDocument.fileName)
	file.setContent(textDocument.getText())
	file.setExist(true)
	return file
}