import { Component } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {DataFrame, fromCSV, IDataFrame, Series} from "data-forge";
import {MatDialog} from "@angular/material/dialog";
import {ColumnSelectModalComponent} from "./column-select-modal/column-select-modal.component";
import {uniprotSections, Accession, Parser} from "uniprotparserjs";
import {Subject} from "rxjs";
import {UniprotService} from "./services/uniprot.service";
import {MatSnackBar} from "@angular/material/snack-bar";

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
    from: ["UniProtKB_AC-ID"],
  })
  accCompatibleList: string[] = ["UniProtKB", "UniProtKB_AC-ID", "UniProtKB-Swiss-Prot"]
  currentTab = 0;
  selectedString = 'accession,id,gene_names,protein_name,organism_name,go_id,sequence'
  uniprotIDs: string[] = []


  finished = false
  df: IDataFrame<number, any> = new DataFrame()
  constructor(private fb: FormBuilder, public dialog: MatDialog, public uniprot: UniprotService, private snack: MatSnackBar) {

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
        this.snack.open("File loaded", "OK", {duration: 2000})
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
          for (const fieldId of result[s].value["columns"]) {
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
    if (this.form.value["from"] !== null && this.form.value["from"] !== "" && this.form.value["from"] !== undefined) {
      switch (this.currentTab) {
        case 0:
          this.form.value.text?.replace(/\r\n/g, '\n').split('\n').forEach((line: string) => {
            let d = ""
            if (this.accCompatibleList.includes(<string>this.form.value["from"])) {
              const acc = new Accession(line, true)
              if (acc.acc !== "") {
                d = acc.toString()
              } else {
                d = line
              }

            } else {
              d = line
            }

            if (d !== "") {
              this.uniprotIDs.push(d)
            }
          })
          break
        case 1:
          this.form.value.text?.replace(/\r\n/g, '\n').split('\n').forEach((line: string) => {
            let d = ""
            if (this.accCompatibleList.includes(<string>this.form.value["from"])) {
              const acc = new Accession(line, true)
              if (acc.acc !== "") {
                d = acc.toString()
              } else {
                d = line
              }
            } else {
              d = line
            }
            if (d !== "") {
              this.uniprotIDs.push(d)
            }
          })
          break
        case 2:
          if (this.form.value.column) {
            const primaryIDs: string[] = []
            for (const s of this.multiColumnFile.getSeries(this.form.value.column)) {
              if (this.accCompatibleList.includes(<string>this.form.value["from"])) {
                const acc = new Accession(s, true)

                if (acc.acc !== "") {
                  primaryIDs.push(acc.toString())
                } else {
                  primaryIDs.push(s)
                }
                this.uniprotIDs.push(acc.toString())
              } else {
                primaryIDs.push(s)
                this.uniprotIDs.push(s)
              }
            }
            this.multiColumnFile = this.multiColumnFile.withSeries("primaryID", new Series(primaryIDs)).bake()
          }
          break
      }
      this.snack.open(`${this.uniprotIDs.length} UniProt Accession IDs`, "OK", {duration: 2000})
    }

    if (this.uniprotIDs.length > 0) {

      // get unique values
      this.uniprotIDs = [...new Set(this.uniprotIDs)]
      this.uniprot.segmentCount = Math.ceil(this.uniprotIDs.length/10000)
      if (this.form.value["from"]) {
        const ref = this.snack.open(`Submitting request to UniProt. This may take some time.`, "OK", {duration:0})
        let snackOpen: boolean = true
        this.uniprot.parse(this.uniprotIDs, this.selectedString, this.form.value["from"]).then(async () => {
          if (snackOpen) {
            snackOpen = false
            ref.dismiss()
          }
          if (this.currentTab === 0 || this.currentTab === 1) {
            this.finished = true
            this.df = this.uniprot.df
            await this.triggerDownload(this.df)
          } else {
            const finDF: any[] = []
            const uniprotMap: any = {}
            for (const r of this.uniprot.df) {
              uniprotMap[r["From"]] = r
            }
            for (const s of this.multiColumnFile) {
              const row: any = {}
              for (const c of this.multiColumnFile.getColumnNames()) {
                row[c] = s[c]
              }
              if (uniprotMap[s['primaryID']]) {
                for (const c of this.uniprot.df.getColumnNames()) {
                  row[c] = uniprotMap[s['primaryID']][c]
                }
              } else {
                for (const c of this.uniprot.df.getColumnNames()) {
                  row[c] = ""
                }
              }
              finDF.push(row)
            }
            const total = new DataFrame(finDF)
            /*const total = this.multiColumnFile.join(
              this.uniprot.df, left => left["primaryID"], right => right["From"], (left, right) => {
                return {
                  ...left,
                  ...right
                }
              }).bake()*/
            this.finished = true
            this.df = total
            await this.triggerDownload(total)
          }
        })
      }
    }
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
    for (const r of this.uniprot.df) {
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

  download() {
    this.triggerDownload(this.df).then()
  }
}
