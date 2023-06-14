import {Component, Input} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {uniprotColumns, uniprotSections} from "uniprotparserjs";

@Component({
  selector: 'app-column-select-modal',
  templateUrl: './column-select-modal.component.html',
  styleUrls: ['./column-select-modal.component.less']
})
export class ColumnSelectModalComponent  {
  dataMap: {[key: string]: {label: string, fieldId: string, section: string}[]} = {}
  columnFormMap: {[key: string]: FormGroup} = {}
  sections = uniprotSections;

  private _fieldParameters: string = ''

  @Input() set fieldParameters(value: string) {
    this._fieldParameters = value
    const fields = this.fieldParameters.split(',')
    for (const col of uniprotColumns) {
      if (!this.dataMap[col.section]) {
        this.dataMap[col.section] = []
      }
      this.dataMap[col.section].push(col)
      if (fields.includes(col.fieldId)) {
        this.columnFormMap[col.section].controls['columns'].setValue([...this.columnFormMap[col.section].controls['columns'].value, col.fieldId])
      }
    }
  }

  get fieldParameters(): string {
    return this._fieldParameters
  }

  columns = uniprotColumns;
  uniprotSections = uniprotSections;
  constructor(private fb: FormBuilder) {
    for (const section of this.uniprotSections) {
      this.columnFormMap[section] = this.fb.group({
        columns: [[]],
      })
    }

  }



}
