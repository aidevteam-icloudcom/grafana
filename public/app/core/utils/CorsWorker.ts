// works with webpack plugin: scripts/webpack/plugins/CorsWorkerPlugin.js
export class CorsWorker extends window.Worker {
  constructor(url: URL, options?: WorkerOptions) {
    // by default, worker inherits HTML document's location and pathname which leads to wrong public path value
    // the CorsWorkerPlugin will override it with the value based on the initial worker chunk, ie.
    //    initial worker chunk: http://host.com/cdn/scripts/worker-123.js
    //    resulting public path: http://host.com/cdn/scripts

    const scriptUrl = url.toString();
    const urlParts = scriptUrl.split('/');
    urlParts.pop();
    const scriptsBasePathUrl = `${urlParts.join('/')}/`;

    const importScripts = `importScripts('${scriptUrl}');`;
    const objectURL = URL.createObjectURL(
      new Blob([`__webpack_worker_public_path__ = '${scriptsBasePathUrl}'; ${importScripts}`], {
        type: 'application/javascript',
      })
    );
    super(objectURL, options);
    URL.revokeObjectURL(objectURL);
  }
}

// Vite equivalent of the above CorsWorker to allow loading workers from a different origin
export function WorkaroundWorker(workerUrl: string, options: WorkerOptions) {
  const js = `import ${JSON.stringify(new URL(workerUrl, import.meta.url))}`;
  const blob = new Blob([js], { type: 'application/javascript' });
  const objURL = URL.createObjectURL(blob);
  const worker = new Worker(objURL, { type: 'module', name: options?.name });
  worker.addEventListener('error', (e) => {
    URL.revokeObjectURL(objURL);
  });
  return worker;
}
