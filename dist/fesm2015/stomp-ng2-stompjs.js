import { Injectable, Optional } from '@angular/core';
import { RxStomp, RxStompState, RxStompRPCConfig, RxStompRPC, RxStompConfig } from '@stomp/rx-stomp';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
export { StompHeaders } from '@stomp/stompjs';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/** @enum {number} */
const StompState = {
    CLOSED: 0,
    TRYING: 1,
    CONNECTED: 2,
    DISCONNECTING: 3,
};
StompState[StompState.CLOSED] = "CLOSED";
StompState[StompState.TRYING] = "TRYING";
StompState[StompState.CONNECTED] = "CONNECTED";
StompState[StompState.DISCONNECTING] = "DISCONNECTING";

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Part of `\@stomp/ng2-stompjs`.
 *
 * **This class has been deprecated in favor of {\@link RxStompService}.
 * It will be dropped `\@stomp/ng2-stompjs\@8.x.x`.**
 *
 * Angular2 STOMP Raw Service using \@stomp/stomp.js
 *
 * You will only need the public properties and
 * methods listed unless you are an advanced user. This service handles subscribing to a
 * message queue using the stomp.js library, and returns
 * values via the ES6 Observable specification for
 * asynchronous value streaming by wiring the STOMP
 * messages into an observable.
 *
 * If you will like to pass the configuration as a dependency,
 * please use StompService class.
 */
class StompRService extends RxStomp {
    constructor() {
        super();
        this.state = new BehaviorSubject(StompState.CLOSED);
        this.connectionState$.subscribe((st) => {
            this.state.next(StompRService._mapStompState(st));
        });
    }
    /**
     * @param {?} st
     * @return {?}
     */
    static _mapStompState(st) {
        if (st === RxStompState.CONNECTING) {
            return StompState.TRYING;
        }
        if (st === RxStompState.OPEN) {
            return StompState.CONNECTED;
        }
        if (st === RxStompState.CLOSING) {
            return StompState.DISCONNECTING;
        }
        if (st === RxStompState.CLOSED) {
            return StompState.CLOSED;
        }
    }
    /**
     * Will trigger when connection is established. Use this to carry out initialization.
     * It will trigger every time a (re)connection occurs. If it is already connected
     * it will trigger immediately. You can safely ignore the value, as it will always be
     * StompState.CONNECTED
     * @return {?}
     */
    get connectObservable() {
        return this.connected$.pipe(map((st) => {
            return StompRService._mapStompState(st);
        }));
    }
    /**
     * Provides headers from most recent connection to the server as return by the CONNECTED
     * frame.
     * If the STOMP connection has already been established it will trigger immediately.
     * It will additionally trigger in event of reconnection, the value will be set of headers from
     * the recent server response.
     * @return {?}
     */
    get serverHeadersObservable() {
        return this.serverHeaders$;
    }
    /**
     * Will emit all messages to the default queue (any message that are not handled by a subscription)
     * @return {?}
     */
    get defaultMessagesObservable() {
        return this.unhandledMessage$;
    }
    /**
     * Will emit all receipts
     * @return {?}
     */
    get receiptsObservable() {
        return this.unhandledReceipts$;
    }
    /**
     * Will trigger when an error occurs. This Subject can be used to handle errors from
     * the stomp broker.
     * @return {?}
     */
    get errorSubject() {
        return this.stompErrors$;
    }
    /**
     * Set configuration
     * @param {?} config
     * @return {?}
     */
    set config(config) {
        const /** @type {?} */ rxStompConfig = {};
        if (typeof (config.url) === 'string') {
            rxStompConfig.brokerURL = config.url;
        }
        else {
            rxStompConfig.webSocketFactory = config.url;
        }
        // Configure client heart-beating
        rxStompConfig.heartbeatIncoming = config.heartbeat_in;
        rxStompConfig.heartbeatOutgoing = config.heartbeat_out;
        // Auto reconnect
        rxStompConfig.reconnectDelay = config.reconnect_delay;
        if (config.debug) {
            rxStompConfig.debug = (str) => {
                console.log(new Date(), str);
            };
        }
        rxStompConfig.connectHeaders = config.headers;
        this.configure(rxStompConfig);
    }
    /**
     * It will connect to the STOMP broker.
     * @return {?}
     */
    initAndConnect() {
        // disconnect if connected
        this.deactivate();
        // Attempt connection, passing in a callback
        this.activate();
    }
    /**
     * It will disconnect from the STOMP broker.
     * @return {?}
     */
    disconnect() {
        this.deactivate();
    }
    /**
     * It will send a message to a named destination. The message must be `string`.
     *
     * The message will get locally queued if the STOMP broker is not connected. It will attempt to
     * publish queued messages as soon as the broker gets connected.
     *
     * @param {?} queueName
     * @param {?=} message
     * @param {?=} headers
     * @return {?}
     */
    publish(queueName, message, headers = {}) {
        if (typeof queueName === 'string') {
            super.publish({ destination: /** @type {?} */ (queueName), body: message, headers });
        }
        else {
            const /** @type {?} */ pubParams = queueName;
            super.publish(pubParams);
        }
    }
    /**
     * It will subscribe to server message queues
     *
     * This method can be safely called even if the STOMP broker is not connected.
     * If the underlying STOMP connection drops and reconnects, it will resubscribe automatically.
     *
     * If a header field 'ack' is not explicitly passed, 'ack' will be set to 'auto'. If you
     * do not understand what it means, please leave it as is.
     *
     * Note that when working with temporary queues where the subscription request
     * creates the
     * underlying queue, mssages might be missed during reconnect. This issue is not specific
     * to this library but the way STOMP brokers are designed to work.
     *
     * @param {?} queueName
     * @param {?=} headers
     * @return {?}
     */
    subscribe(queueName, headers = {}) {
        return this.watch(queueName, headers);
    }
    /**
     * STOMP brokers may carry out operation asynchronously and allow requesting for acknowledgement.
     * To request an acknowledgement, a `receipt` header needs to be sent with the actual request.
     * The value (say receipt-id) for this header needs to be unique for each use. Typically a sequence, a UUID, a
     * random number or a combination may be used.
     *
     * A complaint broker will send a RECEIPT frame when an operation has actually been completed.
     * The operation needs to be matched based in the value of the receipt-id.
     *
     * This method allow watching for a receipt and invoke the callback
     * when corresponding receipt has been received.
     *
     * The actual {\@link Frame}
     * will be passed as parameter to the callback.
     *
     * Example:
     * ```javascript
     *        // Publishing with acknowledgement
     *        let receiptId = randomText();
     *
     *        rxStomp.waitForReceipt(receiptId, function() {
     *          // Will be called after server acknowledges
     *        });
     *        rxStomp.publish({destination: TEST.destination, headers: {receipt: receiptId}, body: msg});
     * ```
     *
     * Maps to: [Client#watchForReceipt]{\@link Client#watchForReceipt}
     * @param {?} receiptId
     * @param {?} callback
     * @return {?}
     */
    waitForReceipt(receiptId, callback) {
        super.watchForReceipt(receiptId, callback);
    }
    /**
     * @return {?}
     */
    get client() {
        return this._stompClient;
    }
}
StompRService.decorators = [
    { type: Injectable }
];
/** @nocollapse */
StompRService.ctorParameters = () => [];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Part of `\@stomp/ng2-stompjs`.
 *
 * **This class has been deprecated in favor of {\@link InjectableRxStompConfig}.
 * It will be dropped `\@stomp/ng2-stompjs\@8.x.x`.**
 *
 * Represents a configuration object for the
 * STOMPService to connect to.
 */
class StompConfig {
}
StompConfig.decorators = [
    { type: Injectable }
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Part of `\@stomp/ng2-stompjs`.
 *
 * **This class has been deprecated in favor of {\@link RxStompService} with {\@link rxStompServiceFactory}.
 * It will be dropped `\@stomp/ng2-stompjs\@8.x.x`.**
 *
 * Angular2 STOMP Service using \@stomp/stomp.js
 *
 * \@description This service handles subscribing to a
 * message queue using the stomp.js library, and returns
 * values via the ES6 Observable specification for
 * asynchronous value streaming by wiring the STOMP
 * messages into an observable.
 *
 * If you want to manually configure and initialize the service
 * please use StompRService
 */
class StompService extends StompRService {
    /**
     * Constructor
     *
     * See README and samples for configuration examples
     * @param {?} config
     */
    constructor(config) {
        super();
        this.config = config;
        this.initAndConnect();
    }
}
StompService.decorators = [
    { type: Injectable }
];
/** @nocollapse */
StompService.ctorParameters = () => [
    { type: StompConfig, },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Part of `\@stomp/ng2-stompjs`.
 *
 * This class is Injectable version of {\@link RxStomp} with exactly same functionality.
 * Please see {\@link RxStomp} for details.
 *
 * See: {\@link /guide/ng2-stompjs/2018/11/04/ng2-stomp-with-angular7.html}
 * for a step-by-step guide.
 *
 * See also {\@link rxStompServiceFactory}.
 */
class RxStompService extends RxStomp {
}
RxStompService.decorators = [
    { type: Injectable }
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Part of `\@stomp/ng2-stompjs`.
 *
 * Injectable version of {\@link RxStompRPCConfig}.
 *
 * See guide at {\@link /guide/rx-stomp/ng2-stompjs/2018/10/12/remote-procedure-call.html}
 */
class InjectableRxStompRpcConfig extends RxStompRPCConfig {
}
InjectableRxStompRpcConfig.decorators = [
    { type: Injectable }
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Part of `\@stomp/ng2-stompjs`.
 *
 * Injectable version of {\@link RxStompRPC}.
 *
 * See guide at {\@link /guide/rx-stomp/ng2-stompjs/2018/10/12/remote-procedure-call.html}
 */
class RxStompRPCService extends RxStompRPC {
    /**
     * @param {?} rxStomp
     * @param {?=} stompRPCConfig
     */
    constructor(rxStomp, stompRPCConfig) {
        super(rxStomp, stompRPCConfig);
    }
}
RxStompRPCService.decorators = [
    { type: Injectable }
];
/** @nocollapse */
RxStompRPCService.ctorParameters = () => [
    { type: RxStompService, },
    { type: InjectableRxStompRpcConfig, decorators: [{ type: Optional },] },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Part of `\@stomp/ng2-stompjs`.
 *
 * This class is Injectable version of {\@link RxStompConfig} with exactly same functionality.
 * Please see {\@link RxStompConfig} for details.
 *
 * See: {\@link /guide/ng2-stompjs/2018/11/04/ng2-stomp-with-angular7.html}
 * for a step-by-step guide.
 *
 * If all fields of configuration are fixed and known in advance you would typically define
 * a `const` and inject it using value.
 *
 * If some fields will be known by later, it can be injected using a factory function.
 *
 * Occasionally it may need to be combined with Angular's APP_INITIALIZER mechanism.
 */
class InjectableRxStompConfig extends RxStompConfig {
}
InjectableRxStompConfig.decorators = [
    { type: Injectable }
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Part of `\@stomp/ng2-stompjs`.
 *
 * This is factory function that can create {\@link RxStompService}
 * when configuration is already known.
 * You can use this function for defining provider for {\@link RxStompService}.
 * {\@link RxStompService} created using this function is configured and activated.
 * This provides the simplest mechanism to define {\@link RxStompService} for Dependency Injection.
 *
 * See: {\@link /guide/ng2-stompjs/2018/11/04/ng2-stomp-with-angular7.html}
 * for a step-by-step guide.
 * @param {?} rxStompConfig
 * @return {?}
 */
function rxStompServiceFactory(rxStompConfig) {
    const /** @type {?} */ rxStompService = new RxStompService();
    rxStompService.configure(rxStompConfig);
    rxStompService.activate();
    return rxStompService;
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

export { StompRService, StompService, StompState, StompConfig, RxStompRPCService, RxStompService, InjectableRxStompConfig, InjectableRxStompRpcConfig, rxStompServiceFactory };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvbXAtbmcyLXN0b21wanMuanMubWFwIiwic291cmNlcyI6WyJuZzovL0BzdG9tcC9uZzItc3RvbXBqcy9zcmMvc3RvbXAtci5zZXJ2aWNlLnRzIiwibmc6Ly9Ac3RvbXAvbmcyLXN0b21wanMvc3JjL3N0b21wLmNvbmZpZy50cyIsIm5nOi8vQHN0b21wL25nMi1zdG9tcGpzL3NyYy9zdG9tcC5zZXJ2aWNlLnRzIiwibmc6Ly9Ac3RvbXAvbmcyLXN0b21wanMvc3JjL3J4LXN0b21wLnNlcnZpY2UudHMiLCJuZzovL0BzdG9tcC9uZzItc3RvbXBqcy9zcmMvaW5qZWN0YWJsZS1yeC1zdG9tcC1ycGMtY29uZmlnLnRzIiwibmc6Ly9Ac3RvbXAvbmcyLXN0b21wanMvc3JjL3J4LXN0b21wLXJwYy5zZXJ2aWNlLnRzIiwibmc6Ly9Ac3RvbXAvbmcyLXN0b21wanMvc3JjL2luamVjdGFibGUtcngtc3RvbXAtY29uZmlnLnRzIiwibmc6Ly9Ac3RvbXAvbmcyLXN0b21wanMvc3JjL3J4LXN0b21wLXNlcnZpY2UtZmFjdG9yeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1J4U3RvbXAsIFJ4U3RvbXBDb25maWcsIFJ4U3RvbXBTdGF0ZX0gZnJvbSAnQHN0b21wL3J4LXN0b21wJztcblxuaW1wb3J0IHtwdWJsaXNoUGFyYW1zLCBDbGllbnQsIE1lc3NhZ2UsIEZyYW1lfSBmcm9tICdAc3RvbXAvc3RvbXBqcyc7XG5cbmltcG9ydCB7QmVoYXZpb3JTdWJqZWN0LCBPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7bWFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7U3RvbXBTdGF0ZX0gZnJvbSAnLi9zdG9tcC1zdGF0ZSc7XG5pbXBvcnQgeyBTdG9tcEhlYWRlcnMgfSBmcm9tICcuL3N0b21wLWhlYWRlcnMnO1xuaW1wb3J0IHtTdG9tcENvbmZpZ30gZnJvbSAnLi9zdG9tcC5jb25maWcnO1xuXG4vKipcbiAqIFBhcnQgb2YgYEBzdG9tcC9uZzItc3RvbXBqc2AuXG4gKlxuICogKipUaGlzIGNsYXNzIGhhcyBiZWVuIGRlcHJlY2F0ZWQgaW4gZmF2b3Igb2Yge0BsaW5rIFJ4U3RvbXBTZXJ2aWNlfS5cbiAqIEl0IHdpbGwgYmUgZHJvcHBlZCBgQHN0b21wL25nMi1zdG9tcGpzQDgueC54YC4qKlxuICpcbiAqIEFuZ3VsYXIyIFNUT01QIFJhdyBTZXJ2aWNlIHVzaW5nIEBzdG9tcC9zdG9tcC5qc1xuICpcbiAqIFlvdSB3aWxsIG9ubHkgbmVlZCB0aGUgcHVibGljIHByb3BlcnRpZXMgYW5kXG4gKiBtZXRob2RzIGxpc3RlZCB1bmxlc3MgeW91IGFyZSBhbiBhZHZhbmNlZCB1c2VyLiBUaGlzIHNlcnZpY2UgaGFuZGxlcyBzdWJzY3JpYmluZyB0byBhXG4gKiBtZXNzYWdlIHF1ZXVlIHVzaW5nIHRoZSBzdG9tcC5qcyBsaWJyYXJ5LCBhbmQgcmV0dXJuc1xuICogdmFsdWVzIHZpYSB0aGUgRVM2IE9ic2VydmFibGUgc3BlY2lmaWNhdGlvbiBmb3JcbiAqIGFzeW5jaHJvbm91cyB2YWx1ZSBzdHJlYW1pbmcgYnkgd2lyaW5nIHRoZSBTVE9NUFxuICogbWVzc2FnZXMgaW50byBhbiBvYnNlcnZhYmxlLlxuICpcbiAqIElmIHlvdSB3aWxsIGxpa2UgdG8gcGFzcyB0aGUgY29uZmlndXJhdGlvbiBhcyBhIGRlcGVuZGVuY3ksXG4gKiBwbGVhc2UgdXNlIFN0b21wU2VydmljZSBjbGFzcy5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFN0b21wUlNlcnZpY2UgZXh0ZW5kcyBSeFN0b21wIHtcbiAgLyoqXG4gICAqIFN0YXRlIG9mIHRoZSBTVE9NUFNlcnZpY2VcbiAgICpcbiAgICogSXQgaXMgYSBCZWhhdmlvclN1YmplY3QgYW5kIHdpbGwgZW1pdCBjdXJyZW50IHN0YXR1cyBpbW1lZGlhdGVseS4gVGhpcyB3aWxsIHR5cGljYWxseSBnZXRcbiAgICogdXNlZCB0byBzaG93IGN1cnJlbnQgc3RhdHVzIHRvIHRoZSBlbmQgdXNlci5cbiAgICovXG4gIHB1YmxpYyBzdGF0ZTogQmVoYXZpb3JTdWJqZWN0PFN0b21wU3RhdGU+O1xuXG4gIHByaXZhdGUgc3RhdGljIF9tYXBTdG9tcFN0YXRlKHN0OiBSeFN0b21wU3RhdGUpOiBTdG9tcFN0YXRlIHtcbiAgICBpZiAoc3QgPT09IFJ4U3RvbXBTdGF0ZS5DT05ORUNUSU5HKSB7XG4gICAgICByZXR1cm4gU3RvbXBTdGF0ZS5UUllJTkc7XG4gICAgfVxuICAgIGlmIChzdCA9PT0gUnhTdG9tcFN0YXRlLk9QRU4pIHtcbiAgICAgIHJldHVybiBTdG9tcFN0YXRlLkNPTk5FQ1RFRDtcbiAgICB9XG4gICAgaWYgKHN0ID09PSBSeFN0b21wU3RhdGUuQ0xPU0lORykge1xuICAgICAgcmV0dXJuIFN0b21wU3RhdGUuRElTQ09OTkVDVElORztcbiAgICB9XG4gICAgaWYgKHN0ID09PSBSeFN0b21wU3RhdGUuQ0xPU0VEKSB7XG4gICAgICByZXR1cm4gU3RvbXBTdGF0ZS5DTE9TRUQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFdpbGwgdHJpZ2dlciB3aGVuIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWQuIFVzZSB0aGlzIHRvIGNhcnJ5IG91dCBpbml0aWFsaXphdGlvbi5cbiAgICogSXQgd2lsbCB0cmlnZ2VyIGV2ZXJ5IHRpbWUgYSAocmUpY29ubmVjdGlvbiBvY2N1cnMuIElmIGl0IGlzIGFscmVhZHkgY29ubmVjdGVkXG4gICAqIGl0IHdpbGwgdHJpZ2dlciBpbW1lZGlhdGVseS4gWW91IGNhbiBzYWZlbHkgaWdub3JlIHRoZSB2YWx1ZSwgYXMgaXQgd2lsbCBhbHdheXMgYmVcbiAgICogU3RvbXBTdGF0ZS5DT05ORUNURURcbiAgICovXG4gIGdldCBjb25uZWN0T2JzZXJ2YWJsZSgpOiBPYnNlcnZhYmxlPFN0b21wU3RhdGU+IHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0ZWQkLnBpcGUobWFwKChzdDogUnhTdG9tcFN0YXRlKTogU3RvbXBTdGF0ZSA9PiB7XG4gICAgICByZXR1cm4gU3RvbXBSU2VydmljZS5fbWFwU3RvbXBTdGF0ZShzdCk7XG4gICAgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb3ZpZGVzIGhlYWRlcnMgZnJvbSBtb3N0IHJlY2VudCBjb25uZWN0aW9uIHRvIHRoZSBzZXJ2ZXIgYXMgcmV0dXJuIGJ5IHRoZSBDT05ORUNURURcbiAgICogZnJhbWUuXG4gICAqIElmIHRoZSBTVE9NUCBjb25uZWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gZXN0YWJsaXNoZWQgaXQgd2lsbCB0cmlnZ2VyIGltbWVkaWF0ZWx5LlxuICAgKiBJdCB3aWxsIGFkZGl0aW9uYWxseSB0cmlnZ2VyIGluIGV2ZW50IG9mIHJlY29ubmVjdGlvbiwgdGhlIHZhbHVlIHdpbGwgYmUgc2V0IG9mIGhlYWRlcnMgZnJvbVxuICAgKiB0aGUgcmVjZW50IHNlcnZlciByZXNwb25zZS5cbiAgICovXG4gIGdldCBzZXJ2ZXJIZWFkZXJzT2JzZXJ2YWJsZSgpOiBPYnNlcnZhYmxlPFN0b21wSGVhZGVycz4ge1xuICAgIHJldHVybiB0aGlzLnNlcnZlckhlYWRlcnMkO1xuICB9XG5cbiAgLyoqXG4gICAqIFdpbGwgZW1pdCBhbGwgbWVzc2FnZXMgdG8gdGhlIGRlZmF1bHQgcXVldWUgKGFueSBtZXNzYWdlIHRoYXQgYXJlIG5vdCBoYW5kbGVkIGJ5IGEgc3Vic2NyaXB0aW9uKVxuICAgKi9cbiAgZ2V0IGRlZmF1bHRNZXNzYWdlc09ic2VydmFibGUoKTogU3ViamVjdDxNZXNzYWdlPiB7XG4gICAgcmV0dXJuIHRoaXMudW5oYW5kbGVkTWVzc2FnZSQ7XG4gIH1cblxuICAvKipcbiAgICogV2lsbCBlbWl0IGFsbCByZWNlaXB0c1xuICAgKi9cbiAgZ2V0IHJlY2VpcHRzT2JzZXJ2YWJsZSgpOiBTdWJqZWN0PEZyYW1lPiB7XG4gICAgcmV0dXJuIHRoaXMudW5oYW5kbGVkUmVjZWlwdHMkO1xuICB9XG5cbiAgLyoqXG4gICAqIFdpbGwgdHJpZ2dlciB3aGVuIGFuIGVycm9yIG9jY3Vycy4gVGhpcyBTdWJqZWN0IGNhbiBiZSB1c2VkIHRvIGhhbmRsZSBlcnJvcnMgZnJvbVxuICAgKiB0aGUgc3RvbXAgYnJva2VyLlxuICAgKi9cbiAgZ2V0IGVycm9yU3ViamVjdCgpOiBTdWJqZWN0PHN0cmluZyB8IEZyYW1lPiB7XG4gICAgcmV0dXJuIHRoaXMuc3RvbXBFcnJvcnMkO1xuICB9XG5cbiAgLyoqIFNldCBjb25maWd1cmF0aW9uICovXG4gIHNldCBjb25maWcoY29uZmlnOiBTdG9tcENvbmZpZykge1xuICAgIGNvbnN0IHJ4U3RvbXBDb25maWc6IFJ4U3RvbXBDb25maWcgPSB7IH07XG5cbiAgICBpZiAodHlwZW9mKGNvbmZpZy51cmwpID09PSAnc3RyaW5nJykge1xuICAgICAgcnhTdG9tcENvbmZpZy5icm9rZXJVUkwgPSBjb25maWcudXJsO1xuICAgIH0gZWxzZSB7XG4gICAgICByeFN0b21wQ29uZmlnLndlYlNvY2tldEZhY3RvcnkgPSBjb25maWcudXJsO1xuICAgIH1cblxuICAgIC8vIENvbmZpZ3VyZSBjbGllbnQgaGVhcnQtYmVhdGluZ1xuICAgIHJ4U3RvbXBDb25maWcuaGVhcnRiZWF0SW5jb21pbmcgPSBjb25maWcuaGVhcnRiZWF0X2luO1xuICAgIHJ4U3RvbXBDb25maWcuaGVhcnRiZWF0T3V0Z29pbmcgPSBjb25maWcuaGVhcnRiZWF0X291dDtcblxuICAgIC8vIEF1dG8gcmVjb25uZWN0XG4gICAgcnhTdG9tcENvbmZpZy5yZWNvbm5lY3REZWxheSA9IGNvbmZpZy5yZWNvbm5lY3RfZGVsYXk7XG5cbiAgICBpZiAoY29uZmlnLmRlYnVnKSB7XG4gICAgICByeFN0b21wQ29uZmlnLmRlYnVnID0gKHN0cjogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKG5ldyBEYXRlKCksIHN0cik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJ4U3RvbXBDb25maWcuY29ubmVjdEhlYWRlcnMgPSBjb25maWcuaGVhZGVycztcblxuICAgIHRoaXMuY29uZmlndXJlKHJ4U3RvbXBDb25maWcpO1xuICB9XG4gIC8qKlxuICAgKiBJdCB3aWxsIGNvbm5lY3QgdG8gdGhlIFNUT01QIGJyb2tlci5cbiAgICovXG4gIHB1YmxpYyBpbml0QW5kQ29ubmVjdCgpOiB2b2lkIHtcbiAgICAvLyBkaXNjb25uZWN0IGlmIGNvbm5lY3RlZFxuICAgIHRoaXMuZGVhY3RpdmF0ZSgpO1xuXG4gICAgLy8gQXR0ZW1wdCBjb25uZWN0aW9uLCBwYXNzaW5nIGluIGEgY2FsbGJhY2tcbiAgICB0aGlzLmFjdGl2YXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogSXQgd2lsbCBkaXNjb25uZWN0IGZyb20gdGhlIFNUT01QIGJyb2tlci5cbiAgICovXG4gIHB1YmxpYyBkaXNjb25uZWN0KCk6IHZvaWQge1xuICAgIHRoaXMuZGVhY3RpdmF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0IHdpbGwgc2VuZCBhIG1lc3NhZ2UgdG8gYSBuYW1lZCBkZXN0aW5hdGlvbi4gVGhlIG1lc3NhZ2UgbXVzdCBiZSBgc3RyaW5nYC5cbiAgICpcbiAgICogVGhlIG1lc3NhZ2Ugd2lsbCBnZXQgbG9jYWxseSBxdWV1ZWQgaWYgdGhlIFNUT01QIGJyb2tlciBpcyBub3QgY29ubmVjdGVkLiBJdCB3aWxsIGF0dGVtcHQgdG9cbiAgICogcHVibGlzaCBxdWV1ZWQgbWVzc2FnZXMgYXMgc29vbiBhcyB0aGUgYnJva2VyIGdldHMgY29ubmVjdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gcXVldWVOYW1lXG4gICAqIEBwYXJhbSBtZXNzYWdlXG4gICAqIEBwYXJhbSBoZWFkZXJzXG4gICAqL1xuICBwdWJsaWMgcHVibGlzaChxdWV1ZU5hbWU6IHN0cmluZ3xwdWJsaXNoUGFyYW1zLCBtZXNzYWdlPzogc3RyaW5nLCBoZWFkZXJzOiBTdG9tcEhlYWRlcnMgPSB7fSk6IHZvaWQge1xuICAgIGlmICh0eXBlb2YgcXVldWVOYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgc3VwZXIucHVibGlzaCh7ZGVzdGluYXRpb246IHF1ZXVlTmFtZSBhcyBzdHJpbmcsIGJvZHk6IG1lc3NhZ2UsIGhlYWRlcnN9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHViUGFyYW1zOiBwdWJsaXNoUGFyYW1zID0gcXVldWVOYW1lO1xuICAgICAgc3VwZXIucHVibGlzaChwdWJQYXJhbXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJdCB3aWxsIHN1YnNjcmliZSB0byBzZXJ2ZXIgbWVzc2FnZSBxdWV1ZXNcbiAgICpcbiAgICogVGhpcyBtZXRob2QgY2FuIGJlIHNhZmVseSBjYWxsZWQgZXZlbiBpZiB0aGUgU1RPTVAgYnJva2VyIGlzIG5vdCBjb25uZWN0ZWQuXG4gICAqIElmIHRoZSB1bmRlcmx5aW5nIFNUT01QIGNvbm5lY3Rpb24gZHJvcHMgYW5kIHJlY29ubmVjdHMsIGl0IHdpbGwgcmVzdWJzY3JpYmUgYXV0b21hdGljYWxseS5cbiAgICpcbiAgICogSWYgYSBoZWFkZXIgZmllbGQgJ2FjaycgaXMgbm90IGV4cGxpY2l0bHkgcGFzc2VkLCAnYWNrJyB3aWxsIGJlIHNldCB0byAnYXV0bycuIElmIHlvdVxuICAgKiBkbyBub3QgdW5kZXJzdGFuZCB3aGF0IGl0IG1lYW5zLCBwbGVhc2UgbGVhdmUgaXQgYXMgaXMuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB3aGVuIHdvcmtpbmcgd2l0aCB0ZW1wb3JhcnkgcXVldWVzIHdoZXJlIHRoZSBzdWJzY3JpcHRpb24gcmVxdWVzdFxuICAgKiBjcmVhdGVzIHRoZVxuICAgKiB1bmRlcmx5aW5nIHF1ZXVlLCBtc3NhZ2VzIG1pZ2h0IGJlIG1pc3NlZCBkdXJpbmcgcmVjb25uZWN0LiBUaGlzIGlzc3VlIGlzIG5vdCBzcGVjaWZpY1xuICAgKiB0byB0aGlzIGxpYnJhcnkgYnV0IHRoZSB3YXkgU1RPTVAgYnJva2VycyBhcmUgZGVzaWduZWQgdG8gd29yay5cbiAgICpcbiAgICogQHBhcmFtIHF1ZXVlTmFtZVxuICAgKiBAcGFyYW0gaGVhZGVyc1xuICAgKi9cbiAgcHVibGljIHN1YnNjcmliZShxdWV1ZU5hbWU6IHN0cmluZywgaGVhZGVyczogU3RvbXBIZWFkZXJzID0ge30pOiBPYnNlcnZhYmxlPE1lc3NhZ2U+IHtcbiAgICByZXR1cm4gdGhpcy53YXRjaChxdWV1ZU5hbWUsIGhlYWRlcnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNUT01QIGJyb2tlcnMgbWF5IGNhcnJ5IG91dCBvcGVyYXRpb24gYXN5bmNocm9ub3VzbHkgYW5kIGFsbG93IHJlcXVlc3RpbmcgZm9yIGFja25vd2xlZGdlbWVudC5cbiAgICogVG8gcmVxdWVzdCBhbiBhY2tub3dsZWRnZW1lbnQsIGEgYHJlY2VpcHRgIGhlYWRlciBuZWVkcyB0byBiZSBzZW50IHdpdGggdGhlIGFjdHVhbCByZXF1ZXN0LlxuICAgKiBUaGUgdmFsdWUgKHNheSByZWNlaXB0LWlkKSBmb3IgdGhpcyBoZWFkZXIgbmVlZHMgdG8gYmUgdW5pcXVlIGZvciBlYWNoIHVzZS4gVHlwaWNhbGx5IGEgc2VxdWVuY2UsIGEgVVVJRCwgYVxuICAgKiByYW5kb20gbnVtYmVyIG9yIGEgY29tYmluYXRpb24gbWF5IGJlIHVzZWQuXG4gICAqXG4gICAqIEEgY29tcGxhaW50IGJyb2tlciB3aWxsIHNlbmQgYSBSRUNFSVBUIGZyYW1lIHdoZW4gYW4gb3BlcmF0aW9uIGhhcyBhY3R1YWxseSBiZWVuIGNvbXBsZXRlZC5cbiAgICogVGhlIG9wZXJhdGlvbiBuZWVkcyB0byBiZSBtYXRjaGVkIGJhc2VkIGluIHRoZSB2YWx1ZSBvZiB0aGUgcmVjZWlwdC1pZC5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgYWxsb3cgd2F0Y2hpbmcgZm9yIGEgcmVjZWlwdCBhbmQgaW52b2tlIHRoZSBjYWxsYmFja1xuICAgKiB3aGVuIGNvcnJlc3BvbmRpbmcgcmVjZWlwdCBoYXMgYmVlbiByZWNlaXZlZC5cbiAgICpcbiAgICogVGhlIGFjdHVhbCB7QGxpbmsgRnJhbWV9XG4gICAqIHdpbGwgYmUgcGFzc2VkIGFzIHBhcmFtZXRlciB0byB0aGUgY2FsbGJhY2suXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogICAgICAgIC8vIFB1Ymxpc2hpbmcgd2l0aCBhY2tub3dsZWRnZW1lbnRcbiAgICogICAgICAgIGxldCByZWNlaXB0SWQgPSByYW5kb21UZXh0KCk7XG4gICAqXG4gICAqICAgICAgICByeFN0b21wLndhaXRGb3JSZWNlaXB0KHJlY2VpcHRJZCwgZnVuY3Rpb24oKSB7XG4gICAqICAgICAgICAgIC8vIFdpbGwgYmUgY2FsbGVkIGFmdGVyIHNlcnZlciBhY2tub3dsZWRnZXNcbiAgICogICAgICAgIH0pO1xuICAgKiAgICAgICAgcnhTdG9tcC5wdWJsaXNoKHtkZXN0aW5hdGlvbjogVEVTVC5kZXN0aW5hdGlvbiwgaGVhZGVyczoge3JlY2VpcHQ6IHJlY2VpcHRJZH0sIGJvZHk6IG1zZ30pO1xuICAgKiBgYGBcbiAgICpcbiAgICogTWFwcyB0bzogW0NsaWVudCN3YXRjaEZvclJlY2VpcHRde0BsaW5rIENsaWVudCN3YXRjaEZvclJlY2VpcHR9XG4gICAqL1xuICBwdWJsaWMgd2FpdEZvclJlY2VpcHQocmVjZWlwdElkOiBzdHJpbmcsIGNhbGxiYWNrOiAoZnJhbWU6IEZyYW1lKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgc3VwZXIud2F0Y2hGb3JSZWNlaXB0KHJlY2VpcHRJZCwgY2FsbGJhY2spO1xuICB9XG5cbiAgZ2V0IGNsaWVudCgpOiBDbGllbnQge1xuICAgIHJldHVybiB0aGlzLl9zdG9tcENsaWVudDtcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IG5ldyBCZWhhdmlvclN1YmplY3Q8U3RvbXBTdGF0ZT4oU3RvbXBTdGF0ZS5DTE9TRUQpO1xuXG4gICAgdGhpcy5jb25uZWN0aW9uU3RhdGUkLnN1YnNjcmliZSgoc3Q6IFJ4U3RvbXBTdGF0ZSkgPT4ge1xuICAgICAgdGhpcy5zdGF0ZS5uZXh0KFN0b21wUlNlcnZpY2UuX21hcFN0b21wU3RhdGUoc3QpKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgU3RvbXBIZWFkZXJzIH0gZnJvbSAnQHN0b21wL3N0b21wanMnO1xuXG4vKipcbiAqIFBhcnQgb2YgYEBzdG9tcC9uZzItc3RvbXBqc2AuXG4gKlxuICogKipUaGlzIGNsYXNzIGhhcyBiZWVuIGRlcHJlY2F0ZWQgaW4gZmF2b3Igb2Yge0BsaW5rIEluamVjdGFibGVSeFN0b21wQ29uZmlnfS5cbiAqIEl0IHdpbGwgYmUgZHJvcHBlZCBgQHN0b21wL25nMi1zdG9tcGpzQDgueC54YC4qKlxuICpcbiAqIFJlcHJlc2VudHMgYSBjb25maWd1cmF0aW9uIG9iamVjdCBmb3IgdGhlXG4gKiBTVE9NUFNlcnZpY2UgdG8gY29ubmVjdCB0by5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFN0b21wQ29uZmlnIHtcbiAgLyoqXG4gICAqIFNlcnZlciBVUkwgdG8gY29ubmVjdCB0by4gUGxlYXNlIHJlZmVyIHRvIHlvdXIgU1RPTVAgYnJva2VyIGRvY3VtZW50YXRpb24gZm9yIGRldGFpbHMuXG4gICAqXG4gICAqIEV4YW1wbGU6IHdzOi8vMTI3LjAuMC4xOjE1Njc0L3dzIChmb3IgYSBSYWJiaXRNUSBkZWZhdWx0IHNldHVwIHJ1bm5pbmcgb24gbG9jYWxob3N0KVxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5IHRoaXMgcGFyYW1ldGVyIGNhbiBiZSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiBvYmplY3Qgc2ltaWxhciB0byBXZWJTb2NrZXRcbiAgICogKHR5cGljYWxseSBTb2NrSlMgaW5zdGFuY2UpLlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKlxuICAgKiAoKSA9PiB7XG4gICAqICAgcmV0dXJuIG5ldyBTb2NrSlMoJ2h0dHA6Ly8xMjcuMC4wLjE6MTU2NzQvc3RvbXAnKTtcbiAgICogfVxuICAgKi9cbiAgdXJsOiBzdHJpbmcgfCAoKCkgPT4gYW55KTtcblxuICAvKipcbiAgICogSGVhZGVyc1xuICAgKiBUeXBpY2FsIGtleXM6IGxvZ2luOiBzdHJpbmcsIHBhc3Njb2RlOiBzdHJpbmcuXG4gICAqIGhvc3Q6c3RyaW5nIHdpbGwgbmVlZWQgdG8gYmUgcGFzc2VkIGZvciB2aXJ0dWFsIGhvc3RzIGluIFJhYmJpdE1RXG4gICAqL1xuICBoZWFkZXJzOiBTdG9tcEhlYWRlcnM7XG5cbiAgLyoqIEhvdyBvZnRlbiB0byBpbmNvbWluZyBoZWFydGJlYXQ/XG4gICAqIEludGVydmFsIGluIG1pbGxpc2Vjb25kcywgc2V0IHRvIDAgdG8gZGlzYWJsZVxuICAgKlxuICAgKiBUeXBpY2FsIHZhbHVlIDAgLSBkaXNhYmxlZFxuICAgKi9cbiAgaGVhcnRiZWF0X2luOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEhvdyBvZnRlbiB0byBvdXRnb2luZyBoZWFydGJlYXQ/XG4gICAqIEludGVydmFsIGluIG1pbGxpc2Vjb25kcywgc2V0IHRvIDAgdG8gZGlzYWJsZVxuICAgKlxuICAgKiBUeXBpY2FsIHZhbHVlIDIwMDAwIC0gZXZlcnkgMjAgc2Vjb25kc1xuICAgKi9cbiAgaGVhcnRiZWF0X291dDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXYWl0IGluIG1pbGxpc2Vjb25kcyBiZWZvcmUgYXR0ZW1wdGluZyBhdXRvIHJlY29ubmVjdFxuICAgKiBTZXQgdG8gMCB0byBkaXNhYmxlXG4gICAqXG4gICAqIFR5cGljYWwgdmFsdWUgNTAwMCAoNSBzZWNvbmRzKVxuICAgKi9cbiAgcmVjb25uZWN0X2RlbGF5OiBudW1iZXI7XG5cbiAgLyoqIEVuYWJsZSBjbGllbnQgZGVidWdnaW5nPyAqL1xuICBkZWJ1ZzogYm9vbGVhbjtcbn1cbiIsImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHsgU3RvbXBDb25maWcgfSBmcm9tICcuL3N0b21wLmNvbmZpZyc7XG5cbmltcG9ydCB7IFN0b21wUlNlcnZpY2UgfSBmcm9tICcuL3N0b21wLXIuc2VydmljZSc7XG5cbi8qKlxuICogUGFydCBvZiBgQHN0b21wL25nMi1zdG9tcGpzYC5cbiAqXG4gKiAqKlRoaXMgY2xhc3MgaGFzIGJlZW4gZGVwcmVjYXRlZCBpbiBmYXZvciBvZiB7QGxpbmsgUnhTdG9tcFNlcnZpY2V9IHdpdGgge0BsaW5rIHJ4U3RvbXBTZXJ2aWNlRmFjdG9yeX0uXG4gKiBJdCB3aWxsIGJlIGRyb3BwZWQgYEBzdG9tcC9uZzItc3RvbXBqc0A4LngueGAuKipcbiAqXG4gKiBBbmd1bGFyMiBTVE9NUCBTZXJ2aWNlIHVzaW5nIEBzdG9tcC9zdG9tcC5qc1xuICpcbiAqIEBkZXNjcmlwdGlvbiBUaGlzIHNlcnZpY2UgaGFuZGxlcyBzdWJzY3JpYmluZyB0byBhXG4gKiBtZXNzYWdlIHF1ZXVlIHVzaW5nIHRoZSBzdG9tcC5qcyBsaWJyYXJ5LCBhbmQgcmV0dXJuc1xuICogdmFsdWVzIHZpYSB0aGUgRVM2IE9ic2VydmFibGUgc3BlY2lmaWNhdGlvbiBmb3JcbiAqIGFzeW5jaHJvbm91cyB2YWx1ZSBzdHJlYW1pbmcgYnkgd2lyaW5nIHRoZSBTVE9NUFxuICogbWVzc2FnZXMgaW50byBhbiBvYnNlcnZhYmxlLlxuICpcbiAqIElmIHlvdSB3YW50IHRvIG1hbnVhbGx5IGNvbmZpZ3VyZSBhbmQgaW5pdGlhbGl6ZSB0aGUgc2VydmljZVxuICogcGxlYXNlIHVzZSBTdG9tcFJTZXJ2aWNlXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBTdG9tcFNlcnZpY2UgZXh0ZW5kcyBTdG9tcFJTZXJ2aWNlIHtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICpcbiAgICogU2VlIFJFQURNRSBhbmQgc2FtcGxlcyBmb3IgY29uZmlndXJhdGlvbiBleGFtcGxlc1xuICAgKi9cbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbmZpZzogU3RvbXBDb25maWcpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5pbml0QW5kQ29ubmVjdCgpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBSeFN0b21wIH0gZnJvbSAnQHN0b21wL3J4LXN0b21wJztcblxuLyoqXG4gKiBQYXJ0IG9mIGBAc3RvbXAvbmcyLXN0b21wanNgLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgSW5qZWN0YWJsZSB2ZXJzaW9uIG9mIHtAbGluayBSeFN0b21wfSB3aXRoIGV4YWN0bHkgc2FtZSBmdW5jdGlvbmFsaXR5LlxuICogUGxlYXNlIHNlZSB7QGxpbmsgUnhTdG9tcH0gZm9yIGRldGFpbHMuXG4gKlxuICogU2VlOiB7QGxpbmsgL2d1aWRlL25nMi1zdG9tcGpzLzIwMTgvMTEvMDQvbmcyLXN0b21wLXdpdGgtYW5ndWxhcjcuaHRtbH1cbiAqIGZvciBhIHN0ZXAtYnktc3RlcCBndWlkZS5cbiAqXG4gKiBTZWUgYWxzbyB7QGxpbmsgcnhTdG9tcFNlcnZpY2VGYWN0b3J5fS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFJ4U3RvbXBTZXJ2aWNlIGV4dGVuZHMgUnhTdG9tcCB7IH1cbiIsImltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1J4U3RvbXBSUENDb25maWd9IGZyb20gJ0BzdG9tcC9yeC1zdG9tcCc7XG5cbi8qKlxuICogUGFydCBvZiBgQHN0b21wL25nMi1zdG9tcGpzYC5cbiAqXG4gKiBJbmplY3RhYmxlIHZlcnNpb24gb2Yge0BsaW5rIFJ4U3RvbXBSUENDb25maWd9LlxuICpcbiAqIFNlZSBndWlkZSBhdCB7QGxpbmsgL2d1aWRlL3J4LXN0b21wL25nMi1zdG9tcGpzLzIwMTgvMTAvMTIvcmVtb3RlLXByb2NlZHVyZS1jYWxsLmh0bWx9XG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBJbmplY3RhYmxlUnhTdG9tcFJwY0NvbmZpZyBleHRlbmRzIFJ4U3RvbXBSUENDb25maWcgeyB9XG4iLCJpbXBvcnQge0luamVjdGFibGUsIE9wdGlvbmFsfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtSeFN0b21wUlBDfSBmcm9tICdAc3RvbXAvcngtc3RvbXAnO1xuaW1wb3J0IHtSeFN0b21wU2VydmljZX0gZnJvbSAnLi9yeC1zdG9tcC5zZXJ2aWNlJztcbmltcG9ydCB7SW5qZWN0YWJsZVJ4U3RvbXBScGNDb25maWd9IGZyb20gJy4vaW5qZWN0YWJsZS1yeC1zdG9tcC1ycGMtY29uZmlnJztcblxuLyoqXG4gKiBQYXJ0IG9mIGBAc3RvbXAvbmcyLXN0b21wanNgLlxuICpcbiAqIEluamVjdGFibGUgdmVyc2lvbiBvZiB7QGxpbmsgUnhTdG9tcFJQQ30uXG4gKlxuICogU2VlIGd1aWRlIGF0IHtAbGluayAvZ3VpZGUvcngtc3RvbXAvbmcyLXN0b21wanMvMjAxOC8xMC8xMi9yZW1vdGUtcHJvY2VkdXJlLWNhbGwuaHRtbH1cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFJ4U3RvbXBSUENTZXJ2aWNlIGV4dGVuZHMgUnhTdG9tcFJQQyB7XG4gIGNvbnN0cnVjdG9yKHJ4U3RvbXA6IFJ4U3RvbXBTZXJ2aWNlLCBAT3B0aW9uYWwoKSBzdG9tcFJQQ0NvbmZpZz86IEluamVjdGFibGVSeFN0b21wUnBjQ29uZmlnKSB7XG4gICAgc3VwZXIocnhTdG9tcCwgc3RvbXBSUENDb25maWcpO1xuICB9XG59XG4iLCJpbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtSeFN0b21wQ29uZmlnfSBmcm9tICdAc3RvbXAvcngtc3RvbXAnO1xuXG4vKipcbiAqIFBhcnQgb2YgYEBzdG9tcC9uZzItc3RvbXBqc2AuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBJbmplY3RhYmxlIHZlcnNpb24gb2Yge0BsaW5rIFJ4U3RvbXBDb25maWd9IHdpdGggZXhhY3RseSBzYW1lIGZ1bmN0aW9uYWxpdHkuXG4gKiBQbGVhc2Ugc2VlIHtAbGluayBSeFN0b21wQ29uZmlnfSBmb3IgZGV0YWlscy5cbiAqXG4gKiBTZWU6IHtAbGluayAvZ3VpZGUvbmcyLXN0b21wanMvMjAxOC8xMS8wNC9uZzItc3RvbXAtd2l0aC1hbmd1bGFyNy5odG1sfVxuICogZm9yIGEgc3RlcC1ieS1zdGVwIGd1aWRlLlxuICpcbiAqIElmIGFsbCBmaWVsZHMgb2YgY29uZmlndXJhdGlvbiBhcmUgZml4ZWQgYW5kIGtub3duIGluIGFkdmFuY2UgeW91IHdvdWxkIHR5cGljYWxseSBkZWZpbmVcbiAqIGEgYGNvbnN0YCBhbmQgaW5qZWN0IGl0IHVzaW5nIHZhbHVlLlxuICpcbiAqIElmIHNvbWUgZmllbGRzIHdpbGwgYmUga25vd24gYnkgbGF0ZXIsIGl0IGNhbiBiZSBpbmplY3RlZCB1c2luZyBhIGZhY3RvcnkgZnVuY3Rpb24uXG4gKlxuICogT2NjYXNpb25hbGx5IGl0IG1heSBuZWVkIHRvIGJlIGNvbWJpbmVkIHdpdGggQW5ndWxhcidzIEFQUF9JTklUSUFMSVpFUiBtZWNoYW5pc20uXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBJbmplY3RhYmxlUnhTdG9tcENvbmZpZyBleHRlbmRzIFJ4U3RvbXBDb25maWcgeyB9XG4iLCJpbXBvcnQge0luamVjdGFibGVSeFN0b21wQ29uZmlnfSBmcm9tICcuL2luamVjdGFibGUtcngtc3RvbXAtY29uZmlnJztcbmltcG9ydCB7UnhTdG9tcFNlcnZpY2V9IGZyb20gJy4vcngtc3RvbXAuc2VydmljZSc7XG5cbi8qKlxuICogUGFydCBvZiBgQHN0b21wL25nMi1zdG9tcGpzYC5cbiAqXG4gKiBUaGlzIGlzIGZhY3RvcnkgZnVuY3Rpb24gdGhhdCBjYW4gY3JlYXRlIHtAbGluayBSeFN0b21wU2VydmljZX1cbiAqIHdoZW4gY29uZmlndXJhdGlvbiBpcyBhbHJlYWR5IGtub3duLlxuICogWW91IGNhbiB1c2UgdGhpcyBmdW5jdGlvbiBmb3IgZGVmaW5pbmcgcHJvdmlkZXIgZm9yIHtAbGluayBSeFN0b21wU2VydmljZX0uXG4gKiB7QGxpbmsgUnhTdG9tcFNlcnZpY2V9IGNyZWF0ZWQgdXNpbmcgdGhpcyBmdW5jdGlvbiBpcyBjb25maWd1cmVkIGFuZCBhY3RpdmF0ZWQuXG4gKiBUaGlzIHByb3ZpZGVzIHRoZSBzaW1wbGVzdCBtZWNoYW5pc20gdG8gZGVmaW5lIHtAbGluayBSeFN0b21wU2VydmljZX0gZm9yIERlcGVuZGVuY3kgSW5qZWN0aW9uLlxuICpcbiAqIFNlZToge0BsaW5rIC9ndWlkZS9uZzItc3RvbXBqcy8yMDE4LzExLzA0L25nMi1zdG9tcC13aXRoLWFuZ3VsYXI3Lmh0bWx9XG4gKiBmb3IgYSBzdGVwLWJ5LXN0ZXAgZ3VpZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByeFN0b21wU2VydmljZUZhY3RvcnkocnhTdG9tcENvbmZpZzogSW5qZWN0YWJsZVJ4U3RvbXBDb25maWcpOiBSeFN0b21wU2VydmljZSB7XG4gIGNvbnN0IHJ4U3RvbXBTZXJ2aWNlID0gbmV3IFJ4U3RvbXBTZXJ2aWNlKCk7XG5cbiAgcnhTdG9tcFNlcnZpY2UuY29uZmlndXJlKHJ4U3RvbXBDb25maWcpO1xuICByeFN0b21wU2VydmljZS5hY3RpdmF0ZSgpO1xuXG4gIHJldHVybiByeFN0b21wU2VydmljZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQ0EsbUJBQTJCLFNBQVEsT0FBTzs7UUErTHRDLEtBQUssRUFBRSxDQUFDO1FBRVIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLGVBQWUsQ0FBYSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFaEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQWdCO1lBQy9DLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMs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