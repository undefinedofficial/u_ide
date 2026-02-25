/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';

export type ComputedDiff = {
	type: 'edit';
	originalCode: string;
	originalStartLine: number;
	originalEndLine: number;
	code: string;
	startLine: number; // 1-indexed
	endLine: number;
} | {
	type: 'insertion';
	// originalCode: string;
	originalStartLine: number; // insertion starts on column 0 of this
	// originalEndLine: number;
	code: string;
	startLine: number;
	endLine: number;
} | {
	type: 'deletion';
	originalCode: string;
	originalStartLine: number;
	originalEndLine: number;
	// code: string;
	startLine: number; // deletion starts on column 0 of this
	// endLine: number;
}

// ---------- Diff types ----------

export type CommonZoneProps = {
	diffareaid: number;
	startLine: number;
	endLine: number;

	_URI: URI; // typically we get the URI from model

}


export type CtrlKZone = {
	type: 'CtrlKZone';
	originalCode?: undefined;

	editorId: string; // the editor the input lives on

	// _ means anything we don't include if we clone it
	_mountInfo: null | {
		textAreaRef: { current: HTMLTextAreaElement | null }
		dispose: () => void;
		refresh: () => void;
	}
	_linkedStreamingDiffZone: number | null; // diffareaid of the diffZone currently streaming here
	_removeStylesFns: Set<Function> // these don't remove diffs or this diffArea, only their styles
} & CommonZoneProps


export type TrackingZone<T> = {
	type: 'TrackingZone';
	metadata: T;
	originalCode?: undefined;
	editorId?: undefined;
	_removeStylesFns?: undefined;
} & CommonZoneProps


// called DiffArea for historical purposes, we can rename to something like TextRegion if we want
export type DiffArea = CtrlKZone | DiffZone | TrackingZone<any>


export type Diff = {
	diffid: number;
	diffareaid: number; // the diff area this diff belongs to, "computed"
} & ComputedDiff


export type DiffZone = {
	type: 'DiffZone',
	originalCode: string;
	_diffOfId: Record<string, Diff>; // diffid -> diff in this DiffArea
	_streamState: {
		isStreaming: true;
		streamRequestIdRef: { current: string | null };
		line: number;
	} | {
		isStreaming: false;
		streamRequestIdRef?: undefined;
		line?: undefined;
	};
	editorId?: undefined;
	linkedStreamingDiffZone?: undefined;
	_removeStylesFns: Set<Function> // these don't remove diffs or this diffArea, only their styles
} & CommonZoneProps


export const diffAreaSnapshotKeys = [
	'type',
	'diffareaid',
	'originalCode',
	'startLine',
	'endLine',
	'editorId',

] as const satisfies (keyof DiffArea)[]



export type DiffAreaSnapshotEntry<DiffAreaType extends DiffArea = DiffArea> = Pick<DiffAreaType, typeof diffAreaSnapshotKeys[number]>

export type VoidFileSnapshot = {
	snapshottedDiffAreaOfId: Record<string, DiffAreaSnapshotEntry>;
	entireFileCode: string;
}

// MEMORY OPTIMIZATION: Diff-based checkpoint storage
// Instead of storing full file content, store only the changes from the previous checkpoint
export type FileContentDiff = {
	type: 'edit' | 'insertion' | 'deletion';
	startLine: number;
	endLine: number;
	oldText?: string;  // for edit/deletion - what was there before
	newText?: string;  // for edit/insertion - what replaced it
}

// A lightweight checkpoint that stores only diffs from the previous state
// This is used for the checkpoint system to avoid storing full file snapshots in memory
export type DiffBasedCheckpoint = {
	snapshottedDiffAreaOfId: Record<string, DiffAreaSnapshotEntry>;
	fileContentDiffs: FileContentDiff[];  // Diffs from previous checkpoint (or empty for first)
	isFullSnapshot: boolean;  // true if this contains full content (fallback for old checkpoints)
	contentHash?: string;  // hash of current content for integrity checking
}

// Factory to create a diff-based checkpoint from two snapshots
export function createDiffBasedCheckpoint(
	previousSnapshot: VoidFileSnapshot | null,
	currentSnapshot: VoidFileSnapshot
): DiffBasedCheckpoint {
	// If no previous snapshot, we need to store full content
	if (!previousSnapshot) {
		return {
			snapshottedDiffAreaOfId: currentSnapshot.snapshottedDiffAreaOfId,
			fileContentDiffs: [{
				type: 'edit',
				startLine: 1,
				endLine: 1,
				newText: currentSnapshot.entireFileCode,
			}],
			isFullSnapshot: true,
		};
	}

	// Compute line-based diff between previous and current content
	const previousLines = previousSnapshot.entireFileCode.split('\n');
	const currentLines = currentSnapshot.entireFileCode.split('\n');
	const diffs: FileContentDiff[] = [];

	// Simple LCS-based diff algorithm
	let prevIdx = 0;
	let currIdx = 0;

	while (prevIdx < previousLines.length || currIdx < currentLines.length) {
		if (prevIdx < previousLines.length && currIdx < currentLines.length &&
			previousLines[prevIdx] === currentLines[currIdx]) {
			// Lines match, move both forward
			prevIdx++;
			currIdx++;
		} else {
			// Find the next matching line or end of file
			let prevEnd = prevIdx;
			let currEnd = currIdx;

			// Look ahead to find a match
			let foundMatch = false;
			for (let i = 0; i < 10 && !foundMatch; i++) { // Limit lookahead to 10 lines
				if (prevIdx + i < previousLines.length && currIdx + i < currentLines.length &&
					previousLines[prevIdx + i] === currentLines[currIdx + i]) {
					prevEnd = prevIdx + i;
					currEnd = currIdx + i;
					foundMatch = true;
				}
			}

			if (!foundMatch) {
				prevEnd = previousLines.length;
				currEnd = currentLines.length;
			}

			// Create appropriate diff
			const oldLines = previousLines.slice(prevIdx, prevEnd);
			const newLines = currentLines.slice(currIdx, currEnd);

			if (oldLines.length > 0 && newLines.length > 0) {
				diffs.push({
					type: 'edit',
					startLine: prevIdx + 1, // 1-indexed
					endLine: prevEnd,
					oldText: oldLines.join('\n'),
					newText: newLines.join('\n'),
				});
			} else if (oldLines.length > 0) {
				diffs.push({
					type: 'deletion',
					startLine: prevIdx + 1,
					endLine: prevEnd,
					oldText: oldLines.join('\n'),
				});
			} else if (newLines.length > 0) {
				diffs.push({
					type: 'insertion',
					startLine: prevIdx + 1,
					endLine: prevIdx, // insertion happens before this line
					newText: newLines.join('\n'),
				});
			}

			prevIdx = prevEnd;
			currIdx = currEnd;

			if (foundMatch) {
				// Skip the matching line
				prevIdx++;
				currIdx++;
			}
		}
	}

	return {
		snapshottedDiffAreaOfId: currentSnapshot.snapshottedDiffAreaOfId,
		fileContentDiffs: diffs,
		isFullSnapshot: false,
	};
}

// Apply a diff-based checkpoint to reconstruct the file content
export function applyDiffBasedCheckpoint(
	previousContent: string,
	checkpoint: DiffBasedCheckpoint
): string {
	if (checkpoint.isFullSnapshot) {
		// For full snapshots, just return the newText from the first diff
		return checkpoint.fileContentDiffs[0]?.newText || previousContent;
	}

	const lines = previousContent.split('\n');
	const result: string[] = [];
	let currentLine = 0;

	for (const diff of checkpoint.fileContentDiffs) {
		// Add unchanged lines before this diff
		while (currentLine < diff.startLine - 1 && currentLine < lines.length) {
			result.push(lines[currentLine]);
			currentLine++;
		}

		if (diff.type === 'deletion') {
			// Skip the deleted lines
			currentLine = diff.endLine;
		} else if (diff.type === 'insertion') {
			// Add the new lines
			if (diff.newText) {
				result.push(...diff.newText.split('\n'));
			}
			// currentLine stays the same for insertion
		} else if (diff.type === 'edit') {
			// Skip the old lines and add new lines
			currentLine = diff.endLine;
			if (diff.newText) {
				result.push(...diff.newText.split('\n'));
			}
		}
	}

	// Add remaining unchanged lines
	while (currentLine < lines.length) {
		result.push(lines[currentLine]);
		currentLine++;
	}

	return result.join('\n');
}

