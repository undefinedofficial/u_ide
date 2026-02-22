/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable, toDisposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IProductService } from '../../../../platform/product/common/productService.js';
import { IWhatsNewModalService, GitHubRelease } from './whatsNewModalService.js';
import { WHATS_NEW_LAST_VERSION_KEY } from '../common/storageKeys.js';
import { h, getActiveWindow } from '../../../../base/browser/dom.js';
import { mountWhatsNewModal } from './react/out/whats-new-tsx/index.js';

// Fetch release notes for a specific version
async function fetchReleaseByVersion(version: string): Promise<GitHubRelease | null> {
	try {
		const response = await fetch(`https://api.github.com/repos/hamishfromatech/A-Coder/releases/tags/${version}`);
		if (!response.ok) {
			console.warn('[A-Coder What\'s New] Failed to fetch release notes for version', version, ':', response.status);
			return null;
		}
		return await response.json();
	} catch (error) {
		console.warn('[A-Coder What\'s New] Error fetching release notes for version', version, ':', error);
		return null;
	}
}

// Contribution that mounts the What's New modal component
export class WhatsNewMountContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.void.whatsNewMount';

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IWhatsNewModalService whatsNewModalService: IWhatsNewModalService,
	) {
		super();

		const targetWindow = getActiveWindow();
		const workbench = targetWindow.document.querySelector('.monaco-workbench');

		if (workbench) {
			const modalContainer = h('div.void-whats-new-modal-container').root;
			workbench.appendChild(modalContainer);

			let currentModal: { dispose: () => void } | null = null;

			this._register(whatsNewModalService.onDidRequestOpen(({ version, release }) => {
				// Dispose any existing modal
				if (currentModal) {
					currentModal.dispose();
					currentModal = null;
				}

				this.instantiationService.invokeFunction((accessor: ServicesAccessor) => {
					const result = mountWhatsNewModal(modalContainer, accessor, {
						version,
						release,
						onClose: () => {
							if (currentModal) {
								currentModal.dispose();
								currentModal = null;
							}
						}
					});
					if (result && typeof result.dispose === 'function') {
						currentModal = result;
					}
				});
			}));

			this._register(toDisposable(() => {
				if (currentModal) {
					currentModal.dispose();
				}
				if (modalContainer.parentElement) {
					modalContainer.parentElement.removeChild(modalContainer);
				}
			}));
		}
	}
}

// Contribution that checks version and shows What's New modal on update
export class WhatsNewCheckContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.void.whatsNewCheck';

	constructor(
		@IStorageService private readonly storageService: IStorageService,
		@IProductService private readonly productService: IProductService,
		@IWhatsNewModalService whatsNewModalService: IWhatsNewModalService,
	) {
		super();

		this.checkAndShowWhatsNew(whatsNewModalService);
	}

	private async checkAndShowWhatsNew(whatsNewModalService: IWhatsNewModalService): Promise<void> {
		// Get current version from product service
		const currentVersion = this.productService['voidVersion'] as string | undefined;
		const voidRelease = this.productService['voidRelease'] as string | undefined;

		if (!currentVersion) {
			console.log('[A-Coder What\'s New] No version found in product service');
			return;
		}

		// Get the last seen version
		const lastSeenVersion = this.storageService.get(
			WHATS_NEW_LAST_VERSION_KEY,
			StorageScope.APPLICATION,
			''
		);

		// Build the full version string (e.g., "1.5.3 (0048)")
		const fullVersion = voidRelease ? `${currentVersion} (${voidRelease})` : currentVersion;

		// If this is the first run or version has changed
		if (lastSeenVersion !== fullVersion) {
			console.log(`[A-Coder What's New] Version changed from "${lastSeenVersion}" to "${fullVersion}"`);

			// Wait a bit for the workbench to be ready
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Try to fetch release notes
			const release = await fetchReleaseByVersion(currentVersion);

			// Show the modal
			whatsNewModalService.openModal(fullVersion, release ?? undefined);

			// Store the current version as seen
			this.storageService.store(
				WHATS_NEW_LAST_VERSION_KEY,
				fullVersion,
				StorageScope.APPLICATION,
				StorageTarget.MACHINE
			);
		}
	}
}

// Register the modal mount contribution first
registerWorkbenchContribution2(
	WhatsNewMountContribution.ID,
	WhatsNewMountContribution,
	WorkbenchPhase.AfterRestored
);

// Register the check contribution after
registerWorkbenchContribution2(
	WhatsNewCheckContribution.ID,
	WhatsNewCheckContribution,
	WorkbenchPhase.AfterRestored
);