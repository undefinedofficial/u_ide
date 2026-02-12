/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IWorkbenchLayoutService, Parts } from '../../../../workbench/services/layout/browser/layoutService.js';
import { IMetricsService, LayoutAnalyticsEvent } from '../common/metricsService.js';

export const ILayoutAnalyticsService = createDecorator<ILayoutAnalyticsService>('layoutAnalyticsService');

export interface ILayoutAnalyticsService {
	readonly _serviceBrand: undefined;
}

export class LayoutAnalyticsService extends Disposable implements ILayoutAnalyticsService {
	_serviceBrand: undefined;

	private _previousVisibility: Map<string, boolean> = new Map();

	constructor(
		@IWorkbenchLayoutService private readonly _layoutService: IWorkbenchLayoutService,
		@IMetricsService private readonly _metricsService: IMetricsService,
	) {
		super();
		this._initializeVisibility();
		this._registerListeners();
	}

	private _initializeVisibility(): void {
		// Initialize visibility state for trackable parts
		this._previousVisibility.set(Parts.SIDEBAR_PART, this._layoutService.isVisible(Parts.SIDEBAR_PART as any));
		this._previousVisibility.set(Parts.AUXILIARYBAR_PART, this._layoutService.isVisible(Parts.AUXILIARYBAR_PART as any));
		this._previousVisibility.set(Parts.PANEL_PART, this._layoutService.isVisible(Parts.PANEL_PART as any));
	}

	private _registerListeners(): void {
		// Track panel position changes
		this._register(this._layoutService.onDidChangePanelPosition(e => this._onPanelPositionChanged()));

		// Track zen mode changes
		this._register(this._layoutService.onDidChangeZenMode(e => this._onZenModeChanged()));

		// Track part visibility changes (generic event)
		this._register(this._layoutService.onDidChangePartVisibility(e => this._onPartVisibilityChanged()));
	}

	private _onPartVisibilityChanged(): void {
		// Check each trackable part and emit event if visibility changed
		const partsToCheck = [Parts.SIDEBAR_PART, Parts.AUXILIARYBAR_PART, Parts.PANEL_PART];

		for (const partId of partsToCheck) {
			const currentVisibility = this._layoutService.isVisible(partId as any);
			const previousVisibility = this._previousVisibility.get(partId) ?? false;

			if (currentVisibility !== previousVisibility) {
				this._previousVisibility.set(partId, currentVisibility);

				const partName = this._getPartName(partId);
				let type: LayoutAnalyticsEvent['type'];

				if (partId === Parts.SIDEBAR_PART || partId === Parts.AUXILIARYBAR_PART) {
					type = 'sidebar_toggle';
				} else if (partId === Parts.PANEL_PART) {
					type = 'panel_toggle';
				} else {
					continue;
				}

				this._metricsService.captureLayoutEvent({
					type,
					part: partName,
					visible: currentVisibility,
					position: this._getPartPosition(partId),
				});
			}
		}
	}

	private _onPanelPositionChanged(): void {
		this._metricsService.captureLayoutEvent({
			type: 'layout_change',
			part: 'panel',
			visible: this._layoutService.isVisible(Parts.PANEL_PART as any),
			position: this._layoutService.getPanelPosition().toString(),
		});
	}

	private _onZenModeChanged(): void {
		this._metricsService.captureLayoutEvent({
			type: 'zen_mode_toggle',
			part: 'zen_mode',
			visible: (this._layoutService as any).isZenModeActive?.() ?? false,
		});
	}

	private _getPartName(id: string): string {
		switch (id) {
			case Parts.SIDEBAR_PART: return 'sidebar';
			case Parts.AUXILIARYBAR_PART: return 'auxiliary';
			case Parts.PANEL_PART: return 'panel';
			case Parts.STATUSBAR_PART: return 'statusbar';
			case Parts.TITLEBAR_PART: return 'titlebar';
			case Parts.ACTIVITYBAR_PART: return 'activitybar';
			default: return id;
		}
	}

	private _getPartPosition(id: string): string | undefined {
		if (id === Parts.SIDEBAR_PART) return this._layoutService.getSideBarPosition().toString();
		if (id === Parts.PANEL_PART) return this._layoutService.getPanelPosition().toString();
		return undefined;
	}
}

registerSingleton(ILayoutAnalyticsService, LayoutAnalyticsService, InstantiationType.Eager);