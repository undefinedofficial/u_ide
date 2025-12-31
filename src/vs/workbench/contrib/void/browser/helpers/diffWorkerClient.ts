/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../../base/common/lifecycle.js';
import { ComputedDiff } from '../../common/editCodeServiceTypes.js';

export class DiffWorkerClient extends Disposable {
	private _worker: Worker | null = null;
	private _requestId = 0;
	private _pendingRequests = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>();

	constructor() {
		super();
	}

	private _getWorker(): Worker {
		if (!this._worker) {
			// Using a relative path from the current file's location in the built output
			const workerUrl = new URL('./diffWorkerMain.js', import.meta.url);
			this._worker = new Worker(workerUrl, { type: 'module', name: 'VoidDiffWorker' });
			this._worker.onmessage = (e) => {
				const { requestId, result, error } = e.data;
				const pending = this._pendingRequests.get(requestId);
				if (pending) {
					this._pendingRequests.delete(requestId);
					if (error) {
						pending.reject(new Error(error));
					} else {
						pending.resolve(result);
					}
				}
			};
			this._worker.onerror = (e) => {
				console.error('Diff worker error:', e);
				// Reject all pending requests
				for (const [id, pending] of this._pendingRequests) {
					pending.reject(new Error('Worker error'));
					this._pendingRequests.delete(id);
				}
			};
		}
		return this._worker;
	}

	public async findDiffs(oldStr: string, newStr: string): Promise<ComputedDiff[]> {
		const worker = this._getWorker();
		const requestId = this._requestId++;
		
		return new Promise<ComputedDiff[]>((resolve, reject) => {
			this._pendingRequests.set(requestId, { resolve, reject });
			worker.postMessage({
				method: 'findDiffs',
				args: [oldStr, newStr],
				requestId
			});
		});
	}

	public override dispose(): void {
		if (this._worker) {
			this._worker.terminate();
			this._worker = null;
		}
		super.dispose();
	}
}