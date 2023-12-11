import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { MESSAGE, Message } from './message';

@Injectable({ providedIn: 'root' })
export class ChromeService {
  getActiveTab(): Observable<chrome.tabs.Tab> {
    return new Observable((observer) => {
      const queryOptions = { active: true, currentWindow: true };
      chrome.tabs.query(queryOptions, (tabs) => {
        if (chrome.runtime.lastError) {
          observer.error(chrome.runtime.lastError);
          console.log('Error getting tab', chrome.runtime.lastError);
          observer.complete();
        } else {
          observer.next(tabs[0]);
          observer.complete();
        }
      });
    });
  }

  sendMessage({
    type,
    message,
    value,
  }: {
    type?: Message;
    message?: string;
    value?: string;
  }): Observable<any> {
    console.log('Sending message: ', type, message, value);
    return this.getActiveTab().pipe(
      switchMap((activeTab) => {
        const { id: tabId, url } = activeTab;
        const linkedInProfileId = url?.split('in/')[1];
        return new Observable((observer) => {
          if (!tabId) {
            observer.error('Active tab ID is undefined');
            console.log('Active tab ID is undefined');
          }
          chrome.tabs.sendMessage(tabId!, {
            type,
            message,
            linkedInProfileId,
            value,
          });
          // Warning:
          // If we use a callback in sendMessage
          // then we MUST return something from the
          // onMessage handler in the contentScript.js
          if (chrome.runtime.lastError) {
            observer.error(chrome.runtime.lastError.message);
            console.log(
              'on send message error: ',
              chrome.runtime.lastError.message
            );
          }
          observer.next();
          observer.complete();
        });
      })
    );
  }

  getProfileFromLinkedin(): Observable<any> {
    return this.sendMessage({ type: MESSAGE.GET_PROFILE }).pipe(
        switchMap(() => {
          return new Observable((observer) => {
            chrome.storage.local.get('currentProfile', (obj) => {
              if (chrome.runtime.lastError) {
                observer.error(chrome.runtime.lastError);
              } else {
                const profile = obj['currentProfile']
                  ? JSON.parse(obj['currentProfile'])
                  : {};
                observer.next(profile);
                observer.complete();
              }
            });
          });
        })
      );
  }

  getProfileFromStorage(): Observable<any> {
    return new Observable((observer) => {
      chrome.storage.local.get('currentProfile', (result) => {
        console.log("getProfileFromStorage ", result);
        if (chrome.runtime.lastError) {
          observer.error(chrome.runtime.lastError);
          observer.complete();
          return;
        }

        const profile = result['currentProfile']
          ? JSON.parse(result['currentProfile'])
          : {};
        observer.next(profile);
        observer.complete();
      });
    });
  }

  getPositionFromStorage(): Observable<string> {
    return new Observable((observer) => {
      chrome.storage.local.get('position', (result) => {
        console.log("position from storage in getPositionFromStorage", result)
        if (chrome.runtime.lastError) {
          observer.error(chrome.runtime.lastError);
          observer.complete();
          return;
        }

        const position = result['position'] || "";
        observer.next(position);
        observer.complete();
      });
    });
  }
}
