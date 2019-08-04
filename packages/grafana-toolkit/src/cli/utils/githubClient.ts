import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const baseURL = 'https://api.github.com/repos/grafana/grafana';

// Encapsulates the creation of a client for the Github API
//
// Two key things:
// 1. You can specify whenever you want the credentials to be required or not when imported.
// 2. If the the credentials are available as part of the environment, even if
// they're not required - the library will use them. This allows us to overcome
// any API rate limiting imposed without authentication.

class GithubClient {
  client: AxiosInstance;

  constructor(required = false) {
    const username = process.env.GITHUB_USERNAME;
    const token = process.env.GITHUB_ACCESS_TOKEN;

    const clientConfig: AxiosRequestConfig = {
      baseURL: baseURL,
      timeout: 10000,
    };

    if (required && !username && !token) {
      throw new Error('operation needs a GITHUB_USERNAME and GITHUB_ACCESS_TOKEN environment variables');
    }

    if (username && token) {
      clientConfig.auth = { username: username, password: token };
    }

    this.client = this.createClient(clientConfig);
  }

  private createClient(clientConfig: AxiosRequestConfig) {
    return axios.create(clientConfig);
  }

  public async getIssues(state = 'open', milestone: string, perPage = 100, ...labels: string[]) {
    const fields = {
      state: state,
      per_page: perPage,
      milestone: milestone,
      labels: labels.join(','),
    };
    const res = await this.client.get('/issues', { params: fields });
    return res.data;
  }
}

export default GithubClient;
