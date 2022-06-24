import { ConfigurationChangeEvent, workspace } from "vscode"

export const EXTENSION_CONFIG_KEY = "testely"

export enum ConfigurationKeys {
    testLocation = "testLocation",
    testDirectoryName = "testDirectoryName",
    experimentalMockData = "experimentalMockData",
    testingLibraryReactScreenTestFunction = "testing-library-react.screen.getFunction"
}

export class Configuration {
    private configs = {
        testLocation: new SingletonConfigValue<TestLocation>(ConfigurationKeys.testLocation),
        testDirectoryName: new SingletonConfigValue<TestLocation>(ConfigurationKeys.testDirectoryName),
        experimentalMockData: new SingletonConfigValue<boolean>(ConfigurationKeys.experimentalMockData),
        testingLibraryReactScreenTestFunction: new SingletonConfigValue<TestingLibraryReactScreenTestFunction>(ConfigurationKeys.testingLibraryReactScreenTestFunction),
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

    public getTestingLibraryReactScreenTestFunction(): string {
        const screenFunction = this.configs.testingLibraryReactScreenTestFunction.get()
        const hasAll = screenFunction.includes("All")
        const awaited = screenFunction.startsWith("find")

        const prefix = awaited ? `${hasAll ? "(" : ""}await ` : "" 
        const suffix = hasAll ? `${awaited ? ")" : ""}[0]` : ""

        return `${prefix}screen.${screenFunction}(\"result\")${suffix}`
    }
}

export enum TestLocation {
    SameDirectory = "same directory",
    SameDirectoryNested = "same directory (nested)",
    RootTestFolderFlat = "root test folder (flat)",
    RootTestFolderNested = "root test folder (nested)",
}

export enum TestingLibraryReactScreenTestFunction {
    getByLabelText = "getByLabelText",
    getAllByLabelText = "getAllByLabelText",
    queryByLabelText = "queryByLabelText",
    queryAllByLabelText = "queryAllByLabelText",
    findByLabelText = "findByLabelText",
    findAllByLabelText = "findAllByLabelText",
    getByPlaceholderText = "getByPlaceholderText",
    getAllByPlaceholderText = "getAllByPlaceholderText",
    queryByPlaceholderText = "queryByPlaceholderText",
    queryAllByPlaceholderText = "queryAllByPlaceholderText",
    findByPlaceholderText = "findByPlaceholderText",
    findAllByPlaceholderText = "findAllByPlaceholderText",
    getByText = "getByText",
    getAllByText = "getAllByText",
    queryByText = "queryByText",
    queryAllByText = "queryAllByText",
    findByText = "findByText",
    findAllByText = "findAllByText",
    getByAltText = "getByAltText",
    getAllByAltText = "getAllByAltText",
    queryByAltText = "queryByAltText",
    queryAllByAltText = "queryAllByAltText",
    findByAltText = "findByAltText",
    findAllByAltText = "findAllByAltText",
    getByTitle = "getByTitle",
    getAllByTitle = "getAllByTitle",
    queryByTitle = "queryByTitle",
    queryAllByTitle = "queryAllByTitle",
    findByTitle = "findByTitle",
    findAllByTitle = "findAllByTitle",
    getByDisplayValue = "getByDisplayValue",
    getAllByDisplayValue = "getAllByDisplayValue",
    queryByDisplayValue = "queryByDisplayValue",
    queryAllByDisplayValue = "queryAllByDisplayValue",
    findByDisplayValue = "findByDisplayValue",
    findAllByDisplayValue = "findAllByDisplayValue",
    getByRole = "getByRole",
    getAllByRole = "getAllByRole",
    queryByRole = "queryByRole",
    queryAllByRole = "queryAllByRole",
    findByRole = "findByRole",
    findAllByRole = "findAllByRole",
    getByTestId = "getByTestId",
    getAllByTestId = "getAllByTestId",
    queryByTestId = "queryByTestId",
    queryAllByTestId = "queryAllByTestId",
    findByTestId = "findByTestId",
    findAllByTestId = "findAllByTestId",
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

