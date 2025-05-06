import { Injectable } from '@nestjs/common';
import {Cron} from "@nestjs/schedule";

@Injectable()
export class TasksService {
    @Cron('* * * * *')
    systemCron(){
        console.log(`${new Date().toLocaleString()}`)
    }

    @Cron('* * * * *')
    scrapeTask(){
        // get next jobs from database, lock job

        // for with switch to call shop adapters as promises

        // should the shop adapter log stuff by itself? job state management?
        // { outcome: 'success' }


        // wait for adapters to finish, make sure that adapters have a timeout.
        // unlock jobs update statuses

        // so in theory we could have concurrent shop request as long as there is not a locked job for x shop. We could go for a simple cooldown 60 seconds, have the thing run 15 seconds maybe?

        // why not parallel tho? like just get all possible shop ones and fire them at once. No checking for if x passed and having this run at once. This could also be an indicator of if a job is stuck, like 60 seconds is too long. However there is an issue, if thing is running it will block from running new one. Yeah so it does have to be parallel.
    }
}
