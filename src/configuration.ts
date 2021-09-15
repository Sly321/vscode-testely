import { ConfigurationChangeEvent, workspace } from "vscode"

const configKey = "testely"

export class Configuration {
    private configs = {
        testLocation: new SingletonConfigValue<TestLocation>("testLocation"),
        testDirectoryName: new SingletonConfigValue<TestLocation>("testDirectoryName"),
    }

    constructor() {
        workspace.onDidChangeConfiguration(this.onConfigChange, this)
    }

    private onConfigChange(event: ConfigurationChangeEvent) {
        if (event.affectsConfiguration(configKey)) {
            Object.values(this.configs).forEach((config) => config.renew())
        }
    }

    public getTestLocation(): string {
        return this.configs.testLocation.get()
    }

    public getTestDirectoryName(): string {
        return this.configs.testDirectoryName.get()
    }
}

export enum TestLocation {
    SameDirectory = "same directory",
    SameDirectoryNested = "same directory (nested)",
    RootTestFolderFlat = "root test folder (flat)",
    RootTestFolderNested = "root test folder (nested)",
}

class SingletonConfigValue<T> {
    private value: T | undefined

    constructor(private key: string) {
        this.value = this.getConfigValue()
    }

    private getConfigValue(): T | undefined {
        return workspace.getConfiguration(configKey).get<T>(this.key)
    }

    public renew() {
        this.value = this.getConfigValue()
    }

    public get(): T {
        return this.value!
    }

    public getKey(): string {
        return `${configKey}.${this.key}`
    }
}

export const configuration = new Configuration()
