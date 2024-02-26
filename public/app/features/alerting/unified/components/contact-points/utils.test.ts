import { GrafanaManagedContactPoint } from 'app/plugins/datasource/alertmanager/types';

import { ReceiverTypes } from '../receivers/grafanaAppReceivers/onCall/onCall';

import { RECEIVER_META_KEY, RECEIVER_PLUGIN_META_KEY } from './useContactPoints';
import {
  ReceiverConfigWithMetadata,
  getReceiverDescription,
  isAutoGeneratedPolicy,
  isProvisioned,
  summarizeEmailAddresses,
} from './utils';

describe('isProvisioned', () => {
  it('should return true when at least one receiver is provisioned', () => {
    const contactPoint: GrafanaManagedContactPoint = {
      name: 'my-contact-point',
      grafana_managed_receiver_configs: [
        { name: 'email', provenance: 'api', type: 'email', disableResolveMessage: false, settings: {} },
      ],
    };

    expect(isProvisioned(contactPoint)).toBe(true);
  });

  it('should return false when no receiver was provisioned', () => {
    const contactPoint: GrafanaManagedContactPoint = {
      name: 'my-contact-point',
      grafana_managed_receiver_configs: [
        { name: 'email', provenance: undefined, type: 'email', disableResolveMessage: false, settings: {} },
      ],
    };

    expect(isProvisioned(contactPoint)).toBe(false);
  });
});

describe('isAutoGeneratedPolicy', () => {
  it('should return false when not enabled', () => {
    expect(isAutoGeneratedPolicy({})).toBe(false);
  });
});

describe('getReceiverDescription', () => {
  it('should show multiple email addresses', () => {
    const receiver: ReceiverConfigWithMetadata = {
      name: 'email',
      provenance: undefined,
      type: 'email',
      disableResolveMessage: false,
      settings: { addresses: 'test1@test.com,test2@test.com,test3@test.com,test4@test.com' },
      [RECEIVER_META_KEY]: {
        name: 'Email',
        description: 'The email receiver',
      },
    };

    expect(getReceiverDescription(receiver)).toBe('test1@test.com, test2@test.com, test3@test.com, +1 more');
  });

  it('should work for Slack', () => {
    const output = '#channel';
    const receiver1: ReceiverConfigWithMetadata = {
      name: 'slack',
      provenance: undefined,
      type: 'slack',
      disableResolveMessage: false,
      settings: { recipient: '#channel' },
      [RECEIVER_META_KEY]: {
        name: 'Slack',
        description: 'The Slack receiver',
      },
    };

    const receiver2: ReceiverConfigWithMetadata = {
      name: 'slack',
      provenance: undefined,
      type: 'slack',
      disableResolveMessage: false,
      settings: { recipient: 'channel' },
      [RECEIVER_META_KEY]: {
        name: 'Slack',
        description: 'The Slack receiver',
      },
    };

    expect(getReceiverDescription(receiver1)).toBe(output);
    expect(getReceiverDescription(receiver2)).toBe(output);
  });

  it('should work for OnCall', () => {
    const output = 'The OnCall receiver';
    const input: ReceiverConfigWithMetadata = {
      name: 'my oncall',
      provenance: undefined,
      type: ReceiverTypes.OnCall,
      disableResolveMessage: false,
      settings: {},
      [RECEIVER_PLUGIN_META_KEY]: {
        description: output,
        icon: '',
        title: '',
      },
      [RECEIVER_META_KEY]: {
        name: '',
      },
    };

    expect(getReceiverDescription(input)).toBe(output);
  });

  it('should work for any type', () => {
    const output = 'Some description of the receiver';
    const input: ReceiverConfigWithMetadata = {
      name: 'some receiver',
      provenance: undefined,
      type: 'some',
      disableResolveMessage: false,
      settings: {},
      [RECEIVER_META_KEY]: {
        name: 'Some Receiver',
        description: output,
      },
    };

    expect(getReceiverDescription(input)).toBe(output);
  });

  it('should work for any type with no description', () => {
    const input: ReceiverConfigWithMetadata = {
      name: 'some receiver',
      provenance: undefined,
      type: 'some',
      disableResolveMessage: false,
      settings: {},
      [RECEIVER_META_KEY]: {
        name: 'Some Receiver',
      },
    };

    expect(getReceiverDescription(input)).toBe(undefined);
  });
});

describe('summarizeEmailAddresses', () => {
  it('should work with one email address', () => {
    expect(summarizeEmailAddresses('test@test.com')).toBe('test@test.com');
  });

  it('should work with multiple types of separators', () => {
    const output = 'foo@foo.com, bar@bar.com';

    expect(summarizeEmailAddresses('foo@foo.com,   bar@bar.com')).toBe(output);
    expect(summarizeEmailAddresses(' foo@foo.com;  bar@bar.com')).toBe(output);
    expect(summarizeEmailAddresses('foo@foo.com\n bar@bar.com  ')).toBe(output);
  });
});
