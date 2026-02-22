/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Event } from '../../../../base/common/event.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'github';

/**
 * Authentication state for A-Coder provider
 */
export interface ACoderAuthState {
	/** Whether the user is authenticated */
	isAuthenticated: boolean;
	/** The user's email address from OAuth */
	userEmail?: string;
	/** The OAuth provider used (google or github) */
	authProvider?: OAuthProvider;
	/** The user ID from A-Coder backend */
	userId?: string;
	/** When the token expires (Unix timestamp in seconds) */
	expiresAt?: number;
}

/**
 * Model listing from A-Coder backend
 */
export interface ACoderModelResponse {
	models: Array<{
		id: string;
		name: string;
		contextLength: number;
		supportsTools: boolean;
		isHidden?: boolean;
	}>;
}

/**
 * Main process service interface for A-Coder OAuth.
 *
 * This interface is defined in the common directory so it can be imported
 * by both the browser-side service and the main process implementation.
 *
 * The main process implementation (aCoderOAuthMainService.ts) contains
 * the actual implementation with electron-specific code.
 */
export interface IACoderOAuthMainService {
	readonly _serviceBrand: undefined;

	/** Current authentication state */
	readonly authState: ACoderAuthState;

	/** Event that fires when authentication state changes */
	readonly onDidChangeAuthState: Event<ACoderAuthState>;

	/** Event that fires when models are updated */
	readonly onDidUpdateModels: Event<ACoderModelResponse>;

	/**
	 * Initiate Google OAuth sign-in flow
	 * Opens a browser window for the user to authenticate
	 * @returns Promise that resolves when authentication is complete
	 */
	initiateGoogleAuth(): Promise<void>;

	/**
	 * Initiate GitHub OAuth sign-in flow
	 * Opens a browser window for the user to authenticate
	 * @returns Promise that resolves when authentication is complete
	 */
	initiateGitHubAuth(): Promise<void>;

	/**
	 * Sign out and clear authentication state
	 * Clears all stored tokens and notifies the backend
	 */
	signOut(): Promise<void>;

	/**
	 * Check if the user is currently authenticated
	 */
	isAuthenticated(): boolean;

	/**
	 * Get the authenticated user's email
	 */
	getUserEmail(): string | undefined;

	/**
	 * Get the session token for API requests
	 * This token is used to authenticate with A-Coder's backend
	 * @returns Session token or null if not authenticated
	 */
	getSessionToken(): string | null;

	/**
	 * Get the user ID from A-Coder backend
	 */
	getUserId(): string | undefined;

	/**
	 * Fetch available models from A-Coder backend
	 * @returns List of available models
	 */
	fetchModels(): Promise<ACoderModelResponse>;

	/**
	 * Refresh the session token using the refresh token
	 * Automatically called when session token is about to expire
	 */
	refreshSessionToken(): Promise<void>;
}

export const IACoderOAuthMainService = createDecorator<IACoderOAuthMainService>('aCoderOAuthMainService');