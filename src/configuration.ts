import { ConfigurationChangeEvent, workspace } from "vscode"

export const EXTENSION_CONFIG_KEY = "testely"

export enum ConfigurationKeys {
    testLocation = "testLocation",
    testDirectoryName = "testDirectoryName",
    experimentalMockData = "experimentalMockData"
}

export class Configuration {
    private configs = {
        testLocation: new SingletonConfigValue<TestLocation>(ConfigurationKeys.testLocation),
        testDirectoryName: new SingletonConfigValue<TestLocation>(ConfigurationKeys.testDirectoryName),
        experimentalMockData: new SingletonConfigValue<boolean>(ConfigurationKeys.experimentalMockData),
    }

    constructor() {
        workspace.onDidChangeConfiguration(this.onConfigChange, this)
    }

    private onConfigChange(event: ConfigurationChangeEvent) {
        if (event.affectsConfiguration(EXTENSION_CONFIG_KEY)) {
            Object.values(this.configs).forEach((config) => config.renew())
        }
    }

    public getTestLocation(): string {
        return this.configs.testLocation.get()
    }

    public getTestDirectoryName(): string {
        return this.configs.testDirectoryName.get()
    }

    public getExperimentalMockData(): boolean {
        return this.configs.experimentalMockData.get()
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
        return workspace.getConfiguration(EXTENSION_CONFIG_KEY).get<T>(this.key)
    }

    public renew() {
        this.value = this.getConfigValue()
    }

    public get(): T {
        return this.value!
    }

    public getKey(): string {
        return `${EXTENSION_CONFIG_KEY}.${this.key}`
    }
}

export const configuration = new Configuration()
