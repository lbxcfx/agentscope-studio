import { compare } from 'semver';
import packageJson from '../../../../package.json';

interface NpmPackageInfo {
    'dist-tags': {
        latest: string;
    };
}

export async function checkForUpdates() {
    try {
        // 从 npm registry 获取包信息
        const response = await fetch(
            'https://registry.npmjs.org/@agentscope/studio',
        );
        const data: NpmPackageInfo = await response.json();
        const latestVersion = data['dist-tags'].latest;
        const currentVersion = packageJson.version;

        // Check if the latest version is greater than the current version
        if (compare(latestVersion, currentVersion) === 1) {
            return {
                hasUpdate: true,
                currentVersion,
                latestVersion,
            };
        }

        return {
            hasUpdate: false,
            currentVersion,
            latestVersion,
        };
    } catch (error) {
        console.error('Failed to check for updates:', error);
        return {
            hasUpdate: false,
            error: true,
        };
    }
}
