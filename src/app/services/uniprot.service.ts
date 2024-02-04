import { Injectable } from '@angular/core';
import {Parser, getUniprotFromFields} from "uniprotparserjs";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {MatLegacySnackBar as MatSnackBar} from "@angular/material/legacy-snack-bar";

@Injectable({
  providedIn: 'root'
})
export class UniprotService {
  segmentStatus: any = {}
  segments: string[] = []
  segmentCount = 0
  progressValue = 0
  progressText = ""
  df: IDataFrame<number, any> = new DataFrame()
  uniprotFromFields: any = {}
  constructor(private snack: MatSnackBar) {
    getUniprotFromFields().then((res: any) => {
      this.uniprotFromFields = res
    })
  }

  async parse(ids: string[], columnString: string, from: string = "UniProtKB_AC-ID") {
    this.segments = []
    const parser = new Parser(5,columnString,"tsv", false, from)
    const mainDF: IDataFrame[] = []
    this.segmentStatus = {}
    for await (const result of parser.parse(ids, 500)) {
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
      this.snack.open(`Processed UniProt Job Segment ${segment} (${this.segmentStatus[segment].currentRun}/${this.segmentStatus[segment].totalRun})`, "OK", {duration: 2000})
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
}
