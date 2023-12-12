import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  bindCallback,
  combineLatest,
  finalize,
  map,
  of,
  tap,
} from 'rxjs';
import { LoadingService } from './loading.service';

interface IUser {
  email: string;
  family_name: string;
  given_name: string;
  hd: string;
  id: string;
  locale: string;
  name: string;
  picture: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleLoginService {
  private readonly http = inject(HttpClient);
  private readonly loading = inject(LoadingService);

  userInfoURL = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
  user = new BehaviorSubject<IUser>({} as IUser);

  checkSignIn() {
    return new Observable<{}>((observer) => {
      this.loading.startLoading();
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        chrome.identity.removeCachedAuthToken({token: token!})
            return of(true);
        // if (token) {
        //     console.log({token})
            
        //   combineLatest([
        //     this.fetchProfileUserInfo(),
        //     this.fetchUserProfile(token),
        //   ])
        //     .pipe(
        //       map(([userInfo, userProfile]) => ({
        //         ...userInfo,
        //         ...userProfile,
        //       }))
        //     )
        //     .subscribe({
        //       next: (v) => {
        //         console.log('user:', v);
        //         this.user.next(v);
        //         observer.next(v);
        //         observer.complete();
        //       },
        //       error: (e) => {
        //         console.error(e);
        //         observer.complete();
        //       },
        //     });
        // } else {
        //   this.user.next({} as IUser);
        //   observer.error('No token received');
        // }
      });
    }).pipe(
      finalize(() => {
        this.loading.endLoading();
      })
    );
  }

  signInWithGoogle() {
    return new Observable<{}>((observer) => {
      this.loading.startLoading();
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (token) {
          combineLatest([
            this.fetchProfileUserInfo(),
            this.fetchUserProfile(token),
          ])
            .pipe(
              map(([userInfo, userProfile]) => ({
                ...userInfo,
                ...userProfile,
              }))
            )
            .subscribe({
              next: (v) => {
                this.user.next(v);
                observer.next(v);
                observer.complete();
              },
              error: (e) => {
                console.error(e);
                observer.complete();
              },
            });
        } else {
          this.user.next({} as IUser);
          observer.error('No token received');
        }
      });
    }).pipe(
      finalize(() => {
        this.loading.endLoading();
      })
    );
  }

  signInWithAuthFlow() {
    // Currently not working
    // But this flow allows for other accounts to log in.
    const clientId =
      '882215026831-oid12hie1mklhhrbtdepp73sn7sjgelv.apps.googleusercontent.com';
    const options = {
      url: `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
        chrome.identity.getRedirectURL()
      )}&scope=profile&prompt=select_account`,
      interactive: true,
    };
    return new Observable((observer) => {
      chrome.identity.launchWebAuthFlow(options, (redirectUrl) => {
        if (redirectUrl) {
          const urlParams = new URLSearchParams(
            new URL(redirectUrl).hash.substring(1)
          );
          const token = urlParams.get('access_token');
          if (token) {
            combineLatest([
              this.fetchProfileUserInfo(),
              this.fetchUserProfile('token'),
            ])
              .pipe(
                map(([userInfo, userProfile]) => ({
                  ...userInfo,
                  ...userProfile,
                }))
              )
              .subscribe({
                next: (v) => {
                  this.user.next(v);
                  observer.next(v);
                },
                error: (e) => console.error(e),
              });
          } else {
            observer.error('No token received');
          }
        }
      });
    }).pipe(
      tap(() => this.loading.startLoading()),
      finalize(() => this.loading.endLoading())
    );
  }

  fetchProfileUserInfo(): Observable<{ email: string; id: string }> {
    const profileUserInfoObservable = bindCallback(
      chrome.identity.getProfileUserInfo
    );
    // @ts-ignore
    return profileUserInfoObservable();
  }

  fetchUserProfile(token: string): Observable<any> {
    return this.http.get(this.userInfoURL, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
