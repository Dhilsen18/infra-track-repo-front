import { INJECTED_API_BASE_URLS } from './api-bases.inject';

/**
 * Bases MockAPI.io acordadas para InfraTrack (sobrescribibles en build vía `scripts/inject-api-bases.mjs`).
 */
export const MOCK_API_BASE_URLS = INJECTED_API_BASE_URLS;

export type MockApiBaseKey = keyof typeof MOCK_API_BASE_URLS;
