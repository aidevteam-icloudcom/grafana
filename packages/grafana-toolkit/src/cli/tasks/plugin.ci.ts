import { Task, TaskRunner } from './task';
import { pluginBuildRunner } from './plugin.build';
import { restoreCwd } from '../utils/cwd';
import { S3Client } from './plugin/ci/aws';
import { getPluginJson } from '../../config/utils/pluginValidation';
import { PluginMeta } from '@grafana/ui';

// @ts-ignore
import execa = require('execa');
import path = require('path');
import fs = require('fs');
import { getPackageDetails } from './plugin/ci/utils';
import { job, getJobFolder, writeJobStats, getCiFolder, getPluginBuildInfo } from './plugin/ci/env';
import { agregateWorkflowInfo, agregateCoverageInfo, agregateTestInfo } from './plugin/ci/workflow';
import {
  PluginPackageDetails,
  PluginBuildReport,
  PluginHistory,
  defaultPluginHistory,
  appendPluginHistory,
  TestResultInfo,
} from './plugin/ci/types';

export interface PluginCIOptions {
  backend?: string;
  full?: boolean;
}

/**
 * 1. BUILD
 *
 *  when platform exists it is building backend, otherwise frontend
 *
 *  Each build writes data:
 *   ~/ci/jobs/build_xxx/
 *
 *  Anything that should be put into the final zip file should be put in:
 *   ~/ci/jobs/build_xxx/dist
 */
const buildPluginRunner: TaskRunner<PluginCIOptions> = async ({ backend }) => {
  const start = Date.now();
  const workDir = getJobFolder();
  await execa('rimraf', [workDir]);
  fs.mkdirSync(workDir);

  if (backend) {
    console.log('TODO, backend support?');
    fs.mkdirSync(path.resolve(process.cwd(), 'dist'));
    const file = path.resolve(process.cwd(), 'dist', `README_${backend}.txt`);
    fs.writeFile(file, `TODO... build bakend plugin: ${backend}!`, err => {
      if (err) {
        throw new Error('Unable to write: ' + file);
      }
    });
  } else {
    // Do regular build process with coverage
    await pluginBuildRunner({ coverage: true });
  }

  // Move local folders to the scoped job folder
  for (const name of ['dist', 'coverage']) {
    const dir = path.resolve(process.cwd(), name);
    if (fs.existsSync(dir)) {
      fs.renameSync(dir, path.resolve(workDir, name));
    }
  }
  writeJobStats(start, workDir);
};

export const ciBuildPluginTask = new Task<PluginCIOptions>('Build Plugin', buildPluginRunner);

/**
 * 2. Build Docs
 *
 *  Take /docs/* and format it into /ci/docs/HTML site
 *
 */
const buildPluginDocsRunner: TaskRunner<PluginCIOptions> = async () => {
  const docsSrc = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(docsSrc)) {
    console.log('No docs src');
    return;
  }

  const start = Date.now();
  const workDir = getJobFolder();
  await execa('rimraf', [workDir]);
  fs.mkdirSync(workDir);

  const docsDest = path.resolve(process.cwd(), 'ci', 'docs');
  fs.mkdirSync(docsDest);

  const exe = await execa('cp', ['-rv', docsSrc + '/.', docsDest]);
  console.log(exe.stdout);

  fs.writeFile(path.resolve(docsDest, 'index.html'), `TODO... actually build docs`, err => {
    if (err) {
      throw new Error('Unable to docs');
    }
  });

  writeJobStats(start, workDir);
};

export const ciBuildPluginDocsTask = new Task<PluginCIOptions>('Build Plugin Docs', buildPluginDocsRunner);

/**
 * 2. Package
 *
 *  Take everything from `~/ci/job/{any}/dist` and
 *  1. merge it into: `~/ci/dist`
 *  2. zip it into packages in `~/ci/packages`
 *  3. prepare grafana environment in: `~/ci/grafana-test-env`
 */
const packagePluginRunner: TaskRunner<PluginCIOptions> = async () => {
  const start = Date.now();
  const ciDir = getCiFolder();
  const packagesDir = path.resolve(ciDir, 'packages');
  const distDir = path.resolve(ciDir, 'dist');
  const docsDir = path.resolve(ciDir, 'docs');
  const grafanaEnvDir = path.resolve(ciDir, 'grafana-test-env');
  await execa('rimraf', [packagesDir, distDir, grafanaEnvDir]);
  fs.mkdirSync(packagesDir);
  fs.mkdirSync(distDir);
  fs.mkdirSync(grafanaEnvDir);

  console.log('Build Dist Folder');

  // 1. Check for a local 'dist' folder
  const d = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(d)) {
    await execa('cp', ['-rn', d + '/.', distDir]);
  }

  // 2. Look for any 'dist' folders under ci/job/XXX/dist
  const dirs = fs.readdirSync(path.resolve(ciDir, 'jobs'));
  for (const j of dirs) {
    const contents = path.resolve(ciDir, 'jobs', j, 'dist');
    if (fs.existsSync(contents)) {
      try {
        await execa('cp', ['-rn', contents + '/.', distDir]);
      } catch (er) {
        throw new Error('Duplicate files found in dist folders');
      }
    }
  }

  console.log('Save the source info in plugin.json');
  const pluginJsonFile = path.resolve(distDir, 'plugin.json');
  const pluginInfo = getPluginJson(pluginJsonFile);
  pluginInfo.info.build = await getPluginBuildInfo();
  fs.writeFile(pluginJsonFile, JSON.stringify(pluginInfo, null, 2), err => {
    if (err) {
      throw new Error('Error writing: ' + pluginJsonFile);
    }
  });

  console.log('Building ZIP');
  let zipName = pluginInfo.id + '-' + pluginInfo.info.version + '.zip';
  let zipFile = path.resolve(packagesDir, zipName);
  process.chdir(distDir);
  await execa('zip', ['-r', zipFile, '.']);
  restoreCwd();

  const zipStats = fs.statSync(zipFile);
  if (zipStats.size < 100) {
    throw new Error('Invalid zip file: ' + zipFile);
  }

  const info: PluginPackageDetails = {
    plugin: await getPackageDetails(zipFile, distDir),
  };

  console.log('Setup Grafan Environment');
  let p = path.resolve(grafanaEnvDir, 'plugins', pluginInfo.id);
  fs.mkdirSync(p, { recursive: true });
  await execa('unzip', [zipFile, '-d', p]);

  // If docs exist, zip them into packages
  if (fs.existsSync(docsDir)) {
    console.log('Creating documentation zip');
    zipName = pluginInfo.id + '-' + pluginInfo.info.version + '-docs.zip';
    zipFile = path.resolve(packagesDir, zipName);
    process.chdir(docsDir);
    await execa('zip', ['-r', zipFile, '.']);
    restoreCwd();

    info.docs = await getPackageDetails(zipFile, docsDir);
  }

  p = path.resolve(packagesDir, 'info.json');
  fs.writeFile(p, JSON.stringify(info, null, 2), err => {
    if (err) {
      throw new Error('Error writing package info: ' + p);
    }
  });

  // Write the custom settings
  p = path.resolve(grafanaEnvDir, 'custom.ini');
  const customIniBody =
    `# Autogenerated by @grafana/toolkit \n` +
    `[paths] \n` +
    `plugins = ${path.resolve(grafanaEnvDir, 'plugins')}\n` +
    `\n`; // empty line
  fs.writeFile(p, customIniBody, err => {
    if (err) {
      throw new Error('Unable to write: ' + p);
    }
  });

  writeJobStats(start, getJobFolder());
};

export const ciPackagePluginTask = new Task<PluginCIOptions>('Bundle Plugin', packagePluginRunner);

/**
 * 3. Test (end-to-end)
 *
 *  deploy the zip to a running grafana instance
 *
 */
const testPluginRunner: TaskRunner<PluginCIOptions> = async ({ full }) => {
  const start = Date.now();
  const workDir = getJobFolder();
  const pluginInfo = getPluginJson(`${process.cwd()}/ci/dist/plugin.json`);
  const results: TestResultInfo = { job };
  const args = {
    withCredentials: true,
    baseURL: process.env.BASE_URL || 'http://localhost:3000/',
    responseType: 'json',
    auth: {
      username: 'admin',
      password: 'admin',
    },
  };

  try {
    const axios = require('axios');
    const frontendSettings = await axios.get('api/frontend/settings', args);
    results.grafana = frontendSettings.data.buildInfo;

    console.log('Grafana: ' + JSON.stringify(results.grafana, null, 2));

    const loadedMetaRsp = await axios.get(`api/plugins/${pluginInfo.id}/settings`, args);
    const loadedMeta: PluginMeta = loadedMetaRsp.data;
    console.log('Plugin Info: ' + JSON.stringify(loadedMeta, null, 2));
    if (loadedMeta.info.build) {
      console.log('Compage to', pluginInfo.info.build);
    }

    console.log('TODO Puppeteer Tests', workDir);

    results.status = 'TODO... puppeteer';
  } catch (err) {
    results.error = err;
    results.status = 'EXCEPTION Thrown';
    console.log('Test Error', err);
  }

  const f = path.resolve(workDir, 'results.json');
  fs.writeFile(f, JSON.stringify(results, null, 2), err => {
    if (err) {
      throw new Error('Error saving: ' + f);
    }
  });

  writeJobStats(start, workDir);
};

export const ciTestPluginTask = new Task<PluginCIOptions>('Test Plugin (e2e)', testPluginRunner);

/**
 * 4. Report
 *
 *  Create a report from all the previous steps
 */
const pluginReportRunner: TaskRunner<PluginCIOptions> = async () => {
  const ciDir = path.resolve(process.cwd(), 'ci');
  const packageInfo = require(path.resolve(ciDir, 'packages', 'info.json'));

  console.log('Save the source info in plugin.json');
  const pluginJsonFile = path.resolve(ciDir, 'dist', 'plugin.json');
  const pluginMeta = getPluginJson(pluginJsonFile);
  const report: PluginBuildReport = {
    plugin: pluginMeta,
    packages: packageInfo,
    workflow: agregateWorkflowInfo(),
    coverage: agregateCoverageInfo(),
    tests: agregateTestInfo(),
  };
  const pr = process.env.CIRCLE_PULL_REQUEST;
  if (pr) {
    report.pullRequest = pr;
  }

  // Save the report to disk
  const file = path.resolve(ciDir, 'report.json');
  fs.writeFile(file, JSON.stringify(report, null, 2), err => {
    if (err) {
      throw new Error('Unable to write: ' + file);
    }
  });

  if (pr) {
    console.log('TODO... notify', pr);
    return;
  }

  console.log('Initalizing S3 Client');
  const s3 = new S3Client();

  const build = pluginMeta.info.build;
  if (!build) {
    throw new Error('Metadata missing build info');
  }
  const version = (pluginMeta as any).version || 'unknown';
  const branch = build.branch || 'unknown';
  const hash = build.hash!.substring(0, 8);
  const root = `dev/${pluginMeta.id}`;

  const jobPath = `${branch}/${hash}/job.json`;
  const jobKey = `${root}/${jobPath}`;
  if (await s3.exits(jobKey)) {
    throw new Error('Job already registered: ' + jobKey);
  }
  const indexKey = `${root}/index.json`;
  console.log('Read', indexKey);
  const index = await s3.readJSON(indexKey, {});
  (index as any)[branch] = {
    time: build.time,
    version,
    last: jobPath,
  };

  console.log('Write Job', jobKey);
  await s3.writeJSON(jobKey, report, {
    Tagging: `version=${version}&type=${pluginMeta.type}`,
  });

  const historyKey = `${root}/${branch}/history.json`;
  console.log('Read', historyKey);
  const history: PluginHistory = await s3.readJSON(historyKey, defaultPluginHistory);
  appendPluginHistory(report, `${branch}/${hash}`, history);

  await s3.writeJSON(historyKey, history);
  console.log('wrote history');
  await s3.writeJSON(indexKey, index);
  console.log('wrote index');
};

export const ciPluginReportTask = new Task<PluginCIOptions>('Generate Plugin Report', pluginReportRunner);
