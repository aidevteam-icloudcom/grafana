export const routeTimingsFields = {
  groupWait: {
    label: 'Group wait',
    description:
      'The waiting time before sending the first notification for a new group of alerts. If empty it will be inherited from the parent policy.',
    ariaLabel: 'Group wait value',
  },
  groupInterval: {
    label: 'Group interval',
    description:
      'The waiting time before sending a notification about changes in the alert group after the first notification has been sent. If empty it will be inherited from the parent policy.',
    ariaLabel: 'Group interval value',
  },
  repeatInterval: {
    label: 'Repeat interval',
    description: 'The waiting time before resending a notification that has already been sent successfully.',
    ariaLabel: 'Repeat interval value',
  },
};
