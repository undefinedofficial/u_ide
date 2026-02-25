/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IFileService, FileOperation } from '../../../../platform/files/common/files.js';
import { IEditorService } from '../../../../workbench/services/editor/common/editorService.js';
import { IMetricsService, FileOperationEvent } from '../common/metricsService.js';
import { URI } from '../../../../base/common/uri.js';

export const IFileAnalyticsService = createDecorator<IFileAnalyticsService>('fileAnalyticsService');

export interface IFileAnalyticsService {
	readonly _serviceBrand: undefined;
}

export class FileAnalyticsService extends Disposable implements IFileAnalyticsService {
	_serviceBrand: undefined;

	constructor(
		@IFileService private readonly _fileService: IFileService,
		@IEditorService private readonly _editorService: IEditorService,
		@IMetricsService private readonly _metricsService: IMetricsService,
	) {
		super();
		this._registerListeners();
	}

	private _registerListeners(): void {
		// Track file operations
		this._register(this._fileService.onDidRunOperation(e => this._onFileOperation(e)));

		// Track editor open/close (indirectly tracks file open/close)
		this._register(this._editorService.onWillOpenEditor(e => this._onEditorOpen(e)));
		this._register(this._editorService.onDidCloseEditor(e => this._onEditorClose(e)));
	}

	private _onFileOperation(e: any): void {
		const operation = e.operation;
		const target: URI | undefined = e.target;

		if (!target || !operation) return;

		const ext = this._getExtension(target);
		const size = 0; // Would need stat call, using 0 for now
		const isWorkspace = this._isWorkspaceFile(target);
		const language = this._getLanguage(target);

		let fileOperation: FileOperationEvent['operation'];
		switch (operation) {
			case FileOperation.CREATE: fileOperation = 'create'; break;
			case FileOperation.DELETE: fileOperation = 'delete'; break;
			case FileOperation.MOVE: fileOperation = 'move'; break;
			case FileOperation.COPY: fileOperation = 'copy'; break;
			default: return;
		}

		this._metricsService.captureFileOperation({ operation: fileOperation, fileExtension: ext, fileSize: size, isWorkspaceFile: isWorkspace, language });
	}

	private _onEditorOpen(e: any): void {
		// Could capture file_open event here if needed
	}

	private _onEditorClose(e: { editor: any }): void {
		const uri = e.editor?.resource;
		if (!uri) return;

		const ext = this._getExtension(uri);
		const isWorkspace = this._isWorkspaceFile(uri);
		const language = this._getLanguage(uri);

		this._metricsService.captureFileOperation({
			operation: 'close',
			fileExtension: ext,
			fileSize: 0,
			isWorkspaceFile: isWorkspace,
			language,
		});
	}

	private _getExtension(uri: URI): string {
		const path = uri.path;
		const idx = path.lastIndexOf('.');
		return idx >= 0 ? path.slice(idx + 1) : '';
	}

	private _isWorkspaceFile(uri: URI): boolean {
		return uri.scheme === 'file';
	}

	private _getLanguage(uri: URI): string | undefined {
		// Could use language service to get language ID
		return undefined;
	}
}

registerSingleton(IFileAnalyticsService, FileAnalyticsService, InstantiationType.Delayed);