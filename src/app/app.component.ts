import { Component } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {DataFrame, fromCSV, IDataFrame, Series} from "data-forge";
import {MatDialog} from "@angular/material/dialog";
import {ColumnSelectModalComponent} from "./column-select-modal/column-select-modal.component";
import {uniprotSections, Accession, Parser} from "uniprotparserjs";
import {Subject} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'uniprotparser-ng';
  multiColumnFile: IDataFrame<number, any> = new DataFrame();
  form = this.fb.group({
    text: [''],
    fileSource: [''],
    fileHasMultipleColumns: [false],
    column: ["",],
  })
  currentTab = 0;
  selectedString = 'accession,id,gene_names,protein_name,organism_name,go_id,sequence'
  uniprotIDs: string[] = []
  inputMap: any = {}
  reverseInputMap: any = {}
  segmentStatus: any = {}
  segments: string[] = []
  segmentCount = 0
  progressValue = 0
  progressText = ""
  df: IDataFrame<number, any> = new DataFrame()
  finished = false
  constructor(private fb: FormBuilder, public dialog: MatDialog) {

  }

  onFileChange(event: any, multiColumn: boolean) {
    console.log(event)
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const loadedFile = reader.result;
        if (multiColumn) {
          this.multiColumnFile = fromCSV(<string>loadedFile);
        } else {
          this.form.patchValue({
            text: <string>loadedFile
          });
        }
      }
      reader.readAsText(file);
    }
  }
  updateCurrentTabIndex(event: any) {
    this.currentTab = event
  }

  openColumnSelectionDialog() {
    const ref = this.dialog.open(ColumnSelectModalComponent, {
      width: '500px',
    })
    ref.componentInstance.fieldParameters = this.selectedString.slice()
    ref.afterClosed().subscribe(result => {
      let selectedColumns: string[] = []
      for (const s of uniprotSections) {
        if (result[s]) {
          for (const fieldId of result[s]) {
            selectedColumns.push(fieldId)
          }
        }
      }
      this.selectedString = selectedColumns.join(',')
    })
  }

  submit() {
    this.finished = false
    this.uniprotIDs = []

    switch (this.currentTab) {
      case 0:
        this.form.value.text?.replace(/\r\n/g, '\n').split('\n').forEach((line: string) => {
          const acc = new Accession(line, true)
          const d = acc.toString()
          if (d !== "") {
            this.uniprotIDs.push(d)
          }

        })
        break
      case 1:
        this.form.value.text?.replace(/\r\n/g, '\n').split('\n').forEach((line: string) => {
          const acc = new Accession(line, true)
          const d = acc.toString()
          if (d !== "") {
            this.uniprotIDs.push(d)
          }
        })
        break
      case 2:
        if (this.form.value.column) {
          const primaryIDs: string[] = []
          for (const s of this.multiColumnFile.getSeries(this.form.value.column)) {
            const acc = new Accession(s, true)

            if (acc.acc !== "") {
              primaryIDs.push(acc.toString())
              if (!this.inputMap[acc.toString()]) {
                this.inputMap[acc.toString()] = []
              }
              this.inputMap[acc.toString()].push(s)
            } else {
              primaryIDs.push(s)
            }
            this.reverseInputMap[s] = acc.toString()
            this.uniprotIDs.push(acc.toString())
          }
          this.multiColumnFile = this.multiColumnFile.withSeries("primaryID", new Series(primaryIDs)).bake()
        }
        break
    }
    this.segments = []

    if (this.uniprotIDs.length > 0) {

      // get unique values
      this.uniprotIDs = [...new Set(this.uniprotIDs)]
      this.segmentCount = Math.ceil(this.uniprotIDs.length/10000)
      this.parse().then(async () => {
        if (this.currentTab === 0 || this.currentTab === 1) {
          this.finished = true
          await this.triggerDownload(this.df)
        } else {
          const total = this.multiColumnFile.join(
            this.df, left => left["primaryID"], right => right["From"], (left, right) => {
              return {
                ...left,
                ...right
              }
            }).bake()
          this.finished = true
          await this.triggerDownload(total)
        }
      })
    }


  }

  async parse() {
    const parser = new Parser(5,this.selectedString)
    const mainDF: IDataFrame[] = []
    this.segmentStatus = {}
    for await (const result of parser.parse(this.uniprotIDs)) {
      const segment = `${result.segment}`
      if (!this.segmentStatus[segment]) {
        this.segmentStatus [segment] = {progressValue: 0, progressText: "", currentRun: 1, totalRun: Math.ceil(result.total/500), running: true}
        this.segments.push(segment)
      }

      this.segmentStatus[segment].totalRun = Math.ceil(result.total/500)

      const df = fromCSV(result.data)
      mainDF.push(df)
      this.segmentStatus[segment].progressValue = this.segmentStatus[segment].currentRun * 100/this.segmentStatus[segment].totalRun
      this.segmentStatus[segment].progressText = `Processed UniProt Job ${this.segmentStatus[segment].currentRun}/${this.segmentStatus[segment].totalRun}`
      this.segmentStatus[segment].currentRun ++
    }
    let finDF: IDataFrame<number, any> = new DataFrame()
    if (mainDF.length > 1) {
      this.df = DataFrame.concat(mainDF).bake()
    } else {
      if (mainDF.length === 1) {
        this.df = mainDF[0]
      } else {

      }
    }
    this.progressText = "Finished"
    this.segments = []

  }

  async triggerDownload(finDF: IDataFrame<number, any>, filename: string = "uniprot.txt"  ) {
    // @ts-ignore
    const csv = finDF.toCSV({delimiter: '\t', includeHeader: true})

    const blob = new Blob([csv], {type: 'text/csv'})
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url)
  }

  downloadGOStatsAssociation() {
    const goStatsAssociation: {"Geneontology IDs": string, "Gocode": string, "Entry": string}[] = []
    for (const r of this.df) {
      r["Gene Ontology IDs"].split("; ").forEach((go: string) => {
        goStatsAssociation.push({
          "Geneontology IDs": go,
          "Gocode": "IEA",
          "Entry": r["Entry Name"]
        })
      })
    }
    const df = new DataFrame(goStatsAssociation)
    this.triggerDownload(df, "goStatsAssociation.txt").then()
  }
}
