/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';

export interface GitHubRelease {
	tag_name: string;
	name: string;
	body: string;
	html_url: string;
	published_at: string;
	assets: {
		name: string;
		browser_download_url: string;
	}[];
}

export const IWhatsNewModalService = createDecorator<IWhatsNewModalService>('whatsNewModalService');

export interface IWhatsNewModalService {
	readonly _serviceBrand: undefined;
	readonly onDidRequestOpen: Event<{ version: string; release?: GitHubRelease }>;
	openModal(version: string, release?: GitHubRelease): void;
}

export class WhatsNewModalService extends Disposable implements IWhatsNewModalService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidRequestOpen = this._register(new Emitter<{ version: string; release?: GitHubRelease }>());
	readonly onDidRequestOpen: Event<{ version: string; release?: GitHubRelease }> = this._onDidRequestOpen.event;

	openModal(version: string, release?: GitHubRelease): void {
		this._onDidRequestOpen.fire({ version, release });
	}
}

registerSingleton(IWhatsNewModalService, WhatsNewModalService, InstantiationType.Delayed);