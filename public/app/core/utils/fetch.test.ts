import {
  isContentTypeApplicationJson,
  parseBody,
  parseHeaders,
  parseInitFromOptions,
  parseUrlFromOptions,
} from './fetch';

describe('parseUrlFromOptions', () => {
  it.each`
    params                                                      | url                | expected
    ${undefined}                                                | ${'api/dashboard'} | ${'api/dashboard'}
    ${{ key: 'value' }}                                         | ${'api/dashboard'} | ${'api/dashboard?key=value'}
    ${{ key: undefined }}                                       | ${'api/dashboard'} | ${'api/dashboard'}
    ${{ firstKey: 'first value', secondValue: 'second value' }} | ${'api/dashboard'} | ${'api/dashboard?firstKey=first%20value&secondValue=second%20value'}
    ${{ firstKey: 'first value', secondValue: undefined }}      | ${'api/dashboard'} | ${'api/dashboard?firstKey=first%20value'}
    ${{ id: [1, 2, 3] }}                                        | ${'api/dashboard'} | ${'api/dashboard?id=1&id=2&id=3'}
    ${{ id: [] }}                                               | ${'api/dashboard'} | ${'api/dashboard'}
  `(
    "when called with params: '$params' and url: '$url' then result should be '$expected'",
    ({ params, url, expected }) => {
      expect(parseUrlFromOptions({ params, url })).toEqual(expected);
    }
  );
});

describe('parseInitFromOptions', () => {
  it.each`
    method       | data           | expected
    ${undefined} | ${undefined}   | ${{ method: undefined, headers: { map: { accept: 'application/json, text/plain, */*' } }, body: undefined }}
    ${'GET'}     | ${undefined}   | ${{ method: 'GET', headers: { map: { accept: 'application/json, text/plain, */*' } }, body: undefined }}
    ${'POST'}    | ${{ id: '0' }} | ${{ method: 'POST', headers: { map: { 'content-type': 'application/json', accept: 'application/json, text/plain, */*' } }, body: '{"id":"0"}' }}
    ${'PUT'}     | ${{ id: '0' }} | ${{ method: 'PUT', headers: { map: { 'content-type': 'application/json', accept: 'application/json, text/plain, */*' } }, body: '{"id":"0"}' }}
    ${'monkey'}  | ${undefined}   | ${{ method: 'monkey', headers: { map: { accept: 'application/json, text/plain, */*' } }, body: undefined }}
  `(
    "when called with method: '$method' and data: '$data' then result should be '$expected'",
    ({ method, data, expected }) => {
      expect(parseInitFromOptions({ method, data, url: '' })).toEqual(expected);
    }
  );
});

describe('parseHeaders', () => {
  it.each`
    options                                                                                 | expected
    ${undefined}                                                                            | ${{ map: { accept: 'application/json, text/plain, */*' } }}
    ${{ propKey: 'some prop value' }}                                                       | ${{ map: { accept: 'application/json, text/plain, */*' } }}
    ${{ method: 'GET' }}                                                                    | ${{ map: { accept: 'application/json, text/plain, */*' } }}
    ${{ method: 'POST' }}                                                                   | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json' } }}
    ${{ method: 'PUT' }}                                                                    | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json' } }}
    ${{ headers: { 'content-type': 'application/json' } }}                                  | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json' } }}
    ${{ method: 'GET', headers: { 'content-type': 'application/json' } }}                   | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json' } }}
    ${{ method: 'POST', headers: { 'content-type': 'application/json' } }}                  | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json' } }}
    ${{ method: 'PUT', headers: { 'content-type': 'application/json' } }}                   | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json' } }}
    ${{ headers: { 'cOnTent-tYpe': 'application/json' } }}                                  | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json' } }}
    ${{ headers: { 'content-type': 'AppLiCatIon/JsOn' } }}                                  | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'AppLiCatIon/JsOn' } }}
    ${{ headers: { 'cOnTent-tYpe': 'AppLiCatIon/JsOn' } }}                                  | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'AppLiCatIon/JsOn' } }}
    ${{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }}                 | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/x-www-form-urlencoded' } }}
    ${{ method: 'GET', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }}  | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/x-www-form-urlencoded' } }}
    ${{ method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }} | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/x-www-form-urlencoded' } }}
    ${{ method: 'PUT', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }}  | ${{ map: { accept: 'application/json, text/plain, */*', 'content-type': 'application/x-www-form-urlencoded' } }}
    ${{ headers: { Accept: 'text/plain' } }}                                                | ${{ map: { accept: 'text/plain' } }}
    ${{ headers: { Auth: 'Basic asdasdasd' } }}                                             | ${{ map: { accept: 'application/json, text/plain, */*', auth: 'Basic asdasdasd' } }}
  `("when called with options: '$options' then the result should be '$expected'", ({ options, expected }) => {
    expect(parseHeaders(options)).toEqual(expected);
  });
});

describe('isContentTypeApplicationJson', () => {
  it.each`
    headers                                                                 | expected
    ${undefined}                                                            | ${false}
    ${new Headers({ 'cOnTent-tYpe': 'application/json' })}                  | ${true}
    ${new Headers({ 'content-type': 'AppLiCatIon/JsOn' })}                  | ${true}
    ${new Headers({ 'cOnTent-tYpe': 'AppLiCatIon/JsOn' })}                  | ${true}
    ${new Headers({ 'content-type': 'application/x-www-form-urlencoded' })} | ${false}
    ${new Headers({ auth: 'Basic akdjasdkjalksdjasd' })}                    | ${false}
  `("when called with headers: 'headers' then the result should be '$expected'", ({ headers, expected }) => {
    expect(isContentTypeApplicationJson(headers)).toEqual(expected);
  });
});

describe('parseBody', () => {
  it.each`
    options                  | isAppJson | expected
    ${undefined}             | ${false}  | ${undefined}
    ${undefined}             | ${true}   | ${undefined}
    ${{ data: undefined }}   | ${false}  | ${undefined}
    ${{ data: undefined }}   | ${true}   | ${undefined}
    ${{ data: 'some data' }} | ${false}  | ${'some data'}
    ${{ data: 'some data' }} | ${true}   | ${'some data'}
    ${{ data: { id: '0' } }} | ${false}  | ${new URLSearchParams({ id: '0' })}
    ${{ data: { id: '0' } }} | ${true}   | ${'{"id":"0"}'}
  `(
    "when called with options: '$options' and isAppJson: '$isAppJson' then the result should be '$expected'",
    ({ options, isAppJson, expected }) => {
      expect(parseBody(options, isAppJson)).toEqual(expected);
    }
  );
});
