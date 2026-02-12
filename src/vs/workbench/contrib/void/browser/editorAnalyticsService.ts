/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IEditorService } from '../../../../workbench/services/editor/common/editorService.js';
import { IMetricsService } from '../common/metricsService.js';

export const IEditorAnalyticsService = createDecorator<IEditorAnalyticsService>('editorAnalyticsService');

export interface IEditorAnalyticsService {
	readonly _serviceBrand: undefined;
}

export class EditorAnalyticsService extends Disposable implements IEditorAnalyticsService {
	_serviceBrand: undefined;

	private _activeEditorChangeTimeout: NodeJS.Timeout | undefined = undefined;

	constructor(
		@IEditorService private readonly _editorService: IEditorService,
		@IMetricsService private readonly _metricsService: IMetricsService,
	) {
		super();
		this._registerListeners();
	}

	private _registerListeners(): void {
		// Debounced active editor changes (avoid excessive events)
		this._register(this._editorService.onDidActiveEditorChange(() => {
			if (this._activeEditorChangeTimeout) {
				clearTimeout(this._activeEditorChangeTimeout);
			}
			this._activeEditorChangeTimeout = setTimeout(() => this._trackActiveEditorChange(), 2000);
		}));

		// Track editor open/close
		this._register(this._editorService.onWillOpenEditor(e => this._trackEditorOpen(e)));
		this._register(this._editorService.onDidCloseEditor(e => this._trackEditorClose(e)));
	}

	private _trackActiveEditorChange(): void {
		const activeEditor = this._editorService.activeEditor;
		if (!activeEditor?.resource) return;

		const ext = this._getExtension(activeEditor.resource);
		const isWorkspace = this._isWorkspaceFile(activeEditor.resource);
		const tabCount = this._editorService.count;

		this._metricsService.captureEditorEvent({
			type: 'active_editor_change',
			fileExtension: ext,
			language: this._getLanguage(activeEditor.resource),
			isWorkspaceFile: isWorkspace,
			tabCount,
		});
	}

	private _trackEditorOpen(e: any): void {
		const uri = e.editor?.resource;
		if (!uri) return;

		this._metricsService.captureEditorEvent({
			type: 'tab_open',
			fileExtension: this._getExtension(uri),
			isWorkspaceFile: this._isWorkspaceFile(uri),
		});
	}

	private _trackEditorClose(e: any): void {
		const uri = e.editor?.resource;
		if (!uri) return;

		this._metricsService.captureEditorEvent({
			type: 'tab_close',
			fileExtension: this._getExtension(uri),
			isWorkspaceFile: this._isWorkspaceFile(uri),
		});
	}

	private _getExtension(uri: any): string {
		if (!uri?.path) return '';
		const idx = uri.path.lastIndexOf('.');
		return idx >= 0 ? uri.path.slice(idx + 1) : '';
	}

	private _isWorkspaceFile(uri: any): boolean {
		return uri?.scheme === 'file';
	}

	private _getLanguage(uri: any): string | undefined {
		return undefined;
	}
}

registerSingleton(IEditorAnalyticsService, EditorAnalyticsService, InstantiationType.Eager);