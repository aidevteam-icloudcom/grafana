import { DataQuery } from '@grafana/schema';

export type QueryTemplate = {
  uid: string;
  title: string;
  targets: DataQuery[];
  createdAtTimestamp: number;
  createdBy: string;
};

export type AddQueryTemplateCommand = {
  title: string;
  targets: DataQuery[];
};
