import { execSync } from 'child_process';
import path from 'node:path';

export function moveMigrationScripts(logger: any) {
	const ROOT = process.cwd();

	let migrationSrcPath: string[] | string = __dirname.split('/');
	migrationSrcPath.pop();
	migrationSrcPath.push('migrations');
	migrationSrcPath = path.join('/', ...migrationSrcPath);

	let migrationDestPath: string[] | string = ROOT.split('/');
	migrationDestPath.push('migrations');
	migrationDestPath = path.join('/', ...migrationDestPath);

	try {
		execSync(`mkdir -p ${migrationDestPath}`);
		execSync(`cp -r ${migrationSrcPath}/* ${migrationDestPath}/`);
		logger.info('FCM: Migration scripts copied successfully.');
	} catch (error) {
		logger.error('FCM: Failed to copy migration scripts.', error);
	}
}
