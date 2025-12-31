/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { DiffWorker } from './diffWorker.js';

// This is the worker entry point
const worker = new DiffWorker();

// Simple message handling for the worker
self.onmessage = (e: MessageEvent) => {
	const { method, args, requestId } = e.data;
	
	if (method === 'findDiffs') {
		try {
			const result = worker.findDiffs(args[0], args[1]);
			self.postMessage({ requestId, result });
		} catch (error) {
			self.postMessage({ requestId, error: String(error) });
		}
	}
};
