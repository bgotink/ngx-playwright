/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgFor} from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	Input,
	ViewEncapsulation,
} from "@angular/core";

@Component({
	selector: "test-sub",
	template: ` <h2>List of {{ title }}</h2>
		<ul>
			<li *ngFor="let item of items">{{ item }}</li>
		</ul>`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgFor],
})
export class TestSubComponent {
	@Input() title: string;
	@Input() items: string[];
}
