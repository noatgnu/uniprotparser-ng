import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {MatLegacyCardModule as MatCardModule} from "@angular/material/legacy-card";
import {MatLegacyInputModule as MatInputModule} from "@angular/material/legacy-input";
import {ReactiveFormsModule} from "@angular/forms";
import {MatLegacyButtonModule as MatButtonModule} from "@angular/material/legacy-button";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatLegacyOptionModule as MatOptionModule} from "@angular/material/legacy-core";
import {MatLegacySelectModule as MatSelectModule} from "@angular/material/legacy-select";
import {MatLegacyTabsModule as MatTabsModule} from "@angular/material/legacy-tabs";
import { ColumnSelectModalComponent } from './column-select-modal/column-select-modal.component';
import {MatLegacyDialogModule as MatDialogModule} from "@angular/material/legacy-dialog";
import {MatLegacyProgressBarModule as MatProgressBarModule} from "@angular/material/legacy-progress-bar";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatLegacySlideToggleModule as MatSlideToggleModule} from "@angular/material/legacy-slide-toggle";
import {MatLegacySnackBarModule as MatSnackBarModule} from "@angular/material/legacy-snack-bar";

@NgModule({
  declarations: [
    AppComponent,
    ColumnSelectModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatCardModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    BrowserAnimationsModule,
    MatOptionModule,
    MatSelectModule,
    MatTabsModule,
    MatDialogModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
