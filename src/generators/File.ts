import { parse } from "path";

export class File {
    private path: string;
    private dir: string;
    private fileExists: boolean = false;
    private baseName: string;
    private content: string

    constructor(path: string) {
        const { dir, base } = parse(path);
        this.path = path;
        this.dir = dir;
        this.baseName = base;
        this.content = ""
    }

    public setExist(value: boolean) {
        this.fileExists = value;
        return this;
    }

    public exists(): boolean {
        return this.fileExists;
    }

    public getDirectory(): string {
        return this.dir;
    }

    /** The file name including extension (if any) such as `index.html`.  */
    public getBaseName(): string {
        return this.baseName;
    }

    public getPath(): string {
        return this.path;
    }

    public setContent(content: string): void {
        this.content = content
    }

    public getContent(): string {
        return this.content
    }
}
