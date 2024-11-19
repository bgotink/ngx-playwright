import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";

import {AppComponent} from "./app.component";
import {TestShadowBoundary} from "./test-shadow-boundary";
import {TestSubComponent} from "./test-sub-component";

@NgModule({
	imports: [
		BrowserModule,
		TestSubComponent,
		TestShadowBoundary,
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
	],
	declarations: [AppComponent],
	bootstrap: [AppComponent],
})
export class AppModule {}
