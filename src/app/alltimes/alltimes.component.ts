import { Component, OnInit, ViewChild } from '@angular/core';
import { MenuItem, DataTable, ConfirmationService,LazyLoadEvent,Message } from "primeng/primeng";
import Dexie from 'dexie';
import { Observable } from "rxjs";
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";


const MAX_EXAMPLE_RECORDS = 1000;

@Component({
  selector: 'at-alltimes',
  templateUrl: './alltimes.component.html',
  styleUrls: ['./alltimes.component.css']
})
export class AlltimesComponent implements OnInit {

  @ViewChild("dt") dt : DataTable;

    allTimesheetData = [];
    onTimeSheetDialog = false;

    allProjectNames = ['', 'Payroll App', 'Mobile App', 'Agile Times'];

    allProjects = this.allProjectNames.map((proj) => {
      return { label: proj, value: proj }
    });

    selectedRows: Array<any>;

    messages: Message[] = [];

    contextMenu: MenuItem[];

    timeSheetForm: FormGroup;
    recordCount : number;

    constructor(private apollo: Apollo,private confirmationService: ConfirmationService,private formBuilder: FormBuilder) {

     }

    ngOnInit() {

      const AllClientsQuery = gql`
      query allTimeSheets {
        allTimesheets {
            id
            user
            project
            category
            startTime
            endTime
          }
      }`;


      const queryObservable = this.apollo.watchQuery({

        query: AllClientsQuery, pollInterval:200

      }).subscribe(({ data, loading }: any) => {

        console.log("DATA IS "+data);
        this.allTimesheetData = data.allTimesheets;
        this.recordCount = data.allTimesheets.length;

      });

      this.timeSheetForm = this.formBuilder.group({
        user: ['', [Validators.required, Validators.minLength(5)]],
        project: ['', [Validators.required, Validators.maxLength(140)]],
        category: ['', Validators.required],
        startTime: ['',Validators.required],
        endTime:['',Validators.required],
        date:[new Date(),Validators.required]
      })

    }



    onEditComplete(editInfo) { }

    cancelNewTimeSheetDialog(){
      this.confirmationService.confirm({
        header: 'Cancel TimeSheet Creation',
        message: 'Cancel all changes. Are you sure?',
        accept: () => {
          this.onTimeSheetDialog = false;
          this.messages.push({ severity: 'info', summary: 'Edits Cancelled', detail: 'No changes were saved' });

          this.timeSheetForm.value.user = "";
      this.timeSheetForm.value.project = "";
      this.timeSheetForm.value.category = "";
      this.timeSheetForm.value.startTime = "";
      this.timeSheetForm.value.endTime = "";

        },
        reject: () => {
          this.messages.push({ severity: 'warn', summary: 'Cancelled the Cancel', detail: 'Please continue your editing' });
          console.log("False cancel. Just keep editing.");
        }
      });


    }

    hasFormErrors() {
      return !this.timeSheetForm.valid;
    }
    saveNewTimeSheetEntry() {
      this.onTimeSheetDialog = false;

      const user = this.timeSheetForm.value.user;
      const project = this.timeSheetForm.value.project;
      const category = this.timeSheetForm.value.category;
      const startTime = this.timeSheetForm.value.startTime;
      const endTime = this.timeSheetForm.value.endTime;

      const createTimeSheet = gql`
  mutation createTimeSheet ($user: String!, $project: String!, $category: String!,
    $startTime: Int!, $endTime: Int!, $date: DateTime!) {
    createTimesheet(user: $user, project: $project, category: $category, startTime: $startTime, endTime: $endTime, date: $date ) {
      id
    }
  }
`;

      console.log(user);
      this.apollo.mutate({
        mutation: createTimeSheet,
        variables: {
          user: user,
          project: project,
          category: category,
          startTime: startTime,
          endTime: endTime,
          date: new Date()
        }
      }).subscribe(({ data }) => {
        console.log('Data received...', data);

      }, (error) => {
        console.log('Some error occured...:', error);
      });

      this.messages.push({ severity: 'success', summary: 'Timesheet Entry Created', detail: 'Your timesheet entry has been created' });

      this.timeSheetForm.value.user = "";
      this.timeSheetForm.value.project = "";
      this.timeSheetForm.value.category = "";
      this.timeSheetForm.value.startTime = "";
      this.timeSheetForm.value.endTime = "";

      this.onTimeSheetDialog = false;
    }

    // onNewTimeSheetSubmit() {
    //   alert(JSON.stringify(this.timeSheetForm.value));
    // }
}
