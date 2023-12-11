import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  mergeMap,
  switchMap,
} from 'rxjs';
import { API_ENDPOINTS } from './api-endpoints';
import { ChromeService } from './chrome.service';

@Injectable({ providedIn: 'root' })
export class LinkedInService {
  private http = inject(HttpClient);
  private chromeService = inject(ChromeService);

  isLinkedin$ = new BehaviorSubject(false);

  getPositions() {
    return this.http.get(API_ENDPOINTS.getPositions);
  }

  constructor() {
    this.isLinkedin$.pipe(filter((value) => value === true));
  }

  createId(name: string | undefined) {
    if (!name) return '';
    const lowerCaseStr = name.toLowerCase();
    return lowerCaseStr.replace(/\s+/g, '-');
  }

  getCandidate(linkedInProfileId: string | undefined) {
    const unique_id = this.createId(linkedInProfileId);
    return this.http.get(`${API_ENDPOINTS.getCandidate}?id=${unique_id}`);
  }

  isLinkedIn() {
    return this.chromeService.getActiveTab().pipe(
      switchMap((activeTab) => {
        const linkedInProfileId = activeTab.url?.split('in/')[1];
        if (activeTab.url?.includes('linkedin.com/in') && linkedInProfileId) {
          this.isLinkedin$.next(true);
        } else {
          this.isLinkedin$.next(false);
        }
        return this.isLinkedin$.asObservable();
      })
    );
  }

  contentLoadedHandler() {
    return this.chromeService.getProfileFromLinkedin().pipe(
      switchMap((profile) => {
        const unique_id = this.createId(profile.name);
        return this.getCandidate(unique_id);
      })
    );
  }

  getGeneratedMessage({
    position,
    userName,
    userEmail,
  }: {
    position: string;
    userName: string;
    userEmail: string;
  }) {
    return this.chromeService.getProfileFromLinkedin().pipe(
      mergeMap((profile) => {
        return this.http.post(API_ENDPOINTS.getCandidateTemplate, {
          recruiterName: userName,
          recruiterEmail: userEmail,
          position: position,
          json: profile,
        });
      })
    );
  }

  evaluateCandidateProfile({
    position,
    userName,
    userEmail,
  }: {
    position: string;
    userName: string;
    userEmail: string;
  }) {
    return this.chromeService.getProfileFromLinkedin().pipe(
      mergeMap((profile) => {
        console.log('evaluating candidate: ', { profile });
        return this.http.post<{
          status: string;
          message: { content: string; role: string };
        }>(API_ENDPOINTS.evaluateCandidate, {
          recruiterName: userName,
          recruiterEmail: userEmail,
          position: position,
          json: profile,
        });
      })
    );
  }

  saveCandidate() {
    return combineLatest([
      this.chromeService.getProfileFromStorage(),
      this.chromeService.getPositionFromStorage(),
    ]).pipe(
      switchMap(([profile, position]) => {
        console.log('get position from storage', position);
        const data = {
          content: {
            position: position,
            ...profile,
          },
        };
        return this.http.post(API_ENDPOINTS.saveCandidate, data);
      })
    );
  }

  updateStatus(status: string) {
    return this.chromeService.getProfileFromStorage().pipe(
      switchMap((profile) => {
        const statusSelected = status;
        const data = {
          status: statusSelected,
          name: profile.name,
        };

        return this.http.post(API_ENDPOINTS.updateStatus, {
          body: JSON.stringify(data),
        });
      })
    );
  }
}
