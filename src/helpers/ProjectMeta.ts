/** Contains some project informations */
export interface ProjectMeta {}

export interface FrontendProjectMeta extends ProjectMeta {
	react: boolean
	jest: boolean
	mocha: boolean
	["@testing-library/react"]: boolean
};

// class ProjectMetaProvider {
// 	private lastPackage;
// 	constructor() {}
// }

// export function getProjectMeta(): ProjectMeta {
	
// }