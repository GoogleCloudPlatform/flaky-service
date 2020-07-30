import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalsService {
  pageDataChange: BehaviorSubject<PageState> = new BehaviorSubject<PageState>({
    currentPage: '',
    repoName: '',
    orgName: '',
  });

  update(pageName: string, orgName?: string, repoName?: string) {
    this.pageDataChange.next({
      currentPage: pageName,
      repoName: repoName,
      orgName: orgName,
    });
  }
}

interface PageState {
  currentPage: string;
  repoName: string;
  orgName: string;
}
