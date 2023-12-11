import { Injectable } from "@angular/core";
import { BehaviorSubject, tap } from "rxjs";

@Injectable(
    { providedIn: 'root' }
)
export class LoadingService {
    private _loaderSubject = new BehaviorSubject(false);

    startLoading() {
        this._loaderSubject.next(true);
    }

    endLoading() {
        this._loaderSubject.next(false);
    }

    isLoading() {
        return this._loaderSubject.asObservable().pipe(
            tap(isLoading => console.log('loading: ', isLoading.valueOf()))
        );
    }
}
