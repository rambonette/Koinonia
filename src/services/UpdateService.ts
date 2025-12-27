import { IUpdateService, UpdateCheckResult, ReleaseInfo } from '../interfaces/IUpdateService';
import { ISettingsService } from '../interfaces/ISettingsService';

const GITHUB_REPO = 'rambonette/koinonia';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

// Tag prefixes matching the GitHub workflows
const STABLE_TAG_PREFIX = 'v';
const NIGHTLY_TAG_PREFIX = 'develop-';

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

/**
 * Extracts version string from a tag name
 * v2025.12.26.2 -> 2025.12.26.2
 * develop-2025.12.26.2 -> 2025.12.26.2
 */
function extractVersion(tagName: string): string | null {
  if (tagName.startsWith(STABLE_TAG_PREFIX)) {
    return tagName.slice(STABLE_TAG_PREFIX.length);
  }
  if (tagName.startsWith(NIGHTLY_TAG_PREFIX)) {
    return tagName.slice(NIGHTLY_TAG_PREFIX.length);
  }
  return null;
}

/**
 * Compares two version strings (format: YYYY.MM.DD.N)
 * Returns positive if v1 > v2, negative if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 !== p2) return p1 - p2;
  }
  return 0;
}

/**
 * Update service implementation
 * Checks GitHub releases for available updates
 */
export class UpdateService implements IUpdateService {
  private settings: ISettingsService;
  private currentVersion: string;

  constructor(settings: ISettingsService, currentVersion: string) {
    this.settings = settings;
    this.currentVersion = currentVersion;
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  async checkForUpdates(): Promise<UpdateCheckResult> {
    const { checkForStableUpdates, checkForNightlyUpdates } = this.settings.getSettings();

    // No update checks enabled
    if (!checkForStableUpdates && !checkForNightlyUpdates) {
      return { hasUpdate: false, release: null };
    }

    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch releases:', response.statusText);
        return { hasUpdate: false, release: null };
      }

      const releases: GitHubRelease[] = await response.json();

      // Filter out drafts
      const publishedReleases = releases.filter(r => !r.draft);

      let latestUpdate: ReleaseInfo | null = null;

      for (const release of publishedReleases) {
        const version = extractVersion(release.tag_name);
        if (!version) continue;

        const isNightly = release.tag_name.startsWith(NIGHTLY_TAG_PREFIX);
        const isStable = release.tag_name.startsWith(STABLE_TAG_PREFIX);

        // Skip releases that don't match user preferences
        if (isNightly && !checkForNightlyUpdates) continue;
        if (isStable && !checkForStableUpdates) continue;

        // Check if this release is newer than current version
        if (compareVersions(version, this.currentVersion) > 0) {
          // Check if this is newer than our best candidate
          if (!latestUpdate || compareVersions(version, latestUpdate.version) > 0) {
            latestUpdate = {
              version,
              tagName: release.tag_name,
              url: release.html_url,
              isNightly
            };
          }
        }
      }

      return {
        hasUpdate: latestUpdate !== null,
        release: latestUpdate
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { hasUpdate: false, release: null };
    }
  }
}
