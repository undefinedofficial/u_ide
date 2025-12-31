/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved. 
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { ComputedDiff } from '../../common/editCodeServiceTypes.js';
import { diffLines } from '../react/out/diff/index.js'

export class DiffWorker {
	public findDiffs(oldStr: string, newStr: string): ComputedDiff[] {
		// this makes it so the end of the file always ends with a \n
		newStr += '\n';
		oldStr += '\n';

		// an ordered list of every original line, line added to the new file, and line removed from the old file
		const lineByLineChanges = diffLines(oldStr, newStr);
		lineByLineChanges.push({ value: '', added: false, removed: false }) // add a dummy so we can flush any streaks

		let oldFileLineNum: number = 1;
		let newFileLineNum: number = 1;

		let streakStartInNewFile: number | undefined = undefined
		let streakStartInOldFile: number | undefined = undefined

		const oldStrLines = ('\n' + oldStr).split('\n') // add newline so indexing starts at 1
		const newStrLines = ('\n' + newStr).split('\n')

		const replacements: ComputedDiff[] = []
		for (const line of lineByLineChanges) {

			// no change on this line
			if (!line.added && !line.removed) {
				if (streakStartInNewFile !== undefined) {
					let type: 'edit' | 'insertion' | 'deletion' = 'edit'

					const startLine = streakStartInNewFile
					const endLine = newFileLineNum - 1

					const originalStartLine = streakStartInOldFile!
					const originalEndLine = oldFileLineNum - 1

					const newContent = newStrLines.slice(startLine, endLine + 1).join('\n')
					const originalContent = oldStrLines.slice(originalStartLine, originalEndLine + 1).join('\n')

					if (endLine === startLine - 1) {
						type = 'deletion'
					}
					else if (originalEndLine === originalStartLine - 1) {
						type = 'insertion'
					}

					const replacement: ComputedDiff = {
						type,
						startLine, endLine,
						originalStartLine, originalEndLine,
						originalCode: originalContent,
						code: newContent,
					}

				replacements.push(replacement)

					streakStartInNewFile = undefined
					streakStartInOldFile = undefined
				}
				oldFileLineNum += line.count ?? 0;
				newFileLineNum += line.count ?? 0;
			}
			else if (line.removed) {
				if (streakStartInNewFile === undefined) {
					streakStartInNewFile = newFileLineNum
					streakStartInOldFile = oldFileLineNum
				}
				oldFileLineNum += line.count ?? 0
			}
			else if (line.added) {
				if (streakStartInNewFile === undefined) {
					streakStartInNewFile = newFileLineNum
					streakStartInOldFile = oldFileLineNum
				}
				newFileLineNum += line.count ?? 0;
			}
		}
		return replacements
	}
}
